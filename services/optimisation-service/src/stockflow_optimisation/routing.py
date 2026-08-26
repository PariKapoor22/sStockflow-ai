from __future__ import annotations

import os
from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt
from typing import Any

import httpx
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from ortools.linear_solver import pywraplp


VEHICLE_FACTORS_KG_PER_KM = {
    "electric": 0.05,
    "cng": 0.20,
    "diesel": 0.27,
    "petrol": 0.25,
}
VEHICLE_COST_INR_PER_KM = {
    "electric": 28.0,
    "cng": 34.0,
    "diesel": 42.0,
    "petrol": 45.0,
}
KNOWN_COORDINATES = {
    "Chennai Central": (13.0827, 80.2707),
    "Bengaluru North": (13.0358, 77.5970),
    "Mysuru DC": (12.2958, 76.6394),
    "Hyderabad Hub": (17.3850, 78.4867),
    "Nellore Cross-dock": (14.4426, 79.9865),
    "Salem Hub": (11.6643, 78.1460),
    "Coimbatore West": (11.0168, 76.9558),
    "Mandya Drop": (12.5218, 76.8951),
}


def _point_in_ring(longitude: float, latitude: float, ring: list[list[float]]) -> bool:
    inside = False
    previous = len(ring) - 1
    for current, coordinate in enumerate(ring):
        x1, y1 = ring[current][:2]
        x2, y2 = ring[previous][:2]
        if (y1 > latitude) != (y2 > latitude):
            intersection = (x2 - x1) * (latitude - y1) / ((y2 - y1) or 1e-12) + x1
            if longitude < intersection:
                inside = not inside
        previous = current
    return inside


def _geometry_affects(longitude: float, latitude: float, geometry: dict[str, Any]) -> bool:
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    if geometry_type == "Point" and len(coordinates) >= 2:
        return haversine_km((latitude, longitude), (float(coordinates[1]), float(coordinates[0]))) <= 75
    if geometry_type == "Polygon":
        return bool(coordinates and _point_in_ring(longitude, latitude, coordinates[0]))
    if geometry_type == "MultiPolygon":
        return any(polygon and _point_in_ring(longitude, latitude, polygon[0]) for polygon in coordinates)
    return False


def apply_hazard_alerts(payload: dict[str, Any], alerts: list[dict[str, Any]]) -> list[str]:
    """Overlay configured LHASA/GloFAS GeoJSON outlooks onto route stop risk inputs."""
    applied_sources: set[str] = set()
    for route in payload.get("routes", []):
        for stop in route.get("stopDetails", []):
            latitude, longitude = stop.get("latitude"), stop.get("longitude")
            if latitude is None or longitude is None:
                continue
            for alert in alerts:
                geometry = alert.get("geometry") or {}
                if not _geometry_affects(float(longitude), float(latitude), geometry):
                    continue
                score = float(alert.get("probability") or {
                    "EXTREME": 1.0, "HIGH": 0.8, "MEDIUM": 0.5, "LOW": 0.25,
                }.get(str(alert.get("severity", "MEDIUM")).upper(), 0.5))
                hazard_type = str(alert.get("hazardType", "")).upper()
                field = {"FLOOD": "floodRisk", "LANDSLIDE": "landslideRisk", "ROAD_BLOCK": "roadBlockRisk"}.get(hazard_type)
                if field:
                    stop[field] = max(float(stop.get(field, 0)), min(max(score, 0), 1))
                    applied_sources.add(str(alert.get("source") or alert.get("model") or hazard_type))
    return sorted(applied_sources)


def vehicle_family(vehicle: str) -> str:
    normalized = vehicle.lower()
    return next((name for name in VEHICLE_FACTORS_KG_PER_KM if name in normalized), "diesel")


def haversine_km(left: tuple[float, float], right: tuple[float, float]) -> float:
    lat1, lon1 = map(radians, left)
    lat2, lon2 = map(radians, right)
    dlat, dlon = lat2 - lat1, lon2 - lon1
    value = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371.0088 * 2 * asin(sqrt(value))


def risk_penalty(item: dict[str, Any]) -> float:
    """Teammate risk contract: flood 30%, landslide 30%, road block 40%."""
    return round(
        float(item.get("floodRisk", 0)) * 30
        + float(item.get("landslideRisk", 0)) * 30
        + float(item.get("roadBlockRisk", 0)) * 40,
        2,
    )


def _shortest_path(start: str, end: str, roads: list[dict[str, Any]], objective: str) -> dict[str, Any] | None:
    """Dijkstra graph support ported from the supplied teammate implementation."""
    from heapq import heappop, heappush

    graph: dict[str, list[tuple[str, float, dict[str, Any]]]] = {}
    for road in roads:
        if road.get("closed"):
            continue
        hazard = risk_penalty(road)
        if objective == "Fastest service recovery":
            weight = float(road["durationMin"]) + hazard
        elif objective == "Safest route":
            weight = float(road["distanceKm"]) + hazard * 2
        elif objective in {"Greenest route", "Lowest carbon impact"}:
            weight = float(road["distanceKm"]) * 0.7 + hazard * 0.8
        else:
            weight = float(road["distanceKm"]) + hazard
        graph.setdefault(str(road["fromNode"]), []).append((str(road["toNode"]), weight, road))

    distance = {start: 0.0}
    previous: dict[str, tuple[str, dict[str, Any]]] = {}
    queue: list[tuple[float, str]] = [(0.0, start)]
    while queue:
        current, node = heappop(queue)
        if current > distance.get(node, float("inf")):
            continue
        if node == end:
            break
        for neighbour, weight, road in graph.get(node, []):
            candidate = current + weight
            if candidate < distance.get(neighbour, float("inf")):
                distance[neighbour] = candidate
                previous[neighbour] = (node, road)
                heappush(queue, (candidate, neighbour))
    if end not in distance:
        return None

    path: list[dict[str, Any]] = []
    node = end
    while node != start:
        node, road = previous[node]
        path.append(road)
    path.reverse()
    return {
        "distanceKm": sum(float(edge["distanceKm"]) for edge in path),
        "durationMin": sum(float(edge["durationMin"]) for edge in path),
        "riskPenalty": sum(risk_penalty(edge) for edge in path),
        "nodes": [start, *[str(edge["toNode"]) for edge in path]],
    }


def _stop_details(route: dict[str, Any]) -> list[dict[str, Any]]:
    supplied = route.get("stopDetails") or []
    by_name = {str(item["name"]): item for item in supplied}
    stops = list(route["stops"])
    delivery_count = max(len(stops) - 1, 1)
    default_demand = float(route["loadKg"]) / delivery_count
    details: list[dict[str, Any]] = []
    for index, name in enumerate(stops):
        item = dict(by_name.get(name, {}))
        coordinate = KNOWN_COORDINATES.get(name)
        item.setdefault("name", name)
        if coordinate:
            item.setdefault("latitude", coordinate[0])
            item.setdefault("longitude", coordinate[1])
        item.setdefault("demandKg", 0.0 if index == 0 else default_demand)
        item.setdefault("serviceMinutes", 0 if index in {0, len(stops) - 1} else 20)
        item.setdefault("earliestMinutes", int(route.get("departureMinutes", 0)))
        promised = route.get("promisedDeliveryMinutes")
        item.setdefault("latestMinutes", int(promised) if promised is not None else 2879)
        item.setdefault("floodRisk", float(route.get("floodRisk", 0)))
        item.setdefault("landslideRisk", float(route.get("landslideRisk", 0)))
        item.setdefault("roadBlockRisk", float(route.get("roadBlockRisk", 0)))
        details.append(item)
    return details


def _google_matrix(stops: list[dict[str, Any]]) -> tuple[list[list[float]], list[list[float]]] | None:
    key = os.getenv("GOOGLE_MAPS_BACKEND_API_KEY", "").strip()
    if not key or any(item.get("latitude") is None or item.get("longitude") is None for item in stops):
        return None
    waypoints = [{"waypoint": {"location": {"latLng": {
        "latitude": item["latitude"], "longitude": item["longitude"]
    }}}} for item in stops]
    payload = {
        "origins": waypoints,
        "destinations": waypoints,
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
        "departureTime": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    try:
        response = httpx.post(
            "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
            json=payload,
            headers={
                "X-Goog-Api-Key": key,
                "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration,status,condition",
            },
            timeout=20,
        )
        response.raise_for_status()
        rows = response.json()
        size = len(stops)
        distance = [[0.0 for _ in range(size)] for _ in range(size)]
        duration = [[0.0 for _ in range(size)] for _ in range(size)]
        for row in rows:
            origin, destination = int(row["originIndex"]), int(row["destinationIndex"])
            if origin == destination:
                continue
            distance[origin][destination] = float(row.get("distanceMeters", 0)) / 1000
            raw_duration = str(row.get("duration", "0s")).removesuffix("s")
            duration[origin][destination] = float(raw_duration or 0) / 60
        if any(distance[i][j] <= 0 for i in range(size) for j in range(size) if i != j):
            return None
        return distance, duration
    except (httpx.HTTPError, KeyError, TypeError, ValueError):
        return None


def _matrices(route: dict[str, Any], stops: list[dict[str, Any]], roads: list[dict[str, Any]], objective: str) -> tuple[list[list[float]], list[list[float]], list[list[float]], str]:
    size = len(stops)
    distance = [[0.0 for _ in range(size)] for _ in range(size)]
    duration = [[0.0 for _ in range(size)] for _ in range(size)]
    risk = [[0.0 for _ in range(size)] for _ in range(size)]

    if roads:
        complete = True
        for left in range(size):
            for right in range(size):
                if left == right:
                    continue
                path = _shortest_path(stops[left]["name"], stops[right]["name"], roads, objective)
                if path is None:
                    complete = False
                    break
                distance[left][right] = path["distanceKm"]
                duration[left][right] = path["durationMin"]
                risk[left][right] = path["riskPenalty"]
            if not complete:
                break
        if complete:
            return distance, duration, risk, "SUPPLIED_RISK_AWARE_ROAD_GRAPH"

    google = _google_matrix(stops)
    if google:
        distance, duration = google
        for left in range(size):
            for right in range(size):
                if left != right:
                    risk[left][right] = risk_penalty(stops[right])
        return distance, duration, risk, "GOOGLE_ROUTES_TRAFFIC_MATRIX"

    if all(item.get("latitude") is not None and item.get("longitude") is not None for item in stops):
        for left in range(size):
            for right in range(size):
                if left == right:
                    continue
                direct = haversine_km(
                    (float(stops[left]["latitude"]), float(stops[left]["longitude"])),
                    (float(stops[right]["latitude"]), float(stops[right]["longitude"])),
                )
                distance[left][right] = direct * 1.18
                duration[left][right] = distance[left][right] / 50 * 60
                risk[left][right] = risk_penalty(stops[right])
        return distance, duration, risk, "GEODESIC_1_18_FALLBACK"

    adjacent = float(route["baselineKm"]) / max(size - 1, 1)
    for left in range(size):
        for right in range(size):
            if left == right:
                continue
            distance[left][right] = adjacent * abs(right - left)
            duration[left][right] = distance[left][right] / 50 * 60
            risk[left][right] = risk_penalty(stops[right])
    return distance, duration, risk, "BASELINE_DISTANCE_FALLBACK"


def _arc_score(objective: str, distance: float, duration: float, hazard: float, family: str) -> int:
    carbon = distance * VEHICLE_FACTORS_KG_PER_KM[family]
    cost = distance * VEHICLE_COST_INR_PER_KM[family]
    weights = {
        "Balanced cost and carbon": (1.0, 0.5, 0.5, 2.0),
        "Lowest transport cost": (0.3, 0.2, 1.0, 2.0),
        "Lowest carbon impact": (0.4, 0.2, 0.1, 5.0),
        "Greenest route": (0.4, 0.2, 0.1, 5.0),
        "Fastest service recovery": (0.2, 2.0, 0.1, 2.0),
        "Safest route": (0.3, 0.3, 0.1, 20.0),
        "Shortest path": (2.0, 0.1, 0.0, 1.0),
    }[objective]
    value = distance * weights[0] + duration * weights[1] + cost * weights[2] / 10 + (hazard + carbon) * weights[3]
    return max(1, round(value * 100))


def _precheck(route: dict[str, Any], vehicle_filter: str) -> str | None:
    if float(route["loadKg"]) > float(route["capacityKg"]):
        return "Vehicle payload capacity exceeded"
    if not route.get("vehicleAvailable", True):
        return "Vehicle is unavailable"
    if route.get("coldChainRequired", False) and not route.get("coldChainAvailable", True):
        return "Cold-chain capability is required but unavailable"
    if route.get("warehouseStockKg") is not None and float(route["warehouseStockKg"]) < float(route["loadKg"]):
        return "Warehouse stock is below the planned load"
    if route.get("roadClosed", False):
        return "The candidate route is marked closed"
    if vehicle_filter == "Cold-chain vehicles only" and not route.get("coldChainAvailable", True):
        return "Vehicle filter requires cold-chain capability"
    if vehicle_filter == "High-capacity fleet only" and float(route["capacityKg"]) < 10_000:
        return "Vehicle filter requires at least 10,000 kg capacity"
    if vehicle_filter == "Electric and CNG preferred" and vehicle_family(str(route["vehicle"])) not in {"electric", "cng"}:
        return "Vehicle filter permits only electric or CNG vehicles"
    return None


def _vehicle_allowed(job: dict[str, Any], vehicle: dict[str, Any], vehicle_filter: str) -> bool:
    family = vehicle_family(str(vehicle["vehicle"]))
    if not vehicle.get("vehicleAvailable", True):
        return False
    if float(vehicle["capacityKg"]) < float(job["loadKg"]):
        return False
    if job.get("coldChainRequired", False) and not vehicle.get("coldChainAvailable", True):
        return False
    if vehicle_filter == "Cold-chain vehicles only" and not vehicle.get("coldChainAvailable", True):
        return False
    if vehicle_filter == "High-capacity fleet only" and float(vehicle["capacityKg"]) < 10_000:
        return False
    if vehicle_filter == "Electric and CNG preferred" and family not in {"electric", "cng"}:
        return False
    return True


def _assign_fleet(routes: list[dict[str, Any]], objective: str, vehicle_filter: str) -> dict[int, int]:
    """Assign every feasible route job to at most one available vehicle with OR-Tools SCIP."""
    solver = pywraplp.Solver.CreateSolver("SCIP")
    if solver is None:
        raise RuntimeError("OR-Tools SCIP is unavailable for vehicle assignment")
    variables: dict[tuple[int, int], pywraplp.Variable] = {}
    for job_index, job in enumerate(routes):
        for vehicle_index, vehicle in enumerate(routes):
            if job.get("lockVehicle", False) and vehicle_index != job_index:
                continue
            if _vehicle_allowed(job, vehicle, vehicle_filter):
                variables[job_index, vehicle_index] = solver.BoolVar(f"assign_{job_index}_{vehicle_index}")
    for job_index in range(len(routes)):
        eligible = [variable for (job, _), variable in variables.items() if job == job_index]
        if eligible:
            solver.Add(sum(eligible) == 1)
    for vehicle_index in range(len(routes)):
        solver.Add(sum(variable for (_, vehicle), variable in variables.items() if vehicle == vehicle_index) <= 1)

    objective_fn = solver.Objective()
    for (job_index, vehicle_index), variable in variables.items():
        job, vehicle = routes[job_index], routes[vehicle_index]
        family = vehicle_family(str(vehicle["vehicle"]))
        distance = float(job["baselineKm"])
        cost = distance * VEHICLE_COST_INR_PER_KM[family]
        carbon = distance * VEHICLE_FACTORS_KG_PER_KM[family]
        utilization_penalty = (float(vehicle["capacityKg"]) - float(job["loadKg"])) / max(float(vehicle["capacityKg"]), 1) * 100
        coefficient = {
            "Lowest transport cost": cost,
            "Lowest carbon impact": carbon * 1000,
            "Greenest route": carbon * 1000,
            "Fastest service recovery": utilization_penalty * 10 + distance,
            "Safest route": risk_penalty(job) * 1000 + cost / 10,
            "Shortest path": distance * 100,
            "Balanced cost and carbon": cost / 2 + carbon * 500,
        }[objective]
        objective_fn.SetCoefficient(variable, coefficient + vehicle_index * 0.001)
    objective_fn.SetMinimization()
    if solver.Solve() not in {pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE}:
        return {}
    return {
        job_index: vehicle_index
        for (job_index, vehicle_index), variable in variables.items()
        if variable.solution_value() > 0.5
    }


def optimise_route_candidate(route: dict[str, Any], objective: str, vehicle_filter: str, roads: list[dict[str, Any]]) -> tuple[dict[str, Any] | None, str | None]:
    rejected = _precheck(route, vehicle_filter)
    if rejected:
        return None, rejected
    stops = _stop_details(route)
    distance, duration, hazard, provider = _matrices(route, stops, roads, objective)
    size = len(stops)
    family = vehicle_family(str(route["vehicle"]))
    manager = pywrapcp.RoutingIndexManager(size, 1, [0], [size - 1])
    routing = pywrapcp.RoutingModel(manager)

    def cost_callback(from_index: int, to_index: int) -> int:
        left, right = manager.IndexToNode(from_index), manager.IndexToNode(to_index)
        return _arc_score(objective, distance[left][right], duration[left][right], hazard[left][right], family)

    cost_index = routing.RegisterTransitCallback(cost_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(cost_index)

    def demand_callback(index: int) -> int:
        return round(float(stops[manager.IndexToNode(index)].get("demandKg", 0)) * 100)

    demand_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_index, 0, [round(float(route["capacityKg"]) * 100)], True, "Capacity"
    )

    def time_callback(from_index: int, to_index: int) -> int:
        left, right = manager.IndexToNode(from_index), manager.IndexToNode(to_index)
        return max(1, round(duration[left][right] + float(stops[left].get("serviceMinutes", 0))))

    time_index = routing.RegisterTransitCallback(time_callback)
    routing.AddDimension(time_index, 60, 2880, False, "Time")
    time_dimension = routing.GetDimensionOrDie("Time")
    for node, stop in enumerate(stops):
        index = routing.End(0) if node == size - 1 else manager.NodeToIndex(node)
        time_dimension.CumulVar(index).SetRange(int(stop["earliestMinutes"]), int(stop["latestMinutes"]))

    search = pywrapcp.DefaultRoutingSearchParameters()
    search.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search.time_limit.seconds = 2
    solution = routing.SolveWithParameters(search)
    if solution is None:
        return None, "No capacity- and time-window-feasible route exists"

    order: list[int] = []
    total_distance = total_duration = total_hazard = 0.0
    index = routing.Start(0)
    arrival_minutes = int(solution.Value(time_dimension.CumulVar(index)))
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        order.append(node)
        next_index = solution.Value(routing.NextVar(index))
        next_node = manager.IndexToNode(next_index)
        total_distance += distance[node][next_node]
        total_duration += duration[node][next_node]
        total_hazard += hazard[node][next_node]
        index = next_index
    order.append(manager.IndexToNode(index))
    arrival_minutes = int(solution.Value(time_dimension.CumulVar(index)))

    load_factor = 0.5 + 0.5 * min(float(route["loadKg"]) / float(route["capacityKg"]), 1.0)
    co2 = total_distance * VEHICLE_FACTORS_KG_PER_KM[family] * load_factor
    baseline_co2 = float(route["baselineKm"]) * VEHICLE_FACTORS_KG_PER_KM[family] * load_factor
    cost = total_distance * VEHICLE_COST_INR_PER_KM[family]
    ordered_names = [stops[node]["name"] for node in order]
    constraints = [
        "VEHICLE_CAPACITY", "VEHICLE_AVAILABILITY", "COLD_CHAIN_COMPATIBILITY",
        "WAREHOUSE_STOCK", "DELIVERY_TIME_WINDOWS", "CLOSED_ROAD_EXCLUSION",
        "FLOOD_LANDSLIDE_ROAD_BLOCK_RISK", "HUMAN_APPROVAL_REQUIRED",
    ]
    return {
        **route,
        "stops": ordered_names,
        "optimizedKm": round(total_distance, 1),
        "duration": f"{int(total_duration // 60)}h {round(total_duration % 60):02d}m",
        "durationMinutes": round(total_duration),
        "arrivalMinutes": arrival_minutes,
        "arrivalTime": f"{(arrival_minutes // 60) % 24:02d}:{arrival_minutes % 60:02d}",
        "costInr": round(cost),
        "co2Kg": round(co2, 2),
        "co2SavedKg": round(max(baseline_co2 - co2, 0), 2),
        "vehicleFamily": family,
        "hazardPenalty": round(total_hazard, 2),
        "matrixProvider": provider,
        "solver": "GOOGLE_OR_TOOLS_GUIDED_LOCAL_SEARCH",
        "constraintsChecked": constraints,
        "status": "Optimized" if route.get("status") == "Draft" else route.get("status", "Optimized"),
        "explanation": [
            f"OR-Tools selected the stop sequence for {objective.lower()}.",
            f"Road costs came from {provider.replace('_', ' ').lower()}.",
            f"Load utilization is {float(route['loadKg']) / float(route['capacityKg']) * 100:.1f}%.",
            f"Hazard penalty is {total_hazard:.2f}; closed roads were excluded when a road graph was supplied.",
            "Human approval remains required before dispatch.",
        ],
    }, None


def optimise_vehicle_routes(payload: dict[str, Any]) -> dict[str, Any]:
    results, rejected = [], []
    routes = payload["routes"]
    assignments = _assign_fleet(routes, payload["objective"], payload.get("vehicleType", "All eligible vehicles"))
    for job_index, route in enumerate(routes):
        vehicle_index = assignments.get(job_index)
        if vehicle_index is None:
            available = [item for item in routes if item.get("vehicleAvailable", True)]
            if available and float(route["loadKg"]) > max(float(item["capacityKg"]) for item in available):
                reason = "Vehicle payload capacity exceeded"
            elif route.get("coldChainRequired", False) and not any(item.get("coldChainAvailable", True) for item in available):
                reason = "Cold-chain capability is required but unavailable"
            else:
                reason = "No eligible available vehicle could be allocated"
            rejected.append({"id": route["id"], "reason": reason})
            continue
        vehicle = routes[vehicle_index]
        assigned_route = {
            **route,
            "originalVehicle": route["vehicle"],
            "vehicle": vehicle["vehicle"],
            "capacityKg": vehicle["capacityKg"],
            "vehicleAvailable": vehicle.get("vehicleAvailable", True),
            "coldChainAvailable": vehicle.get("coldChainAvailable", True),
            "assignedVehicleId": vehicle["id"],
        }
        result, reason = optimise_route_candidate(
            assigned_route, payload["objective"], payload.get("vehicleType", "All eligible vehicles"), payload.get("roadNetwork", [])
        )
        if result:
            result["constraintsChecked"] = ["MULTI_VEHICLE_ALLOCATION", *result["constraintsChecked"]]
            results.append(result)
        else:
            rejected.append({"id": route["id"], "reason": reason})
    results.sort(key=lambda item: (item["hazardPenalty"], item["costInr"], item["co2Kg"]))
    providers = sorted({item["matrixProvider"] for item in results})
    return {
        "routes": results,
        "rejected": rejected,
        "solver": "GOOGLE_OR_TOOLS_GUIDED_LOCAL_SEARCH",
        "matrixProviders": providers,
        "features": [
            "Multi-vehicle allocation", "Automatic multi-stop sequencing", "Vehicle capacity", "Vehicle availability",
            "Cold-chain compatibility", "Warehouse stock", "Delivery time windows",
            "Google traffic matrix with safe fallback", "Risk-aware supplied road graph",
            "Closed-road exclusion", "Carbon and transport-cost scoring",
        ],
        "limitations": [
            "Hazard avoidance is only as current as the supplied hazard/road graph",
            "Fallback distances are estimates when Google Routes is unavailable",
            "Human approval is required before dispatch",
        ],
    }
