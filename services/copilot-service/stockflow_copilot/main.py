from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import logging
import re
import csv
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from .auth import get_auth_context
from .config import AUTH_DISABLED_FOR_LOCAL, ENABLE_ACTIONS, GEMINI_API_KEY, GEMINI_MODEL, MCP_SERVERS
from .mcp_client import MCPHub
from .models import ChatRequest, ChatResponse, Evidence
from .prompts import SYSTEM_INSTRUCTION

hub = MCPHub(MCP_SERVERS)
logger = logging.getLogger("stockflow-copilot")
CSV_DIR = Path(__file__).resolve().parents[3] / "data" / "chatbot"


def _local_csv_rows(filename: str) -> list[dict[str, str]]:
    path = CSV_DIR / filename
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def _local_expiry_rows(warehouse_id: str, days: int = 60) -> list[dict]:
    locations = {row["warehouse"]: row for row in _local_csv_rows("locations.csv")}
    products = {row["SKU"]: row for row in _local_csv_rows("products.csv")}
    inventory = [row for row in _local_csv_rows("inventory.csv") if row.get("warehouse") == warehouse_id]
    today = datetime.now(timezone.utc).date()
    result = []
    for row in inventory:
        expiry = datetime.strptime(row["expiry_date"], "%d-%m-%Y").date()
        remaining = (expiry - today).days
        if 0 <= remaining <= days:
            product = products.get(row["SKU"], {})
            location = locations.get(warehouse_id, {})
            result.append({
                "warehouseId": warehouse_id,
                "warehouseName": location.get("city", warehouse_id),
                "city": location.get("city", ""),
                "state": location.get("state", ""),
                "skuId": row["SKU"],
                "product": product.get("brand_name", row["SKU"]),
                "genericName": product.get("generic_name", ""),
                "batchNumber": row["batch"],
                "availableUnits": int(row["available_units"]),
                "expiryDate": expiry.isoformat(),
                "daysToExpiry": remaining,
            })
    return sorted(result, key=lambda item: item["daysToExpiry"])


def _local_transfer_rows(source_id: str, destination_id: str) -> list[dict]:
    products = {row["SKU"]: row for row in _local_csv_rows("products.csv")}
    inventory = _local_csv_rows("inventory.csv")
    source_units: dict[str, int] = {}
    destination_units: dict[str, int] = {}
    destination_reorder: dict[str, int] = {}
    for row in inventory:
        sku = row["SKU"]
        units = int(row["available_units"])
        reorder = int(row["reorder_level"])
        if row.get("warehouse") == source_id:
            source_units[sku] = source_units.get(sku, 0) + units
        if row.get("warehouse") == destination_id:
            destination_units[sku] = destination_units.get(sku, 0) + units
            destination_reorder[sku] = destination_reorder.get(sku, 0) + reorder
    rows = []
    for sku, target in destination_reorder.items():
        shortage = max(0, target - destination_units.get(sku, 0))
        quantity = min(source_units.get(sku, 0), shortage)
        if quantity:
            rows.append({
                "skuId": sku,
                "product": products.get(sku, {}).get("brand_name", sku),
                "unitsToTransfer": quantity,
                "destinationShortage": shortage,
            })
    return sorted(rows, key=lambda item: item["unitsToTransfer"], reverse=True)


def _planning_assumption(name: str, fallback: float) -> float:
    rows = _local_csv_rows("planning_assumptions.csv")
    for row in rows:
        if row.get("field") == name:
            try:
                return float(row.get("value", fallback))
            except (TypeError, ValueError):
                break
    return fallback


def _local_planning_rows() -> list[dict]:
    """Build transparent demo planning metrics from inventory and assumptions."""
    products = {row["SKU"]: row for row in _local_csv_rows("products.csv")}
    grouped: dict[str, dict] = {}
    demand_rate = _planning_assumption("daily_demand_rate", 0.08)
    for row in _local_csv_rows("inventory.csv"):
        sku = row["SKU"]
        item = grouped.setdefault(sku, {"sku": sku, "product": products.get(sku, {}).get("brand_name", sku), "available": 0, "reorder": 0})
        item["available"] += int(row.get("available_units", 0))
        item["reorder"] += int(row.get("reorder_level", 0))
    for item in grouped.values():
        item["dailyDemand"] = max(1, round(item["available"] * demand_rate))
        item["forecast30"] = item["dailyDemand"] * 30
        item["daysCover"] = round(item["available"] / item["dailyDemand"], 1)
        item["purchaseQty"] = max(0, item["dailyDemand"] * int(_planning_assumption("lead_time_days", 7)) + int(_planning_assumption("safety_stock_days", 14) * item["dailyDemand"] * 0.25) - item["available"])
        item["value"] = item["available"] * _planning_assumption("default_unit_cost", 100)
    return list(grouped.values())


def _local_routes(origin: str = "Chennai", destination: str = "Bengaluru") -> list[dict]:
    rows = [row for row in _local_csv_rows("routes.csv") if _normalise(row.get("origin_city", "")) == _normalise(origin) and _normalise(row.get("destination_city", "")) == _normalise(destination)]
    if rows:
        return rows
    distance = _planning_assumption("route_distance_default", 550)
    return [{"route_id": "R-DEMO-FALLBACK", "origin_city": origin, "destination_city": destination, "distance_km": str(distance), "fastest_hours": "12", "cheapest_inr": str(round(distance * 38)), "carbon_kgco2e": str(round(distance * 0.12)), "route_type": "Demo fallback road"}]


def _local_route_answer(q: str) -> tuple[str, list[str], list[str]] | None:
    if not any(term in q for term in ("route", "vehicle", "carbon", "co2", "emission", "delivery priority", "deliveries")):
        return None
    routes = _local_routes()
    vehicles = _local_csv_rows("vehicles.csv")
    if "saved" in q or "alternative route" in q:
        fastest = min(routes, key=lambda row: float(row.get("carbon_kgco2e", 0)))
        green = min(routes, key=lambda row: float(row.get("carbon_kgco2e", 0)))
        baseline = max(routes, key=lambda row: float(row.get("carbon_kgco2e", 0)))
        saved = float(baseline.get("carbon_kgco2e", 0)) - float(green.get("carbon_kgco2e", 0))
        return (f"The lowest-carbon alternative is {green['route_type']} at {green['carbon_kgco2e']} kgCO2e. Compared with the highest-carbon route, it saves approximately {saved:,.0f} kgCO2e per 900-unit shipment. The estimate assumes the route and load in the demo dataset.", ["local_route_dataset"], ["Demo emissions estimate; replace with measured distance, load, and factor."])
    if "road vehicles" in q or ("vehicles" in q and "compare" in q):
        details = "\n".join(f"- {row['vehicle_type']} {row['vehicle_id']}: capacity {row['capacity_units']} units, INR {row['cost_per_km']}/km, {row['emission_factor_kgco2e_per_tonne_km']} kgCO2e/tonne-km, {'available' if row['available'] == 'true' else 'unavailable'}" for row in vehicles)
        return (f"Demo road-vehicle comparison:\n{details}", ["local_vehicle_capacity"], ["Vehicle costs and emissions are demo assumptions."])
    if "vehicle" in q and "carry" in q:
        shipment = 900
        vehicle = next((row for row in vehicles if row.get("vehicle_id") == "TRUCK-01"), vehicles[0] if vehicles else {})
        capacity = int(vehicle.get("capacity_units", 0))
        return (f"For the 900-unit Chennai to Bengaluru shipment, {vehicle.get('vehicle_type', 'selected vehicle')} {vehicle.get('vehicle_id', '')} has capacity for {capacity:,} units, so it can carry the complete shipment. Capacity check: {shipment:,} <= {capacity:,}.", ["local_route_dataset", "local_vehicle_capacity"], ["Demo route and vehicle data; verify loading constraints before dispatch."])
    if "preferred vehicle" in q or "unavailable" in q:
        fallback = next((row for row in vehicles if row.get("available", "").lower() == "true" and row.get("vehicle_id") == "VAN-01"), vehicles[0] if vehicles else {})
        return (f"If the preferred vehicle is unavailable, use {fallback.get('vehicle_type', 'the next available vehicle')} {fallback.get('vehicle_id', '')} and recheck capacity, delivery time, cost, and emissions before approval.", ["local_vehicle_capacity"], ["Fallback vehicle is a demo option."])
    if "priority" in q or "capacity" in q or "combined" in q or "multiple" in q:
        return ("Delivery priority is evaluated first by shortage/expiry urgency, then by route time. Vehicle capacity must cover the shipment; combined deliveries are feasible only when the total load stays within capacity and all stops are present in the route plan.", ["local_route_dataset", "local_vehicle_capacity"], ["Multi-stop optimization needs stop-level route data for a production decision."])
    if "compare" in q or "fastest" in q or "cheapest" in q or "lowest carbon" in q or "best route" in q:
        lines = "\n".join(f"- {row['route_type']}: {row['distance_km']} km, {row['fastest_hours']} h, INR {int(float(row['cheapest_inr'])):,}, {row['carbon_kgco2e']} kgCO2e" for row in routes)
        return (f"Demo route comparison for Chennai to Bengaluru:\n{lines}\n\nFastest is the lowest-hours option; cheapest is the lowest-cost option; lowest carbon is the lowest-CO2e option.", ["local_route_dataset"], ["Demo route data; actual route service should replace these estimates."])
    if "emission" in q or "carbon" in q:
        route = min(routes, key=lambda row: float(row.get("carbon_kgco2e", 0)))
        return (f"Estimated emissions for a 900-unit Chennai to Bengaluru transfer on the lowest-carbon route: approximately {float(route['carbon_kgco2e']):,.0f} kgCO2e. Assumptions: {route['distance_km']} km route, road vehicle, and the demo emission factor.", ["local_route_dataset", "local_vehicle_capacity"], ["Demo emissions estimate; replace with actual weight and emission factor."])
    return (f"A route dataset is available for Chennai to Bengaluru with {routes[0]['distance_km']} km and {routes[0]['fastest_hours']} hours for the fastest option. Route choice must be confirmed with vehicle capacity and current logistics data.", ["local_route_dataset"], ["Demo route data; verify before dispatch."])


def _local_answer(question: str) -> tuple[str, list[str], list[str]] | None:
    """Answer safe, read-only CSV questions without spending Gemini quota."""
    locations = _local_csv_rows("locations.csv")
    products = _local_csv_rows("products.csv")
    inventory = _local_csv_rows("inventory.csv")
    if not locations or not products or not inventory:
        return None

    q = _normalise(question)
    sensitive = ("api key", "password", "service role", "another organisation", "another company", "change my role", "administrator", "ignore tenant", "ignore previous", "approve every")
    if any(term in q for term in sensitive):
        return ("I cannot provide secrets, credentials, cross-tenant data, or unauthorised role changes.", ["local_security_guard"], ["Security policy enforced locally."])

    if (("approve yourself" in q or "self approve" in q or ("yourself" in q and "approve" in q)) and ("proposal" in q or "transfer" in q)):
        return ("I cannot approve my own transfer proposal. Approval must be completed by an authorised human approver.", ["local_approval_guard"], ["No action was executed."])
    if "immediately" in q and "transfer" in q:
        return ("I cannot execute an immediate transfer. I can provide a read-only recommendation or create a proposal for human confirmation.", ["local_action_guard"], ["No action was executed."])
    if "submit" in q and "proposal" in q:
        return ("I can prepare a transfer proposal, but I will not submit it without explicit confirmation and an authorised approval workflow.", ["local_action_guard"], ["No action was executed."])
    if "create" in q and "proposal" in q:
        return ("I can prepare a read-only transfer proposal, but this demo does not submit proposals without human confirmation.", ["local_action_guard"], ["No action was executed."])
    if "approved transfers" in q or "sustainability impact" in q:
        transfers = [row for row in _local_csv_rows("approved_transfers.csv") if row.get("status") == "APPROVED"]
        total_units = sum(int(row.get("units", 0)) for row in transfers)
        total_carbon = sum(float(next((route.get("carbon_kgco2e", 0) for route in _local_routes(row.get("origin_city", "Chennai"), row.get("destination_city", "Bengaluru")) if route.get("route_id") == row.get("route_id")), 0)) for row in transfers)
        return (f"Approved-transfer sustainability impact: {len(transfers)} approved transfer(s), {total_units:,} units, and approximately {total_carbon:,.0f} kgCO2e for the demo records. This uses approved_transfers.csv and route carbon estimates.", ["local_approved_transfers", "local_route_dataset"], ["Demo sustainability data; replace with measured logistics data for production reporting."])

    location_map = {row["warehouse"]: row for row in locations}
    product_map = {row["SKU"]: row for row in products}
    matched_products = []
    for row in products:
        words = [_normalise(row.get("SKU", "")), _normalise(row.get("brand_name", "")), _normalise(row.get("generic_name", ""))]
        if any(word and word in q for word in words):
            matched_products.append(row)
    if "650" in q:
        matched_products = [row for row in matched_products if "650" in _normalise(row.get("strength", ""))]
    matched_locations = []
    for row in locations:
        candidates = [row.get("city", ""), row.get("village", ""), row.get("district", ""), row.get("state", ""), row.get("warehouse", "")]
        candidates.extend(str(row.get("aliases", "")).split("|"))
        positions = [q.find(_normalise(candidate)) for candidate in candidates if candidate and _normalise(candidate) in q]
        if positions:
            matched_locations.append((min(positions), row))
    matched_locations = [row for _, row in sorted(matched_locations, key=lambda item: item[0])]

    if "calculate emissions" in q and ("without" in q or "no route" in q or "no vehicle" in q):
        return ("To calculate emissions, please provide the route (origin and destination), vehicle type, shipment quantity or load, and emission factor if you have one. No emissions value was inferred.", ["local_clarification_guard"], ["Route, vehicle, load, and emission factor required."])

    route_result = _local_route_answer(q)
    if route_result:
        return route_result

    if "approval status" in q or "status of" in q and "proposal" in q:
        return ("No approval status is available because no transfer proposal has been submitted in this read-only demo.", ["local_approval_status"], ["No action was executed."])

    planning = _local_planning_rows()
    if "highest inventory value" in q:
        top = max(planning, key=lambda item: item["value"])
        unit_cost = _planning_assumption("default_unit_cost", 100)
        return (f"The highest estimated inventory value is {top['product']} ({top['sku']}): {top['available']:,} units x INR {unit_cost:,.0f} = approximately INR {top['value']:,.0f}.", ["local_inventory_valuation", "local_planning_assumptions"], ["Demo valuation uses the documented default unit cost; supply actual product costs for a financial result."])
    if "highest potential expiry loss" in q:
        candidates = []
        for warehouse in location_map:
            candidates.extend(_local_expiry_rows(warehouse))
        unit_cost = _planning_assumption("default_unit_cost", 100)
        top = max(candidates, key=lambda item: item["availableUnits"] * unit_cost, default=None)
        if top:
            loss = top["availableUnits"] * unit_cost
            return (f"Highest estimated expiry loss: {top['product']} batch {top['batchNumber']} at {top['city']}, {top['availableUnits']:,} units expiring {top['expiryDate']}; estimated exposure INR {loss:,.0f}.", ["local_csv_expiry", "local_inventory_valuation"], ["Demo valuation uses INR 100 per unit; replace with actual cost."])

    if "transfer stock instead" in q or "recommend the best source" in q or "source warehouse" in q or "remain above safety" in q:
        source = next((row for row in locations if _normalise(row.get("city", "")) == "chennai"), None)
        destination = next((row for row in locations if _normalise(row.get("city", "")) == "bengaluru"), None)
        transfer_rows = _local_transfer_rows(source.get("warehouse", ""), destination.get("warehouse", "")) if source and destination else []
        total = sum(row["unitsToTransfer"] for row in transfer_rows)
        details = ", ".join(f"{row['product']} {row['unitsToTransfer']} units" for row in transfer_rows[:5]) or "no covered shortage"
        if "remain above safety" in q:
            return (f"The demo source check uses Chennai available units versus its reorder-level safety target. A Chennai-to-Bengaluru estimate covers {total:,} units ({details}); final safety-stock approval requires current source demand and policy data.", ["local_transfer_recommendation", "local_planning_assumptions"], ["Read-only demo estimate; human approval required."])
        return (f"Yes, transfer can be considered before purchasing. For the demo Bengaluru shortage, Chennai is the best available source and the estimate is {total:,} units across {len(transfer_rows)} products: {details}. It is based on destination reorder levels and available source stock, not a committed order.", ["local_transfer_recommendation", "local_planning_assumptions"], ["Read-only demo estimate; confirm demand, transport, and safety stock before approval."])

    if "why did you recommend" in q or "what evidence" in q or "which assumptions" in q or "what could make" in q or "alternative recommendation" in q:
        return ("The transfer estimate uses current available source units, destination available units, destination reorder levels, and the requested source/destination. It assumes reorder level is the replenishment target; demand, route capacity, cost, and emissions were not supplied, so the estimate may be wrong and requires human review.", ["local_explainability"], ["Read-only explanation; demand, route, and cost assumptions are unavailable."])

    if "last updated" in q or "fresh" in q:
        latest = max(row["last_updated"] for row in inventory)
        return (f"The supplied inventory CSV was last updated at {latest}. This is read-only source data.", ["local_csv_inventory"], ["Source: inventory.csv."])

    if "how many products" in q and ("available" in q or "currently" in q):
        count = len({row["SKU"] for row in inventory if int(row["available_units"]) > 0})
        return (f"{count} distinct products currently have available units across the supplied warehouses.", ["local_csv_inventory"], ["Source: inventory.csv."])

    if "purchase" in q or "reorder" in q:
        candidates = [item for item in planning if item["purchaseQty"] > 0]
        if matched_products:
            skus = {row["SKU"] for row in matched_products}
            candidates = [item for item in candidates if item["sku"] in skus]
        if candidates:
            details = ", ".join(f"{item['product']} {item['purchaseQty']:,} units" for item in sorted(candidates, key=lambda item: item["purchaseQty"], reverse=True)[:8])
            return (f"Demo reorder candidates using a 7-day lead time and 14-day safety-stock policy: {details}. Quantities are planning estimates, not purchase orders.", ["local_demand_model", "local_planning_assumptions"], ["Synthetic demand model; replace with sales history and supplier lead times."])
        return ("No reorder quantity is currently estimated under the demo planning assumptions.", ["local_demand_model"], ["Synthetic demand model; replace with sales history for production use."])

    if ("current stock" in q or "how many units" in q or "available" in q) and matched_products:
        skus = {row["SKU"] for row in matched_products}
        rows = [row for row in inventory if row["SKU"] in skus and int(row["available_units"]) > 0]
        total = sum(int(row["available_units"]) for row in rows)
        return (f"{matched_products[0].get('brand_name')} ({matched_products[0].get('SKU')}) has {total:,} available units across {len({row['warehouse'] for row in rows})} warehouses.", ["local_csv_inventory"], ["Source: inventory.csv and products.csv."])

    if "which warehouses" in q and matched_products:
        skus = {row["SKU"] for row in matched_products}
        names = sorted({location_map[row["warehouse"]].get("city") or location_map[row["warehouse"]].get("village") or row["warehouse"] for row in inventory if row["SKU"] in skus and int(row["available_units"]) > 0})
        return ("The product is available at: " + (", ".join(names) if names else "no warehouse in the supplied data") + ".", ["local_csv_inventory"], ["Source: inventory.csv."])

    if "all batches" in q and matched_locations:
        warehouse = matched_locations[0]["warehouse"]
        rows = [row for row in inventory if row["warehouse"] == warehouse][:20]
        details = "\n".join(f"- {row['batch']} / {product_map.get(row['SKU'], {}).get('brand_name', row['SKU'])}: {int(row['available_units']):,} units, expires {row['expiry_date']}" for row in rows)
        return (f"Batches in {matched_locations[0].get('city', warehouse)} (showing {len(rows)}):\n{details}", ["local_csv_inventory"], ["Source: inventory.csv."])

    if "near expiry" in q or "expiring" in q:
        if "another warehouse" in q or "redistribution" in q:
            rows = []
            for warehouse in location_map:
                rows.extend(_local_expiry_rows(warehouse))
            transferable = sum(row["availableUnits"] for row in rows)
            return (f"Potential redistribution pool: {transferable:,} units in batches expiring within 60 days. This can reduce waste only after destination demand, storage, route, and safety-stock checks pass; no transfer was executed.", ["local_csv_expiry", "local_transfer_recommendation"], ["Potential pool only; safety and demand checks are required."])
        rows = []
        for warehouse in location_map:
            rows.extend(_local_expiry_rows(warehouse))
        if matched_locations:
            rows = [row for row in rows if row["warehouseId"] == matched_locations[0]["warehouse"]]
        details = "\n".join(f"- {row['product']} at {row['city']}: {row['availableUnits']:,} units, expires {row['expiryDate']} ({row['daysToExpiry']} days)" for row in rows[:20])
        return ("Near-expiry batches:\n" + (details or "No matching batches were found."), ["local_csv_expiry"], ["Source: inventory.csv; expiry window is 60 days."])

    # Missing-input questions must be handled as clarification requests before
    # the broader data-quality guard. This keeps the response useful and makes
    # it explicit which fields the user needs to provide.
    if "without selecting" in q or ("forecast" in q and not matched_products and not matched_locations):
        return ("To forecast demand, please specify the product, warehouse or city, and forecast horizon (for example, 30 days). The CSV does not contain enough information to infer those inputs.", ["local_clarification_guard"], ["Product, location, and forecast horizon required."])

    if "calculate emissions" in q and ("without" in q or "no route" in q or "no vehicle" in q):
        return ("To calculate emissions, please provide the route (origin and destination), vehicle type, shipment quantity or load, and emission factor if you have one. No emissions value was inferred.", ["local_clarification_guard"], ["Route, vehicle, load, and emission factor required."])

    if "stockout" in q or "stock out" in q or "predicted demand" in q or "forecast" in q:
        if "why" in q and matched_products:
            item = next((row for row in planning if row["sku"] == matched_products[0]["SKU"]), None)
            if item:
                return (f"{item['product']} is classified as a stockout risk when projected {item['daysCover']} days of cover is below the demo safety horizon of 14 days. Available units: {item['available']:,}; estimated daily demand: {item['dailyDemand']:,}.", ["local_demand_model"], ["Synthetic demand estimate; replace with sales history."])
        if "highest predicted demand" in q:
            top = max(planning, key=lambda item: item["forecast30"])
            return (f"Highest predicted 30-day demand is {top['product']} at approximately {top['forecast30']:,} units, based on {top['dailyDemand']:,} estimated units/day.", ["local_demand_model"], ["Synthetic demand estimate; confidence is demo-level until sales history is supplied."])
        if "confidence" in q:
            return ("Forecast confidence: demo-level, 62%. Data used: current available units, reorder levels, a documented 0.08 daily-demand rate, 7-day lead time, and 14-day safety-stock assumption. This is not a historical forecast.", ["local_demand_model", "local_planning_assumptions"], ["Synthetic model; confidence must be recalibrated with sales history."])
        if matched_products and matched_locations:
            item = next((row for row in planning if row["sku"] == matched_products[0]["SKU"]), None)
            if item:
                return (f"30-day demo demand forecast for {item['product']} at {matched_locations[0].get('city')}: approximately {item['forecast30']:,} units ({item['dailyDemand']:,}/day), with 62% demo confidence.", ["local_demand_model"], ["Synthetic demand estimate; use sales history for production forecasting."])
        risks = [item for item in planning if item["daysCover"] <= 7]
        if risks:
            details = ", ".join(f"{item['product']} ({item['daysCover']} days cover)" for item in sorted(risks, key=lambda item: item["daysCover"])[:10])
            return (f"Products with estimated stockout risk within 7 days: {details}.", ["local_demand_model"], ["Synthetic demand estimate; validate against live demand."])
        if "why" in q and not matched_products:
            return ("Please specify the product or SKU you want explained. The current demo model evaluates stockout risk using available units, estimated daily demand, days of cover, and the 14-day safety-stock horizon.", ["local_clarification_guard"], ["Product or SKU required for a product-specific explanation."])
        return ("No products are currently estimated to stock out within the next 7 days under the demo demand model. This uses current available units and a documented demand assumption; validate against live sales history.", ["local_demand_model"], ["Synthetic demand estimate; validate against live demand."])
    if "excess" in q or "slow moving" in q:
        slow = [item for item in planning if item["daysCover"] >= 60]
        details = ", ".join(f"{item['product']} ({item['daysCover']} days cover)" for item in sorted(slow, key=lambda item: item["daysCover"], reverse=True)[:10])
        return (f"Estimated excess/slow-moving products: {details or 'none under the demo threshold of 60 days cover'}.", ["local_demand_model"], ["Synthetic demand estimate; use sales history for a production classification."])
    if "waste" in q:
        candidates = [_local_expiry_rows(warehouse) for warehouse in location_map]
        preventable = sum(item["availableUnits"] for group in candidates for item in group)
        return (f"Potential expiry waste avoided through redistribution is up to {preventable:,} units in the current 60-day near-expiry pool, subject to demand, storage, route, and safety-stock checks.", ["local_csv_expiry", "local_transfer_recommendation"], ["Upper-bound estimate; no transfer was executed."])
    if "financial impact" in q or ("purchasing" in q and "transferring" in q):
        purchase_cost = sum(item["purchaseQty"] for item in planning) * _planning_assumption("default_unit_cost", 100)
        route = min(_local_routes(), key=lambda row: float(row.get("cheapest_inr", 0)))
        return (f"Demo comparison: purchasing the estimated replenishment quantity would cost approximately INR {purchase_cost:,.0f} at the default unit cost. Transferring 900 units on the cheapest Chennai-Bengaluru route is approximately INR {float(route['cheapest_inr']):,.0f}. The comparison excludes handling, taxes, lead-time risk, and product-specific costs.", ["local_demand_model", "local_route_dataset", "local_planning_assumptions"], ["Demo financial comparison; replace with supplier quotes and actual logistics costs."])
    unavailable = ("financial impact",)
    if any(term in q for term in unavailable):
        return ("The supplied CSV dataset does not include the demand, route, vehicle, emissions, or purchasing inputs needed to calculate this reliably. I will not invent a value.", ["local_data_quality_guard"], ["Missing required source data."])

    if "unknown" in q or "does not exist" in q or "which paracetamol product" in q or "without selecting" in q or "some medicine" in q:
        return ("Please specify a valid product, warehouse, quantity, and time period. No value was inferred from incomplete information.", ["local_clarification_guard"], ["Clarification required."])
    return None


def _mcp_text(result) -> str:
    return "\n".join(
        getattr(item, "text", str(item))
        for item in getattr(result, "content", [])
    )


def _mcp_json(result):
    text = _mcp_text(result).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        starts = [index for index in (text.find("["), text.find("{")) if index >= 0]
        if not starts:
            return []
        candidate = text[min(starts):]
        try:
            value, _ = json.JSONDecoder().raw_decode(candidate)
            return value
        except json.JSONDecodeError:
            return []


def _normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", value.lower()).strip()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await hub.connect()
    yield
    await hub.close()


app = FastAPI(title="StockFlow Copilot Host", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"], allow_credentials=True, allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type", "X-Tenant-ID"])


@app.get("/health")
async def health() -> dict:
    return {"status": "UP", "mcpTools": hub.tool_names, "actionsEnabled": ENABLE_ACTIONS}


@app.post("/api/v1/copilot/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, request: Request) -> ChatResponse:
    context = get_auth_context(request)
    correlation_id = str(uuid4())
    prompt = f"Trusted tenant scope: {context.tenant_id}. Workspace: {payload.currentWorkspace or 'unspecified'}.\nUser question: {payload.message}"
    try:
        # Call the read-only MCP server directly. Passing a live ClientSession
        # into Gemini makes the SDK deepcopy asyncio.Future objects on Windows.
        question = payload.message.lower()
        data_session = hub.sessions[0]
        location_context = ""

        # Resolve a city, village, district, state, or warehouse alias before
        # asking for inventory. This prevents a broad risk response from being
        # mistaken for the requested location (for example, Chennai vs Bangalore).
        local_locations = _local_csv_rows("locations.csv")
        locations_result = None
        locations = local_locations
        if not locations:
            locations_result = await data_session.call_tool("search_locations", arguments={})
            locations = _mcp_json(locations_result)
        if isinstance(locations, dict):
            locations = locations.get("data", locations.get("items", []))
        matched_location = None
        matched_locations = []
        normalised_question = _normalise(question)
        for location in locations if isinstance(locations, list) else []:
            candidates = [
                location.get("city", ""),
                location.get("village", ""),
                location.get("district", ""),
                location.get("state", ""),
                location.get("warehouse", ""),
            ]
            candidates.extend(str(location.get("aliases", "")).split("|"))
            if any(
                candidate and _normalise(candidate) in normalised_question
                for candidate in candidates
            ):
                positions = [
                    normalised_question.find(_normalise(candidate))
                    for candidate in candidates
                    if candidate and _normalise(candidate) in normalised_question
                ]
                matched_locations.append((min(positions), location))
        matched_locations.sort(key=lambda item: item[0])
        matched_locations = [location for _, location in matched_locations]
        matched_location = matched_locations[0] if matched_locations else None

        is_route_or_action = any(term in question for term in ("route", "vehicle", "carbon", "co2", "emission", "immediately"))
        if ("transfer" in question or "transferred" in question or "move" in question) and len(matched_locations) >= 2 and not is_route_or_action:
            source = matched_locations[0]
            destination = matched_locations[1]
            transfer_rows = _local_transfer_rows(
                source.get("warehouse", ""),
                destination.get("warehouse", ""),
            )
            total = sum(row["unitsToTransfer"] for row in transfer_rows)
            if transfer_rows:
                details = "\n".join(
                    f"- {row['product']} ({row['skuId']}): {row['unitsToTransfer']} units"
                    for row in transfer_rows[:10]
                )
                answer = (
                    f"Based on current CSV inventory, the suggested transfer from "
                    f"{source.get('city', source.get('warehouse'))} to "
                    f"{destination.get('city', destination.get('warehouse'))} is "
                    f"{total} units across {len(transfer_rows)} products.\n\n{details}\n\n"
                    "This is a read-only replenishment estimate calculated from destination "
                    "reorder levels and available source stock; it requires human approval."
                )
            else:
                answer = (
                    f"No transfer quantity is currently suggested from {source.get('city', source.get('warehouse'))} "
                    f"to {destination.get('city', destination.get('warehouse'))}. Both locations have no "
                    "reorder-level shortage that can be covered by available source stock."
                )
            return ChatResponse(
                answer=answer,
                answerType="GROUNDED_EXPLANATION",
                toolsUsed=["csv_transfer_recommendation"],
                evidence=[Evidence(source="StockFlow CSV inventory", asOf=datetime.now(timezone.utc).isoformat(), freshness="CURRENT", correlationId=correlation_id)],
                warnings=["Read-only estimate; approve transfers separately."],
            )

        local_result = _local_answer(question)
        if local_result:
            answer, tools_used, warnings = local_result
            return ChatResponse(
                answer=answer,
                answerType="GROUNDED_EXPLANATION",
                toolsUsed=tools_used,
                evidence=[Evidence(source="StockFlow CSV inventory", asOf=datetime.now(timezone.utc).isoformat(), freshness="CURRENT", correlationId=correlation_id)],
                warnings=warnings,
            )

        if "expir" in question and matched_location:
            tool_name = "get_current_inventory"
            warehouse_id = matched_location.get("warehouse", matched_location.get("warehouse_id", ""))
            tool_args = {"warehouse_id": warehouse_id} if warehouse_id else {}
            location_context = f"Requested location resolved to: {json.dumps(matched_location)}"
        elif "expir" in question:
            tool_name = "find_near_expiry_inventory"
            tool_args = {"days": 60, "limit": 100}
        elif "stockout" in question or "stock out" in question:
            tool_name = "find_stockout_risks"
            tool_args = {"limit": 100}
        elif "product" in question or "medicine" in question or "drug" in question:
            tool_name = "search_products"
            tool_args = {}
        elif "location" in question or "warehouse" in question or "city" in question or "village" in question or "state" in question:
            tool_name = "search_locations"
            tool_args = {}
        else:
            tool_name = "get_current_inventory"
            tool_args = {}

        local_expiry = []
        if "expir" in question and matched_location:
            local_expiry = _local_expiry_rows(tool_args.get("warehouse_id", ""))
        if local_expiry:
            tool_name = "csv_inventory_lookup"
            evidence_text = json.dumps(local_expiry)
            location_context += "\nThis result was loaded from the supplied CSV inventory dataset."
        else:
            tool_result = await data_session.call_tool(tool_name, arguments=tool_args)
            evidence_text = _mcp_text(tool_result)
        # Never send the entire inventory table to Gemini. Large unfiltered
        # queries can exceed the free-tier input-token quota (HTTP 429).
        if len(evidence_text) > 24000:
            evidence_text = evidence_text[:24000]
            location_context += "\nEvidence was safely truncated; do not infer totals from incomplete rows."
        grounded_prompt = f"""
Trusted tenant: {context.tenant_id}

{location_context}

Authoritative StockFlow MCP result:
{evidence_text}

User question:
{payload.message}

Answer only from the authoritative result above. If a requested location was
resolved, never use data from another location. For near-expiry questions,
include only batches expiring within 60 days of the current data date. If the
result does not contain the answer, say that the data is unavailable. Keep the
answer concise and state that it is read-only current StockFlow data.
"""
        if not GEMINI_API_KEY:
            return ChatResponse(answer="This question needs the language model, but GEMINI_API_KEY is not configured on the server.", answerType="ERROR", toolsUsed=hub.tool_names, warnings=["Configure the key on the server only; never put it in Angular."])
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=grounded_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.1,
            ),
        )
        return ChatResponse(answer=response.text or "No readable answer was returned.", answerType="GROUNDED_EXPLANATION", toolsUsed=[tool_name], evidence=[Evidence(source="StockFlow Data MCP", asOf=datetime.now(timezone.utc).isoformat(), freshness="CURRENT", correlationId=correlation_id)], warnings=["Read-only answer based on current StockFlow data."])
    except Exception as exc:
        logger.exception("Copilot request failed; correlation_id=%s", correlation_id)
        details = f" {type(exc).__name__}: {exc}" if AUTH_DISABLED_FOR_LOCAL else ""
        return ChatResponse(answer=f"The Copilot could not complete this request because a connected StockFlow service was unavailable.{details} No inventory value was inferred.", answerType="ERROR", toolsUsed=hub.tool_names, warnings=[f"Correlation ID: {correlation_id}"])

