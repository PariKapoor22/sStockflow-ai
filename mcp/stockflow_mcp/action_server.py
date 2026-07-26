import os
from uuid import uuid4
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("StockFlow Action MCP", host="127.0.0.1", port=8203, stateless_http=True, json_response=True)

@mcp.tool()
def create_transfer_proposal(
    recommendation_id: str,
    source_warehouse_id: str,
    destination_warehouse_id: str,
    sku_id: str,
    quantity: float,
    business_justification: str,
    idempotency_key: str,
) -> dict:
    """Creates a reviewable proposal only. Disabled by default in Sprint 1."""
    if os.getenv("STOCKFLOW_ENABLE_ACTIONS", "false").lower() != "true":
        return {
            "status": "DISABLED",
            "requiresApproval": True,
            "message": "Action tools are disabled in Sprint 1. Set STOCKFLOW_ENABLE_ACTIONS=true only for controlled demos."
        }
    return {
        "proposalId": f"TRP-{uuid4().hex[:10].upper()}",
        "status": "DRAFT",
        "requiresApproval": True,
        "recommendationId": recommendation_id,
        "sourceWarehouseId": source_warehouse_id,
        "destinationWarehouseId": destination_warehouse_id,
        "skuId": sku_id,
        "quantity": quantity,
        "businessJustification": business_justification,
        "idempotencyKey": idempotency_key,
        "nextAction": "SUBMIT_FOR_APPROVAL"
    }

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
