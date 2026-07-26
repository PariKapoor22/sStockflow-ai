from mcp.server.fastmcp import FastMCP
from .common import FORECAST_API, OPTIMISATION_API, post_json

mcp = FastMCP("StockFlow Intelligence MCP", host="127.0.0.1", port=8202, stateless_http=True, json_response=True)

@mcp.tool()
def forecast_demand(tenant_id: str, warehouse_id: str, sku_id: str, horizon_days: int = 30) -> dict:
    """Calculates demand forecast. Computational only; no side effects."""
    return post_json(f"{FORECAST_API}/api/v1/forecast", {
        "tenant_id": tenant_id,
        "warehouse_id": warehouse_id,
        "sku_id": sku_id,
        "horizon_days": horizon_days,
    })

@mcp.tool()
def recommend_stock_transfer(
    tenant_id: str,
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
    return post_json(f"{OPTIMISATION_API}/api/v1/recommend-transfer", locals())

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
