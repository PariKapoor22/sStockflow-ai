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


def _plain_api_answer(tool_name: str, data) -> str:
    rows = _items(data)
    if not rows:
        if isinstance(data, dict) and data:
            return "Current StockFlow API result:\n" + json.dumps(data, indent=2, default=str)[:6000]
        return "No matching current records were returned by the StockFlow API."
    if tool_name == "get_current_inventory":
        lines = []
        for row in rows[:20]:
            name = _field(row, "skuName", "sku_name", "productName", "product_name", "skuId", "sku_id")
            warehouse = _field(row, "warehouseName", "warehouse_name", "city", "warehouseId", "warehouse_id")
            qty = _field(row, "availableQuantity", "available_quantity", "availableUnits", "available_units", "quantity")
            lines.append(f"- {name} — {warehouse}: {qty} units")
        return "Current inventory returned by the StockFlow API:\n" + "\n".join(lines)
    return f"StockFlow API returned {len(rows)} matching record(s):\n" + json.dumps(rows[:20], indent=2, default=str)[:6000]


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
        data_session = hub.sessions[0]

        locations_result = await data_session.call_tool("search_locations", arguments={})
        products_result = await data_session.call_tool("search_products", arguments={})
        locations = _items(_mcp_json(locations_result))
        products = _items(_mcp_json(products_result))
        location = _match_location(question, locations)
        product = _match_product(question, products)

        if "expir" in question:
            tool_name = "find_near_expiry_inventory"
            tool_args = {"days": 60, "limit": 100}
        elif "stockout" in question or "stock out" in question:
            tool_name = "find_stockout_risks"
            tool_args = {"limit": 100}
        elif any(term in question for term in ("available", "availability", "stock", "inventory", "which warehouse", "where")):
            tool_name = "get_current_inventory"
            tool_args = {}
            if location:
                tool_args["warehouse_id"] = _field(location, "warehouseId", "warehouse_id", "warehouse")
            if product:
                tool_args["sku_id"] = _field(product, "skuId", "sku_id", "SKU")
        elif any(term in question for term in ("product", "medicine", "drug")):
            tool_name, tool_args = "search_products", {}
        elif any(term in question for term in ("location", "warehouse", "city", "village", "state")):
            tool_name, tool_args = "search_locations", {}
        else:
            tool_name, tool_args = "get_inventory_summary", {}

        tool_result = await data_session.call_tool(tool_name, arguments=tool_args)
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
            answer = _plain_api_answer(tool_name, evidence_data)

        return ChatResponse(answer=answer, answerType="GROUNDED_EXPLANATION", toolsUsed=[tool_name], evidence=[Evidence(source="StockFlow Core API via Data MCP", asOf=datetime.now(timezone.utc).isoformat(), freshness="CURRENT", correlationId=correlation_id)], warnings=["Read-only answer; no inventory action was executed."])
    except Exception as exc:
        logger.exception("Copilot request failed; correlation_id=%s", correlation_id)
        details = f" {type(exc).__name__}: {exc}" if AUTH_DISABLED_FOR_LOCAL else ""
        return ChatResponse(answer=f"The Copilot could not complete this request because a connected StockFlow API was unavailable.{details} No inventory value was inferred.", answerType="ERROR", toolsUsed=hub.tool_names, warnings=[f"Correlation ID: {correlation_id}"])
