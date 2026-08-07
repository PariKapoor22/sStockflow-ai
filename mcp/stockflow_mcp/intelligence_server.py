from mcp.server.fastmcp import FastMCP
from .common import FORECAST_API, OPTIMISATION_API, TENANT_ID, post_json

mcp = FastMCP("StockFlow Intelligence MCP", host="127.0.0.1", port=8202, stateless_http=True, json_response=True)

@mcp.tool()
def forecast_demand(warehouse_id: str, sku_id: str, horizon_days: int = 30) -> dict:
    """Calculates demand forecast. Computational only; no side effects."""
    return post_json(f"{FORECAST_API}/api/v1/forecast", {
        "tenant_id": TENANT_ID,
        "warehouse_id": warehouse_id,
        "sku_id": sku_id,
        "horizon_days": horizon_days,
    })

@mcp.tool()
def recommend_stock_transfer(
    sku_id: str,
    source_warehouse_id: str,
    destination_warehouse_id: str,
    source_available: float,
    source_safety_stock: float,
    destination_shortage: float,
    transport_cost: float,
    unit_value: float,
) -> dict:
    """Calculates a transfer candidate. It does not create or execute a transfer."""
    return post_json(f"{OPTIMISATION_API}/api/v1/recommend-transfer", {"tenant_id": TENANT_ID, "sku_id": sku_id, "source_warehouse_id": source_warehouse_id, "destination_warehouse_id": destination_warehouse_id, "source_available": source_available, "source_safety_stock": source_safety_stock, "destination_shortage": destination_shortage, "transport_cost": transport_cost, "unit_value": unit_value})

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
