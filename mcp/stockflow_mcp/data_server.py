from mcp.server.fastmcp import FastMCP
from .common import CORE_API, get_json

mcp = FastMCP("StockFlow Data MCP", host="127.0.0.1", port=8201, stateless_http=True, json_response=True)

@mcp.tool()
def get_inventory_summary() -> dict:
    """Returns the authorised dashboard inventory summary. Read-only."""
    return get_json(f"{CORE_API}/api/v1/dashboard/overview")

@mcp.resource("stockflow://dashboard/overview")
def dashboard_overview() -> str:
    """Dashboard overview resource for the current authorised tenant."""
    return str(get_inventory_summary())

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
