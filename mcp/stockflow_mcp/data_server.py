import csv
from datetime import date, datetime
from pathlib import Path

from mcp.server.fastmcp import FastMCP
from .common import CORE_API, get_json

mcp = FastMCP("StockFlow Data MCP", host="127.0.0.1", port=8201, stateless_http=True, json_response=True)

CSV_DIR = Path(__file__).resolve().parents[2] / "data" / "chatbot"


def _csv_rows(filename: str) -> list[dict[str, str]]:
    path = CSV_DIR / filename
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def _using_csv_data() -> bool:
    return all((CSV_DIR / name).exists() for name in ("locations.csv", "products.csv", "inventory.csv"))

@mcp.tool()
def get_inventory_summary() -> dict:
    """Returns the authorised dashboard inventory summary. Read-only."""
    return get_json(f"{CORE_API}/api/v1/dashboard/overview")

@mcp.tool()
def search_locations() -> list | dict:
    """Returns every authorised warehouse/location in the tenant."""
    if _using_csv_data():
        return _csv_rows("locations.csv")
    return get_json(f"{CORE_API}/api/v1/warehouses")

@mcp.tool()
def search_products() -> list | dict:
    """Returns every authorised medicine/product SKU in the tenant."""
    if _using_csv_data():
        return _csv_rows("products.csv")
    return get_json(f"{CORE_API}/api/v1/skus")

@mcp.tool()
def get_current_inventory(warehouse_id: str = "", sku_id: str = "") -> list | dict:
    """Returns current batch-level inventory, optionally filtered by location or product."""
    if _using_csv_data():
        locations = {row["warehouse"]: row for row in _csv_rows("locations.csv")}
        products = {row["SKU"]: row for row in _csv_rows("products.csv")}
        rows = _csv_rows("inventory.csv")
        if warehouse_id:
            rows = [row for row in rows if row.get("warehouse") == warehouse_id]
        if sku_id:
            rows = [row for row in rows if row.get("SKU") == sku_id]
        return [
            {
                "warehouseId": row["warehouse"],
                "warehouseName": locations.get(row["warehouse"], {}).get("city", row["warehouse"]),
                "city": locations.get(row["warehouse"], {}).get("city", ""),
                "state": locations.get(row["warehouse"], {}).get("state", ""),
                "skuId": row["SKU"],
                "skuName": products.get(row["SKU"], {}).get("brand_name", row["SKU"]),
                "genericName": products.get(row["SKU"], {}).get("generic_name", ""),
                "batchNumber": row["batch"],
                "availableQuantity": int(row["available_units"]),
                "expiryDate": datetime.strptime(row["expiry_date"], "%d-%m-%Y").date().isoformat(),
                "reorderLevel": int(row["reorder_level"]),
                "lastUpdated": row["last_updated"],
            }
            for row in rows
        ]
    params = {key: value for key, value in {"warehouseId": warehouse_id, "skuId": sku_id}.items() if value}
    return get_json(f"{CORE_API}/api/v1/inventory/batches", params)

@mcp.tool()
def find_near_expiry_inventory(days: int = 60, limit: int = 100) -> list | dict:
    """Returns read-only inventory expiry risks within the requested number of days."""
    if _using_csv_data():
        rows = get_current_inventory()
        today = date.today()
        return [
            row for row in rows
            if 0 <= (date.fromisoformat(row["expiryDate"]) - today).days <= days
        ][:limit]
    return get_json(f"{CORE_API}/api/v1/risks/expiry", {"days": days, "limit": limit})

@mcp.tool()
def find_stockout_risks(limit: int = 100) -> list | dict:
    """Returns read-only stockout risks for the authorised tenant."""
    return get_json(f"{CORE_API}/api/v1/risks/stockout", {"limit": limit})

@mcp.tool()
def get_inventory_risks(limit: int = 100, risk_type: str = "", severity: str = "") -> list | dict:
    """Returns read-only inventory risk records."""
    params = {key: value for key, value in {"limit": limit, "type": risk_type, "severity": severity}.items() if value}
    return get_json(f"{CORE_API}/api/v1/risks/inventory", params)

@mcp.tool()
def get_data_freshness() -> dict:
    """Returns the latest authorised dashboard snapshot timestamp."""
    overview = get_json(f"{CORE_API}/api/v1/dashboard/overview")
    return {"sourceSystem": "StockFlow Core API", "asOf": overview.get("asOf") if isinstance(overview, dict) else None, "tenantId": "server-scoped"}

@mcp.resource("stockflow://dashboard/overview")
def dashboard_overview() -> str:
    """Dashboard overview resource for the current authorised tenant."""
    return str(get_inventory_summary())

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
