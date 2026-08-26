from __future__ import annotations

import math

from stockpyl.newsvendor import newsvendor_normal


def optimise_inventory_policy(*, demand_mean: float, demand_sd: float, lead_time_days: int,
                              holding_cost: float, stockout_cost: float,
                              inventory_position: float, reorder_multiple: int) -> dict:
    """Calculate an auditable base-stock policy with Stockpyl."""
    base_stock, expected_cost = newsvendor_normal(
        holding_cost=holding_cost, stockout_cost=stockout_cost,
        demand_mean=demand_mean, demand_sd=demand_sd, lead_time=lead_time_days,
    )
    target = max(0, math.ceil(base_stock))
    raw_order = max(0, target - math.floor(inventory_position))
    recommended = 0 if raw_order == 0 else math.ceil(raw_order / reorder_multiple) * reorder_multiple
    return {
        "model": "STOCKPYL_NEWSVENDOR_NORMAL", "modelVersion": "stockpyl-1.x",
        "baseStockLevel": round(base_stock, 4), "targetStock": target,
        "recommendedOrderQuantity": recommended,
        "expectedCostPerPeriod": round(expected_cost, 4),
        "inventoryPosition": inventory_position,
        "constraintsChecked": ["NON_NEGATIVE_ORDER", "REORDER_MULTIPLE"],
        "requiresHumanApproval": True,
    }
