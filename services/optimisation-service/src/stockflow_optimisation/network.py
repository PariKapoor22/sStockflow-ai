from __future__ import annotations

from collections import defaultdict

from ortools.linear_solver import pywraplp


def optimise_transfer_network(positions: list[dict], lanes: list[dict]) -> dict:
    """Min-cost integer stock rebalancing with explicit unmet demand."""
    solver = pywraplp.Solver.CreateSolver("SCIP")
    if solver is None:
        raise RuntimeError("OR-Tools SCIP solver is unavailable")
    by_node = {item["warehouseId"]: item for item in positions}
    outbound, inbound = defaultdict(list), defaultdict(list)
    transfer_vars = {}
    for lane in lanes:
        source, destination = lane["sourceWarehouseId"], lane["destinationWarehouseId"]
        if source not in by_node or destination not in by_node or source == destination:
            continue
        variable = solver.IntVar(0, int(lane["capacityUnits"]), f"x_{source}_{destination}")
        transfer_vars[(source, destination)] = (variable, lane)
        outbound[source].append(variable)
        inbound[destination].append(variable)
    shortage_vars = {}
    for warehouse_id, item in by_node.items():
        available = max(0, int(item["availableUnits"]) - int(item["safetyStockUnits"]))
        shortage = max(0, int(item["targetStockUnits"]) - int(item["availableUnits"]))
        if outbound[warehouse_id]:
            solver.Add(sum(outbound[warehouse_id]) <= available)
        unmet = solver.IntVar(0, shortage, f"unmet_{warehouse_id}")
        shortage_vars[warehouse_id] = unmet
        solver.Add(sum(inbound[warehouse_id]) + unmet >= shortage)
    solver.Minimize(
        sum(var * float(lane["costPerUnit"]) for var, lane in transfer_vars.values())
        + sum(shortage_vars[item["warehouseId"]] * float(item["shortagePenaltyPerUnit"]) for item in positions)
    )
    status = solver.Solve()
    if status not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        raise RuntimeError("OR-Tools could not find a feasible transfer plan")
    transfers = []
    for (source, destination), (variable, lane) in transfer_vars.items():
        quantity = int(round(variable.solution_value()))
        if quantity > 0:
            transfers.append({"sourceWarehouseId": source, "destinationWarehouseId": destination,
                              "quantity": quantity, "cost": round(quantity * float(lane["costPerUnit"]), 2)})
    unmet = {key: int(round(value.solution_value())) for key, value in shortage_vars.items()
             if value.solution_value() >= 0.5}
    return {
        "model": "GOOGLE_OR_TOOLS_SCIP",
        "solverStatus": "OPTIMAL" if status == pywraplp.Solver.OPTIMAL else "FEASIBLE",
        "objectiveValue": round(solver.Objective().Value(), 2), "transfers": transfers,
        "unmetShortageUnits": unmet,
        "constraintsChecked": ["SOURCE_SAFETY_STOCK", "LANE_CAPACITY", "DESTINATION_TARGET", "INTEGER_QUANTITIES"],
        "requiresHumanApproval": True,
    }
