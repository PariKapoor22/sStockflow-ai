import os
from math import ceil
from typing import Literal
from heapq import heappush, heappop

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from geopy.distance import geodesic
from pydantic import BaseModel, Field


def configured_origins() -> list[str]:
    raw = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:4200,http://127.0.0.1:4200,https://stockflow-ai-oveyj.pages.dev",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app = FastAPI(
    title="StockFlow Route and Carbon Service",
    description="Explainable risk-aware route, vehicle-capacity and carbon calculations for StockFlow AI.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-Tenant-ID"],
)

VEHICLE_FACTORS_KG_PER_KM = {
    "electric": 0.05,
    "cng": 0.20,
    "diesel": 0.27,
    "petrol": 0.25,
}

FUEL_FACTORS_KG_PER_LITRE = {
    "diesel": 2.68,
    "petrol": 2.31,
    "cng": 2.00,
    "electric": 0.0,
}

COST_PER_KM = {
    "electric": 28,
    "cng": 34,
    "diesel": 42,
    "petrol": 45,
}


def require_tenant(tenant_id: str) -> str:
    normalized = tenant_id.strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="X-Tenant-ID is required")
    return normalized


# ============================================================
# DATA MODELS
# ============================================================

class RoadEdge(BaseModel):
    fromNode: str
    toNode: str
    distanceKm: float = Field(gt=0)
    durationMin: float = Field(gt=0)
    closed: bool = False

    # Hazard scores: 0 = no risk, 1 = maximum risk
    floodRisk: float = Field(default=0, ge=0, le=1)
    landslideRisk: float = Field(default=0, ge=0, le=1)
    roadBlockRisk: float = Field(default=0, ge=0, le=1)


class RouteCandidate(BaseModel):
    id: str
    lane: str
    stops: list[str] = Field(min_length=2)
    vehicle: str

    loadKg: float = Field(ge=0)
    capacityKg: float = Field(gt=0)
    baselineKm: float = Field(gt=0)

    priority: str = "Medium"
    status: str = "Draft"

    # --------------------------------------------------------
    # New logistics constraints
    # --------------------------------------------------------

    pickupNode: str | None = None
    deliveryNode: str | None = None

    vehicleAvailable: bool = True

    coldChainRequired: bool = False
    coldChainAvailable: bool = True

    # Minutes from midnight
    promisedDeliveryMinutes: int | None = Field(
        default=None,
        ge=0,
        le=1439,
    )

    departureMinutes: int = Field(
        default=0,
        ge=0,
        le=1439,
    )

    # Optional warehouse stock quantity
    warehouseStockKg: float | None = Field(
        default=None,
        ge=0,
    )

    # --------------------------------------------------------
    # Hazard information
    # Normally supplied by the hazard intelligence service.
    # --------------------------------------------------------

    floodRisk: float = Field(default=0, ge=0, le=1)
    landslideRisk: float = Field(default=0, ge=0, le=1)
    roadBlockRisk: float = Field(default=0, ge=0, le=1)

    roadClosed: bool = False


class OptimiseRoutesRequest(BaseModel):
    objective: Literal[
        "Balanced cost and carbon",
        "Lowest transport cost",
        "Lowest carbon impact",
        "Fastest service recovery",
        "Safest route",
        "Shortest path",
        "Greenest route",
    ] = "Balanced cost and carbon"

    vehicleType: str = "All eligible vehicles"

    routes: list[RouteCandidate] = Field(
        min_length=1,
        max_length=100,
    )

    # Optional road graph.
    # If supplied, Dijkstra shortest-path routing is used.
    roadNetwork: list[RoadEdge] = Field(
        default_factory=list
    )


class CoordinateRouteRequest(BaseModel):
    originLat: float = Field(ge=-90, le=90)
    originLon: float = Field(ge=-180, le=180)

    destinationLat: float = Field(ge=-90, le=90)
    destinationLon: float = Field(ge=-180, le=180)

    mileageKmPerLitre: float = Field(gt=0)

    fuelType: Literal[
        "Diesel",
        "Petrol",
        "Electric",
        "CNG",
    ]


class CarbonRequest(BaseModel):
    distanceKm: float = Field(ge=0)

    vehicleType: Literal[
        "diesel",
        "petrol",
        "electric",
        "cng",
    ]

    loadKg: float = Field(
        default=0,
        ge=0,
    )

    capacityKg: float = Field(
        default=1,
        gt=0,
    )

    trips: int = Field(
        default=1,
        ge=1,
    )

    baselineDistanceKm: float | None = Field(
        default=None,
        ge=0,
    )


class TransferRecommendationRequest(BaseModel):
    sourceAvailable: float = Field(ge=0)
    sourceSafetyStock: float = Field(ge=0)
    destinationShortage: float = Field(ge=0)

    vehicleCapacity: float = Field(gt=0)
    distanceKm: float = Field(gt=0)

    vehicleType: Literal[
        "diesel",
        "petrol",
        "electric",
        "cng",
    ] = "diesel"

    unitValue: float = Field(
        default=0,
        ge=0,
    )

    transportCost: float = Field(
        default=0,
        ge=0,
    )


# ============================================================
# VEHICLE + CARBON HELPERS
# ============================================================

def vehicle_family(vehicle: str) -> str:
    normalized = vehicle.lower()

    return next(
        (
            name
            for name in VEHICLE_FACTORS_KG_PER_KM
            if name in normalized
        ),
        "diesel",
    )


def load_adjustment(
    load_kg: float,
    capacity_kg: float,
) -> float:
    ratio = min(
        max(load_kg / capacity_kg, 0.0),
        1.0,
    )

    return 0.5 + 0.5 * ratio


def carbon_result(
    distance_km: float,
    vehicle_type: str,
    load_kg: float,
    capacity_kg: float,
    trips: int = 1,
    baseline_distance_km: float | None = None,
) -> dict:

    factor = VEHICLE_FACTORS_KG_PER_KM[vehicle_type]

    adjustment = load_adjustment(
        load_kg,
        capacity_kg,
    )

    emissions = (
        distance_km
        * factor
        * adjustment
        * trips
    )

    baseline_distance = (
        baseline_distance_km
        if baseline_distance_km is not None
        else distance_km
    )

    baseline = (
        baseline_distance
        * factor
        * adjustment
        * trips
    )

    avoided = max(
        baseline - emissions,
        0.0,
    )

    return {
        "distanceKm": round(
            distance_km,
            2,
        ),
        "vehicleType": vehicle_type,
        "emissionFactorKgPerKm": factor,
        "loadFactor": round(
            adjustment,
            4,
        ),
        "trips": trips,
        "emissionsKgCo2e": round(
            emissions,
            2,
        ),
        "baselineEmissionsKgCo2e": round(
            baseline,
            2,
        ),
        "emissionsAvoidedKgCo2e": round(
            avoided,
            2,
        ),
        "method": (
            "distance × vehicle factor × "
            "load adjustment × trips"
        ),
        "classification": "prototype estimate",
    }


# ============================================================
# RISK
# ============================================================

def risk_penalty(
    route: RouteCandidate,
) -> float:
    """
    Converts normalized hazard values into
    an explainable route penalty.

    flood          -> max 30
    landslide      -> max 30
    road blockage  -> max 40
    """

    return round(
        route.floodRisk * 30
        + route.landslideRisk * 30
        + route.roadBlockRisk * 40,
        2,
    )


# ============================================================
# DIJKSTRA SHORTEST / SAFEST PATH
# ============================================================

def shortest_path(
    start: str,
    end: str,
    roads: list[RoadEdge],
    objective: str = "Shortest path",
) -> dict | None:

    graph: dict[
        str,
        list[
            tuple[str, float, RoadEdge]
        ],
    ] = {}

    for road in roads:

        # CLOSED ROADS ARE COMPLETELY EXCLUDED
        if road.closed:
            continue

        # ----------------------------------------------------
        # Hazard penalty
        # ----------------------------------------------------

        hazard = (
            road.floodRisk * 30
            + road.landslideRisk * 30
            + road.roadBlockRisk * 40
        )

        # ----------------------------------------------------
        # Dynamic edge weight
        # ----------------------------------------------------

        if objective == "Fastest service recovery":

            weight = (
                road.durationMin
                + hazard
            )

        elif objective == "Safest route":

            weight = (
                road.distanceKm
                + hazard * 2
            )

        elif objective in (
            "Greenest route",
            "Lowest carbon impact",
        ):

            weight = (
                road.distanceKm * 0.7
                + hazard * 0.8
            )

        else:

            # Default shortest-path behavior
            weight = (
                road.distanceKm
                + hazard
            )

        graph.setdefault(
            road.fromNode,
            [],
        ).append(
            (
                road.toNode,
                weight,
                road,
            )
        )

    # --------------------------------------------------------
    # Dijkstra
    # --------------------------------------------------------

    distances = {
        start: 0.0
    }

    previous: dict[
        str,
        tuple[str, RoadEdge],
    ] = {}

    queue = [
        (0.0, start)
    ]

    while queue:

        current_distance, node = heappop(
            queue
        )

        if current_distance > distances.get(
            node,
            float("inf"),
        ):
            continue

        if node == end:
            break

        for (
            neighbour,
            weight,
            road,
        ) in graph.get(
            node,
            [],
        ):

            new_distance = (
                current_distance
                + weight
            )

            if new_distance < distances.get(
                neighbour,
                float("inf"),
            ):

                distances[neighbour] = (
                    new_distance
                )

                previous[neighbour] = (
                    node,
                    road,
                )

                heappush(
                    queue,
                    (
                        new_distance,
                        neighbour,
                    ),
                )

    # No route
    if end not in distances:
        return None

    # --------------------------------------------------------
    # Reconstruct path
    # --------------------------------------------------------

    path: list[RoadEdge] = []

    node = end

    while node != start:

        previous_node, road = previous[node]

        path.append(road)

        node = previous_node

    path.reverse()

    total_distance = sum(
        road.distanceKm
        for road in path
    )

    total_duration = sum(
        road.durationMin
        for road in path
    )

    total_risk = sum(
        road.floodRisk * 30
        + road.landslideRisk * 30
        + road.roadBlockRisk * 40
        for road in path
    )

    return {
        "nodes": (
            [start]
            + [
                road.toNode
                for road in path
            ]
        ),

        "distanceKm": round(
            total_distance,
            2,
        ),

        "durationMin": round(
            total_duration,
            2,
        ),

        "riskPenalty": round(
            total_risk,
            2,
        ),

        "closedRoadsExcluded": True,
    }


# ============================================================
# TIME
# ============================================================

def minutes_to_time(
    minutes: int,
) -> str:

    minutes = minutes % (
        24 * 60
    )

    return (
        f"{minutes // 60:02d}:"
        f"{minutes % 60:02d}"
    )


# ============================================================
# GREEN SCORE
# ============================================================

def green_score(
    distance_km: float,
    co2_kg: float,
    cost_inr: float,
    risk: float,
) -> float:

    # --------------------------------------------------------
    # Transparent normalized scores
    # --------------------------------------------------------

    distance_score = max(
        0.0,
        100.0 - distance_km / 10.0,
    )

    carbon_score = max(
        0.0,
        100.0 - co2_kg * 2.0,
    )

    cost_score = max(
        0.0,
        100.0 - cost_inr / 100.0,
    )

    safety_score = max(
        0.0,
        100.0 - risk,
    )

    score = (
        distance_score * 0.30
        + carbon_score * 0.35
        + cost_score * 0.15
        + safety_score * 0.20
    )

    return round(
        min(score, 100.0),
        2,
    )


# ============================================================
# PRIORITY
# ============================================================

def priority_weight(
    priority: str,
) -> int:

    return {
        "critical": 4,
        "high": 3,
        "medium": 2,
        "low": 1,
    }.get(
        priority.lower(),
        2,
    )


# ============================================================
# BACKWARD-COMPATIBLE FALLBACK
# ============================================================

def optimisation_ratio(
    objective: str,
    priority: str,
) -> float:

    base = {
        "Balanced cost and carbon": 0.88,
        "Lowest transport cost": 0.90,
        "Lowest carbon impact": 0.84,
        "Fastest service recovery": 0.94,
        "Safest route": 0.90,
        "Shortest path": 0.86,
        "Greenest route": 0.85,
    }[objective]

    if (
        priority.lower() == "critical"
        and objective == "Fastest service recovery"
    ):
        return 0.97

    return base


# ============================================================
# MULTI-OBJECTIVE ROUTE SCORE
# ============================================================

def route_score(
    objective: str,
    distance_km: float,
    duration_min: float,
    cost_inr: float,
    co2_kg: float,
    risk: float,
    priority: str,
) -> float:

    distance_score = max(
        0.0,
        100.0 - distance_km / 10.0,
    )

    time_score = max(
        0.0,
        100.0 - duration_min / 10.0,
    )

    cost_score = max(
        0.0,
        100.0 - cost_inr / 100.0,
    )

    carbon_score = max(
        0.0,
        100.0 - co2_kg * 2.0,
    )

    safety_score = max(
        0.0,
        100.0 - risk,
    )

    priority_bonus = (
        priority_weight(priority)
        * 2.0
    )

    weights = {
        "Shortest path": (
            0.70,
            0.10,
            0.05,
            0.05,
            0.10,
        ),

        "Fastest service recovery": (
            0.10,
            0.65,
            0.10,
            0.05,
            0.10,
        ),

        "Lowest transport cost": (
            0.10,
            0.10,
            0.65,
            0.05,
            0.10,
        ),

        "Lowest carbon impact": (
            0.10,
            0.10,
            0.10,
            0.60,
            0.10,
        ),

        "Safest route": (
            0.10,
            0.10,
            0.10,
            0.10,
            0.60,
        ),

        "Greenest route": (
            0.20,
            0.10,
            0.10,
            0.40,
            0.20,
        ),

        "Balanced cost and carbon": (
            0.20,
            0.10,
            0.25,
            0.25,
            0.20,
        ),
    }

    (
        w_distance,
        w_time,
        w_cost,
        w_carbon,
        w_safety,
    ) = weights[objective]

    score = (
        distance_score * w_distance
        + time_score * w_time
        + cost_score * w_cost
        + carbon_score * w_carbon
        + safety_score * w_safety
        + priority_bonus
    )

    return round(
        min(score, 100.0),
        2,
    )


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health() -> dict:

    return {
        "status": "UP",
        "service": "stockflow-carbon-route",
        "version": app.version,
    }


# ============================================================
# EMISSION FACTORS
# ============================================================

@app.get(
    "/api/v1/carbon/emission-factors"
)
def emission_factors(
    tenant_id: str = Header(
        alias="X-Tenant-ID"
    ),
) -> dict:

    return {
        "tenantId": require_tenant(
            tenant_id
        ),

        "vehicleFactorsKgCo2ePerKm":
            VEHICLE_FACTORS_KG_PER_KM,

        "fuelFactorsKgCo2ePerLitre":
            FUEL_FACTORS_KG_PER_LITRE,

        "status":
            "prototype-configurable",
    }


# ============================================================
# CARBON CALCULATION
# ============================================================

@app.post(
    "/api/v1/carbon/calculate"
)
def calculate_carbon(
    request: CarbonRequest,
    tenant_id: str = Header(
        alias="X-Tenant-ID"
    ),
) -> dict:

    return {
        "tenantId": require_tenant(
            tenant_id
        ),

        **carbon_result(
            request.distanceKm,
            request.vehicleType,
            request.loadKg,
            request.capacityKg,
            request.trips,
            request.baselineDistanceKm,
        ),
    }


# ============================================================
# COORDINATE DISTANCE
# ============================================================

@app.post(
    "/api/v1/routes/distance-estimate"
)
def coordinate_route(
    request: CoordinateRouteRequest,
    tenant_id: str = Header(
        alias="X-Tenant-ID"
    ),
) -> dict:

    distance = geodesic(
        (
            request.originLat,
            request.originLon,
        ),
        (
            request.destinationLat,
            request.destinationLon,
        ),
    ).km

    fuel_type = request.fuelType.lower()

    fuel_used = (
        0.0
        if fuel_type == "electric"
        else (
            distance
            / request.mileageKmPerLitre
        )
    )

    emissions = (
        fuel_used
        * FUEL_FACTORS_KG_PER_LITRE[
            fuel_type
        ]
    )

    return {
        "tenantId": require_tenant(
            tenant_id
        ),

        "distanceKm": round(
            distance,
            2,
        ),

        "fuelUsedLitres": round(
            fuel_used,
            2,
        ),

        "emissionsKgCo2e": round(
            emissions,
            2,
        ),

        "travelTimeHours": round(
            distance / 50,
            2,
        ),

        "method": (
            "geodesic prototype estimate; "
            "use roadNetwork in "
            "/routes/optimise for "
            "shortest-path routing"
        ),
    }


# ============================================================
# ROUTE OPTIMISATION
# ============================================================

@app.post(
    "/api/v1/routes/optimise"
)
def optimise_routes(
    request: OptimiseRoutesRequest,
    tenant_id: str = Header(
        alias="X-Tenant-ID"
    ),
) -> dict:

    results = []
    rejected = []

    for route in request.routes:

        # ====================================================
        # 1. HARD CONSTRAINTS
        # ====================================================

        # Vehicle payload
        if route.loadKg > route.capacityKg:

            rejected.append({
                "id": route.id,
                "reason":
                    "Vehicle payload capacity exceeded",
            })

            continue

        # Vehicle availability
        if not route.vehicleAvailable:

            rejected.append({
                "id": route.id,
                "reason":
                    "Vehicle is unavailable",
            })

            continue

        # Cold chain
        if (
            route.coldChainRequired
            and not route.coldChainAvailable
        ):

            rejected.append({
                "id": route.id,
                "reason":
                    "Cold-chain vehicle required "
                    "but unavailable",
            })

            continue

        # Warehouse stock
        if (
            route.warehouseStockKg is not None
            and route.warehouseStockKg
                < route.loadKg
        ):

            rejected.append({
                "id": route.id,
                "reason":
                    "Insufficient warehouse stock",
            })

            continue

        # Closed route
        if route.roadClosed:

            rejected.append({
                "id": route.id,
                "reason":
                    "Route is closed",
            })

            continue

        # ====================================================
        # 2. VEHICLE
        # ====================================================

        selected_vehicle = (
            request.vehicleType
            if request.vehicleType
            != "All eligible vehicles"
            else route.vehicle
        )

        family = vehicle_family(
            selected_vehicle
        )

        # ====================================================
        # 3. SHORTEST / SAFEST PATH
        # ====================================================

        path = None

        # If road network and nodes are supplied,
        # use Dijkstra.
        if (
            request.roadNetwork
            and route.pickupNode
            and route.deliveryNode
        ):

            path = shortest_path(
                route.pickupNode,
                route.deliveryNode,
                request.roadNetwork,
                request.objective,
            )

            if path is None:

                rejected.append({
                    "id": route.id,
                    "reason":
                        "No open road path exists "
                        "between pickup and delivery",
                })

                continue

            optimized_km = (
                path["distanceKm"]
            )

            duration_min = (
                path["durationMin"]
            )

            route_risk = (
                path["riskPenalty"]
            )

            route_nodes = (
                path["nodes"]
            )

        else:

            # ------------------------------------------------
            # Backward-compatible behavior.
            # Existing frontend requests continue to work.
            # ------------------------------------------------

            ratio = optimisation_ratio(
                request.objective,
                route.priority,
            )

            optimized_km = max(
                round(
                    route.baselineKm
                    * ratio,
                    1,
                ),
                1.0,
            )

            speed = (
                58
                if request.objective
                == "Fastest service recovery"
                else 50
            )

            duration_min = (
                optimized_km
                / speed
                * 60
            )

            route_risk = risk_penalty(
                route
            )

            route_nodes = route.stops

        # ====================================================
        # 4. ETA + DELIVERY WINDOW
        # ====================================================

        eta_minutes = (
            route.departureMinutes
            + duration_min
        )

        delivery_window_ok = True

        if (
            route.promisedDeliveryMinutes
            is not None
        ):

            delivery_window_ok = (
                eta_minutes
                <= route.promisedDeliveryMinutes
            )

        if not delivery_window_ok:

            rejected.append({
                "id": route.id,

                "reason":
                    "Estimated arrival exceeds "
                    "promised delivery window",

                "eta":
                    minutes_to_time(
                        round(
                            eta_minutes
                        )
                    ),

                "promisedDelivery":
                    minutes_to_time(
                        route.promisedDeliveryMinutes
                    ),
            })

            continue

        # ====================================================
        # 5. CARBON
        # ====================================================

        carbon = carbon_result(
            optimized_km,
            family,
            route.loadKg,
            route.capacityKg,
            baseline_distance_km=
                route.baselineKm,
        )

        # ====================================================
        # 6. TRANSPORT COST
        # ====================================================

        cost_inr = round(
            optimized_km
            * COST_PER_KM[family]
        )

        # ====================================================
        # 7. GREEN SCORE
        # ====================================================

        green = green_score(
            optimized_km,
            carbon[
                "emissionsKgCo2e"
            ],
            cost_inr,
            route_risk,
        )

        # ====================================================
        # 8. FINAL ROUTE SCORE
        # ====================================================

        score = route_score(
            request.objective,

            optimized_km,

            duration_min,

            cost_inr,

            carbon[
                "emissionsKgCo2e"
            ],

            route_risk,

            route.priority,
        )

        # ====================================================
        # 9. RESULT
        # ====================================================

        results.append({

            **route.model_dump(),

            "optimizedKm":
                round(
                    optimized_km,
                    2,
                ),

            "durationMinutes":
                round(
                    duration_min,
                    2,
                ),

            "duration":
                (
                    f"{int(duration_min // 60)}h "
                    f"{int(round(duration_min % 60)):02d}m"
                ),

            "eta":
                minutes_to_time(
                    round(
                        eta_minutes
                    )
                ),

            "deliveryWindowFeasible":
                delivery_window_ok,

            "routeNodes":
                route_nodes,

            "costInr":
                cost_inr,

            "co2Kg":
                carbon[
                    "emissionsKgCo2e"
                ],

            "co2SavedKg":
                carbon[
                    "emissionsAvoidedKgCo2e"
                ],

            "vehicleFamily":
                family,

            "riskPenalty":
                round(
                    route_risk,
                    2,
                ),

            "greenScore":
                green,

            "routeScore":
                score,

            "capacityUtilisationPercent":
                round(
                    route.loadKg
                    / route.capacityKg
                    * 100,
                    1,
                ),

            "status":
                (
                    "Optimized"
                    if route.status
                    == "Draft"
                    else route.status
                ),

            "explanation": [

                f"Optimized for "
                f"{request.objective.lower()}.",

                f"Load utilisation is "
                f"{round(route.loadKg / route.capacityKg * 100, 1)}%.",

                f"Estimated using "
                f"{family} factor "
                f"{carbon['emissionFactorKgPerKm']} "
                f"kg CO2e/km.",

                f"Risk penalty is "
                f"{round(route_risk, 2)}.",

                f"Green score is "
                f"{green}/100.",

                "Closed roads are excluded "
                "when a road network is supplied.",

                "Human approval is required "
                "before dispatch.",
            ],
        })

    # ========================================================
    # 10. RANK ROUTES
    # ========================================================

    results.sort(
        key=lambda item: (
            -item["routeScore"],
            -item["greenScore"],
            item["co2Kg"],
            item["costInr"],
            item["optimizedKm"],
        )
    )

    # Add rank
    for index, item in enumerate(
        results,
        start=1,
    ):

        item["rank"] = index

    # ========================================================
    # 11. FINAL RESPONSE
    # ========================================================

    return {

        "tenantId":
            require_tenant(
                tenant_id
            ),

        "objective":
            request.objective,

        "routes":
            results,

        "rejectedRoutes":
            rejected,

        "bestRoute":
            (
                results[0]["id"]
                if results
                else None
            ),

        "solver":
            (
                "Dijkstra risk-aware "
                "deterministic optimizer"
                if request.roadNetwork
                else
                "Backward-compatible "
                "deterministic optimizer"
            ),

        "features": [

            "Vehicle capacity constraint",

            "Vehicle availability",

            "Cold-chain compatibility",

            "Warehouse stock availability",

            "Shortest-path routing",

            "ETA calculation",

            "Promised delivery window",

            "Closed-road exclusion",

            "Flood risk penalty",

            "Landslide risk penalty",

            "Road-block risk penalty",

            "Transport cost",

            "Carbon emissions",

            "Green score",

            "Multi-objective route ranking",
        ],

        "limitations": [

            "Road network must be supplied "
            "for true graph-based shortest path",

            "Hazard values are expected "
            "from the hazard intelligence service",

            "Traffic is not live",

            "Carbon factors are "
            "prototype configurable values",

            "Human approval is required "
            "before dispatch",
        ],
    }


# ============================================================
# TRANSFER RECOMMENDATION
# ============================================================

@app.post(
    "/api/v1/transfers/recommend"
)
def recommend_transfer(
    request: TransferRecommendationRequest,
    tenant_id: str = Header(
        alias="X-Tenant-ID"
    ),
) -> dict:

    transferable = max(
        request.sourceAvailable
        - request.sourceSafetyStock,
        0,
    )

    quantity = min(
        transferable,
        request.destinationShortage,
        request.vehicleCapacity,
    )

    trips = (
        ceil(
            quantity
            / request.vehicleCapacity
        )
        if quantity > 0
        else 0
    )

    carbon = carbon_result(
        request.distanceKm,
        request.vehicleType,
        quantity,
        request.vehicleCapacity,
        max(trips, 1),
    )

    protected_value = (
        quantity
        * request.unitValue
    )

    net_benefit = (
        protected_value
        - request.transportCost
    )

    action = (
        "TRANSFER"
        if quantity > 0
        and net_benefit >= 0
        else "NO_ACTION"
    )

    return {

        "tenantId":
            require_tenant(
                tenant_id
            ),

        "action":
            action,

        "quantity":
            round(
                quantity,
                2,
            ),

        "trips":
            trips,

        "estimatedProtectedValue":
            round(
                protected_value,
                2,
            ),

        "transportCost":
            round(
                request.transportCost,
                2,
            ),

        "netExpectedBenefit":
            round(
                net_benefit,
                2,
            ),

        "carbon":
            carbon,

        "constraintsChecked": [

            "SOURCE_SAFETY_STOCK",

            "DESTINATION_SHORTAGE",

            "VEHICLE_CAPACITY",
        ],

        "approvalRequired":
            True,
    }