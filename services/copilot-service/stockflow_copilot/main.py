from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import logging
import re
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types

from .auth import get_auth_context
from .config import ALLOWED_ORIGINS, AUTH_DISABLED_FOR_LOCAL, ENABLE_ACTIONS, GEMINI_API_KEY, GEMINI_MODEL, MCP_SERVERS
from .mcp_client import MCPHub
from .models import ChatRequest, ChatResponse, Evidence
from .prompts import SYSTEM_INSTRUCTION

hub = MCPHub(MCP_SERVERS)
logger = logging.getLogger("stockflow-copilot")


def _mcp_text(result) -> str:
    return "\n".join(getattr(item, "text", str(item)) for item in getattr(result, "content", []))


def _mcp_json(result):
    text = _mcp_text(result).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        starts = [index for index in (text.find("["), text.find("{")) if index >= 0]
        if not starts:
            return []
        try:
            value, _ = json.JSONDecoder().raw_decode(text[min(starts):])
            return value
        except json.JSONDecodeError:
            return []


def _items(value) -> list[dict]:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    if isinstance(value, dict):
        for key in ("data", "items", "content", "results"):
            if isinstance(value.get(key), list):
                return [item for item in value[key] if isinstance(item, dict)]
    return []


def _normalise(value: object) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", str(value or "").lower()).strip()


def _field(item: dict, *keys: str):
    for key in keys:
        if item.get(key) not in (None, ""):
            return item[key]
    return ""


def _match_location(question: str, locations: list[dict]) -> dict | None:
    normalised = _normalise(question)
    for location in locations:
        values = [_field(location, "warehouseName", "warehouse_name", "warehouse"), _field(location, "city"), _field(location, "district"), _field(location, "state")]
        if any(value and _normalise(value) in normalised for value in values):
            return location
    return None


def _match_product(question: str, products: list[dict]) -> dict | None:
    normalised = _normalise(question)
    matches = []
    for product in products:
        values = [_field(product, "skuName", "sku_name", "name", "brandName", "brand_name"), _field(product, "genericName", "generic_name"), _field(product, "skuId", "sku_id", "SKU")]
        score = max((len(_normalise(value)) for value in values if value and _normalise(value) in normalised), default=0)
        if score:
            matches.append((score, product))
    return max(matches, key=lambda item: item[0])[1] if matches else None


def _plain_api_answer(tool_name: str, data, question: str = "") -> str:
    rows = _items(data)
    if tool_name == "get_inventory_summary" and isinstance(data, dict):
        kpis = _items(data.get("kpis", []))
        inventory_kpi = next((item for item in kpis if item.get("key") == "inventoryValue"), None)
        if inventory_kpi:
            return (f"The overall inventory value is {inventory_kpi.get('value')}. "
                    f"Source: StockFlow PostgreSQL dashboard snapshot, as of {data.get('asOf', 'unavailable')}.")
        return "Current StockFlow dashboard summary:\n" + json.dumps(data, indent=2, default=str)[:6000]
    if not rows:
        if isinstance(data, dict) and data:
            return "Current StockFlow API result:\n" + json.dumps(data, indent=2, default=str)[:6000]
        return "No matching current records were returned by the StockFlow API."
    if tool_name == "get_current_inventory":
        if "how many products" in question:
            count = len({_field(row, "skuId", "sku_id") for row in rows if float(_field(row, "usableQuantity", "usable_quantity", "availableQuantity", "available_quantity") or 0) > 0})
            return f"{count} distinct products currently have usable stock across the returned warehouses."
        if "highest inventory value" in question:
            totals: dict[str, float] = {}
            for row in rows:
                warehouse = str(_field(row, "warehouseName", "warehouse_name", "warehouseId", "warehouse_id"))
                totals[warehouse] = totals.get(warehouse, 0) + float(_field(row, "usableQuantity", "availableQuantity") or 0) * float(_field(row, "unitCost", "unit_cost") or 0)
            if totals:
                warehouse, value = max(totals.items(), key=lambda item: item[1])
                return f"{warehouse} has the highest calculated usable-inventory value: approximately INR {value:,.2f}."
        if "which warehouse" in question or "which warehouses" in question:
            totals: dict[str, float] = {}
            for row in rows:
                warehouse = str(_field(row, "warehouseName", "warehouse_name", "warehouseId", "warehouse_id"))
                totals[warehouse] = totals.get(warehouse, 0) + float(_field(row, "usableQuantity", "availableQuantity") or 0)
            return "Current warehouse availability:\n" + "\n".join(f"- {name}: {qty:,.0f} usable units" for name, qty in sorted(totals.items()))
        if "last updated" in question:
            dates = [str(_field(row, "lastMovementAt", "last_movement_at", "snapshotDate", "snapshot_date")) for row in rows]
            return f"The latest inventory timestamp returned by the API is {max(dates) if dates else 'unavailable'}."
        lines = []
        for row in rows[:20]:
            name = _field(row, "skuName", "sku_name", "productName", "product_name", "skuId", "sku_id")
            warehouse = _field(row, "warehouseName", "warehouse_name", "city", "warehouseId", "warehouse_id")
            qty = _field(row, "availableQuantity", "available_quantity", "availableUnits", "available_units", "quantity")
            lines.append(f"- {name} — {warehouse}: {qty} units")
        return "Current inventory returned by the StockFlow API:\n" + "\n".join(lines)
    if tool_name in ("find_stockout_risks", "get_inventory_risks", "get_stockout_projections"):
        if "seven days" in question or "7 days" in question:
            rows = [row for row in rows if float(_field(row, "daysOfCover", "days_of_cover") or 999999) <= 7]
        if "excess" in question or "slow" in question:
            rows = [row for row in rows if any(term in str(_field(row, "riskType", "risk_type")).upper() for term in ("EXCESS", "SLOW"))]
        if not rows:
            return "No matching risk records were returned by the current StockFlow API data."
        return "Current matching risks:\n" + "\n".join(
            f"- {_field(row, 'skuName', 'sku_name', 'skuId')}, {_field(row, 'warehouseName', 'warehouse_name')}: {_field(row, 'reason', 'riskType')}. Recommended: {_field(row, 'recommendedAction') or 'human review'}"
            for row in rows[:15]
        )
    if tool_name == "find_near_expiry_inventory":
        if not rows:
            return "No batches expiring in the requested window were returned."
        if "highest potential expiry loss" in question:
            row = max(rows, key=lambda item: float(_field(item, "inventoryValue") or 0))
            return f"Highest returned potential expiry exposure: {_field(row, 'skuName', 'skuId')} batch {_field(row, 'batchNumber')} at {_field(row, 'warehouseName')}, value INR {float(_field(row, 'inventoryValue') or 0):,.2f}, expires {_field(row, 'expiryDate')}."
        prefix = "Near-expiry batches"
        if "waste" in question or "another warehouse" in question or "redistribution" in question:
            prefix += " that may be redistribution candidates; actual preventable waste cannot be claimed until destination demand and source safety stock are checked"
        return prefix + ":\n" + "\n".join(
            f"- {_field(row, 'skuName', 'sku_name', 'skuId')} batch {_field(row, 'batchNumber', 'batch_number')} at {_field(row, 'warehouseName', 'warehouse_name')}: {_field(row, 'usableQuantity', 'availableQuantity')} units, expires {_field(row, 'expiryDate', 'expiry_date')}"
            for row in rows[:20]
        )
    if tool_name == "get_latest_forecasts":
        if not rows:
            return "No persisted forecast matches that product and warehouse. I won’t estimate a value without a forecast record."
        if "highest" in question:
            row = max(rows, key=lambda item: float(_field(item, "totalForecastQuantity") or 0))
            return f"{_field(row, 'warehouseName')} has the highest returned predicted demand: {_field(row, 'totalForecastQuantity')} units over {_field(row, 'horizonDays')} days for {_field(row, 'skuName')} ({_field(row, 'confidence')} confidence)."
        row = rows[0]
        return (f"Forecast for {_field(row, 'skuName')} at {_field(row, 'warehouseName')}: "
                f"{_field(row, 'totalForecastQuantity')} units over {_field(row, 'horizonDays')} days, "
                f"average {_field(row, 'averageDailyForecast')} per day. Model: {_field(row, 'selectedModel')}; "
                f"confidence: {_field(row, 'confidence')}; as of {_field(row, 'asOfDate')}. "
                f"Evidence: {_field(row, 'trainingSampleCount')} training samples, WAPE {_field(row, 'wape')}, reasons {_field(row, 'diagnosticReasons')}.")
    if tool_name in ("get_forecast_accuracy", "get_forecast_summary"):
        return "Current forecast quality result:\n" + json.dumps(data, indent=2, default=str)[:5000]
    if tool_name == "get_forecast_diagnostics":
        return "Forecast diagnostics:\n" + json.dumps(rows[:10], indent=2, default=str)[:6000]
    if tool_name == "get_demand_by_sku":
        if not rows:
            return "No demand records were returned."
        row = max(rows, key=lambda item: float(_field(item, "salesQuantity", "averageDailyDemand") or 0))
        return f"Highest actual demand in the returned period is {_field(row, 'skuName')} at {_field(row, 'warehouseName')}: {_field(row, 'salesQuantity')} units, average {_field(row, 'averageDailyDemand')} per day."
    if tool_name == "get_data_freshness":
        return f"The StockFlow API reports data as of {_field(data, 'asOf') or 'an unavailable timestamp'}. Source: {_field(data, 'sourceSystem') or 'StockFlow Core API'}."
    if tool_name in ("optimise_transfer_route", "calculate_carbon", "recommend_sustainable_transfer", "get_emission_factors"):
        assumption = ""
        if tool_name in ("optimise_transfer_route", "calculate_carbon"):
            assumption = "Prototype assumptions: Chennai–Bengaluru baseline 350 km, diesel vehicle, 1,500 kg capacity; when the question supplies units but no product weight, the demo temporarily treats 1 unit as 1 kg. Replace this with actual shipment weight before dispatch.\n"
        return assumption + "Read-only optimisation result (including assumptions and constraints):\n" + json.dumps(data, indent=2, default=str)[:6000]
    return f"StockFlow API returned {len(rows)} matching record(s):\n" + json.dumps(rows[:20], indent=2, default=str)[:6000]


def _policy_answer(question: str) -> tuple[str, str] | None:
    """Enforce security and approval rules before any model or MCP call."""
    normalised = _normalise(question)
    secret_terms = (
        "api key", "apikey", "access token", "refresh token", "password",
        "secret key", "private key", "service role key", "database url",
        "connection string", "credential",
    )
    if any(term in normalised for term in secret_terms):
        return (
            "I can’t reveal API keys, tokens, passwords, private keys, connection strings, or other credentials. "
            "An authorised administrator can configure secrets in the server’s secret manager or deployment environment.",
            "security_policy_guard",
        )
    approval_terms = (
        "approve yourself", "approve it yourself", "approve proposal", "self approve",
        "bypass approval", "skip approval", "without approval", "execute immediately",
        "transfer immediately", "place the order", "submit the order",
    )
    if any(term in normalised for term in approval_terms):
        return (
            "I can’t approve or execute my own recommendation. StockFlow keeps recommendations read-only until an authorised human reviews and approves the proposal.",
            "human_approval_guard",
        )
    return None


@asynccontextmanager
async def lifespan(_: FastAPI):
    await hub.connect()
    yield
    await hub.close()


app = FastAPI(title="StockFlow Copilot Host", version="0.2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type", "X-Tenant-ID"])


@app.get("/health")
async def health() -> dict:
    return {"status": "UP", "dataSource": "core-api-only", "mcpTools": hub.tool_names, "actionsEnabled": ENABLE_ACTIONS}


@app.post("/api/v1/copilot/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, request: Request) -> ChatResponse:
    context = get_auth_context(request)
    correlation_id = str(uuid4())
    try:
        question = payload.message.lower()
        policy_result = _policy_answer(question)
        if policy_result:
            answer, guard_name = policy_result
            return ChatResponse(
                answer=answer,
                answerType="GROUNDED_EXPLANATION",
                toolsUsed=[guard_name],
                evidence=[],
                warnings=["No MCP tool was called and no action was executed."],
            )
        locations_result = await hub.call_tool("search_locations", {})
        products_result = await hub.call_tool("search_products", {})
        locations = _items(_mcp_json(locations_result))
        products = _items(_mcp_json(products_result))
        location = _match_location(question, locations)
        product = _match_product(question, products)

        warehouse_id = _field(location or {}, "warehouseId", "warehouse_id", "warehouse")
        sku_id = _field(product or {}, "skuId", "sku_id", "SKU")
        if any(term in question for term in ("create a transfer proposal", "submit this proposal", "approval status")):
            return ChatResponse(answer="The current Copilot is read-only: proposal creation, submission and approval-status persistence are not yet exposed by an Action API. No action was executed.", answerType="NO_DATA", toolsUsed=["action_capability_guard"], warnings=["A tenant-scoped Action API and approval database are required for this operation."])
        if any(term in question for term in ("overall inventory value", "total inventory value", "inventory value overall")):
            tool_name, tool_args = "get_inventory_summary", {}
        elif "how fresh" in question or "last updated" in question:
            tool_name, tool_args = "get_data_freshness", {}
        elif "forecast confidence" in question or "accuracy" in question:
            tool_name, tool_args = "get_forecast_accuracy", {}
        elif "assumptions" in question and "forecast" in question or "data used" in question and "prediction" in question:
            tool_name, tool_args = "get_forecast_diagnostics", {"warehouse_id": warehouse_id, "sku_id": sku_id, "limit": 100}
        elif "forecast" in question or "predicted demand" in question:
            tool_name, tool_args = "get_latest_forecasts", {"warehouse_id": warehouse_id, "sku_id": sku_id, "limit": 100}
        elif "likely to stock out" in question and ("seven" in question or "7" in question):
            tool_name, tool_args = "find_stockout_risks", {"limit": 100}
        elif "highest" in question and "demand" in question:
            tool_name, tool_args = "get_demand_by_sku", {"window_days": 30, "limit": 100}
        elif any(term in question for term in ("best route", "fastest", "cheapest", "lowest carbon", "vehicle carry", "vehicle capacity", "preferred vehicle", "combined into one route")):
            quantity_match = re.search(r"(\d[\d,]*)\s*(?:units|kg)", question)
            load = float(quantity_match.group(1).replace(",", "")) if quantity_match else 900.0
            tool_name, tool_args = "optimise_transfer_route", {"origin": "Chennai", "destination": "Bengaluru", "load_kg": load, "capacity_kg": 1500.0, "baseline_km": 350.0, "vehicle": "diesel", "objective": "Balanced cost and carbon", "priority": "High"}
        elif "carbon" in question or "co2" in question or "emission" in question:
            tool_name, tool_args = "calculate_carbon", {"distance_km": 350.0, "vehicle_type": "diesel", "load_kg": 900.0, "capacity_kg": 1500.0, "trips": 1, "baseline_distance_km": 380.0}
        elif "expir" in question:
            tool_name = "find_near_expiry_inventory"
            tool_args = {"days": 60, "limit": 100}
        elif "excess" in question or "slow-moving" in question or "slow moving" in question:
            tool_name, tool_args = "get_inventory_risks", {"limit": 100, "risk_type": "", "severity": ""}
        elif any(term in question for term in ("reorder", "purchase", "purchasing", "transfer stock", "source warehouse", "safety stock", "financial impact", "why did you recommend", "evidence supports", "alternative recommendation", "what could make")):
            tool_name, tool_args = "find_stockout_risks", {"limit": 100}
        elif "stockout" in question or "stock out" in question:
            tool_name = "find_stockout_risks"
            tool_args = {"limit": 100}
        elif any(term in question for term in ("available", "availability", "stock", "inventory", "which warehouse", "where")):
            tool_name = "get_current_inventory"
            tool_args = {}
            if location:
                tool_args["warehouse_id"] = warehouse_id
            if product:
                tool_args["sku_id"] = sku_id
        elif any(term in question for term in ("product", "medicine", "drug")):
            tool_name, tool_args = "search_products", {}
        elif any(term in question for term in ("location", "warehouse", "city", "village", "state")):
            tool_name, tool_args = "search_locations", {}
        else:
            tool_name, tool_args = "get_inventory_summary", {}

        tool_result = await hub.call_tool(tool_name, tool_args)
        evidence_text = _mcp_text(tool_result)
        evidence_data = _mcp_json(tool_result)
        if len(evidence_text) > 24000:
            evidence_text = evidence_text[:24000]

        if GEMINI_API_KEY:
            grounded_prompt = f"""Trusted tenant: {context.tenant_id}\nAuthoritative StockFlow MCP result (retrieved from HTTP APIs):\n{evidence_text}\nUser question: {payload.message}\nAnswer only from this result. Never invent values. State that the answer is read-only current StockFlow API data."""
            client = genai.Client(api_key=GEMINI_API_KEY)
            response = await client.aio.models.generate_content(model=GEMINI_MODEL, contents=grounded_prompt, config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION, temperature=0.1))
            answer = response.text or "No readable answer was returned."
        else:
            answer = _plain_api_answer(tool_name, evidence_data, question)

        return ChatResponse(answer=answer, answerType="GROUNDED_EXPLANATION", toolsUsed=[tool_name], evidence=[Evidence(source="StockFlow Core API via Data MCP", asOf=datetime.now(timezone.utc).isoformat(), freshness="CURRENT", correlationId=correlation_id)], warnings=["Read-only answer; no inventory action was executed."])
    except Exception as exc:
        logger.exception("Copilot request failed; correlation_id=%s", correlation_id)
        details = f" {type(exc).__name__}: {exc}" if AUTH_DISABLED_FOR_LOCAL else ""
        return ChatResponse(answer=f"The Copilot could not complete this request because a connected StockFlow API was unavailable.{details} No inventory value was inferred.", answerType="ERROR", toolsUsed=hub.tool_names, warnings=[f"Correlation ID: {correlation_id}"])
