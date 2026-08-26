from __future__ import annotations

import os
from typing import Literal

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from .anomaly import score_anomalies
from .hazards import PROVIDERS, load_hazards
from .inventory import optimise_inventory_policy
from .network import optimise_transfer_network
from .routing import apply_hazard_alerts, optimise_vehicle_routes
from .route_store import route_run, save_route_run, update_route_status

app = FastAPI(title="StockFlow Decision Intelligence Service", version="0.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[item.strip() for item in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:4200,http://127.0.0.1:4200"
    ).split(",") if item.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-Tenant-ID", "X-User-ID"],
)


class InventoryPolicyRequest(BaseModel):
    tenant_id: str
    warehouse_id: str
    sku_id: str
    demand_mean: float = Field(gt=0)
    demand_sd: float = Field(gt=0)
    lead_time_days: int = Field(ge=0, le=365)
    holding_cost: float = Field(gt=0)
    stockout_cost: float = Field(gt=0)
    inventory_position: float = Field(ge=0)
    reorder_multiple: int = Field(default=1, ge=1)


class NetworkPosition(BaseModel):
    warehouseId: str
    availableUnits: int = Field(ge=0)
    safetyStockUnits: int = Field(ge=0)
    targetStockUnits: int = Field(ge=0)
    shortagePenaltyPerUnit: float = Field(gt=0)


class TransferLane(BaseModel):
    sourceWarehouseId: str
    destinationWarehouseId: str
    costPerUnit: float = Field(ge=0)
    capacityUnits: int = Field(ge=0)


class NetworkTransferRequest(BaseModel):
    tenantId: str
    skuId: str
    positions: list[NetworkPosition] = Field(min_length=2)
    lanes: list[TransferLane] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_positions(self):
        ids = [item.warehouseId for item in self.positions]
        if len(ids) != len(set(ids)):
            raise ValueError("warehouseId values must be unique")
        return self


class AnomalyObservation(BaseModel):
    observationId: str
    features: dict[str, float] = Field(min_length=1)


class AnomalyRequest(BaseModel):
    tenantId: str
    observations: list[AnomalyObservation] = Field(min_length=8)
    contamination: float = Field(default=0.1, gt=0, le=0.5)


class TransferRequest(BaseModel):
    tenant_id: str
    sku_id: str
    source_warehouse_id: str
    destination_warehouse_id: str
    source_available: float = Field(ge=0)
    source_safety_stock: float = Field(ge=0)
    destination_shortage: float = Field(ge=0)
    transport_cost: float = Field(ge=0)
    unit_value: float = Field(ge=0)


class RoadEdge(BaseModel):
    fromNode: str
    toNode: str
    distanceKm: float = Field(gt=0)
    durationMin: float = Field(gt=0)
    closed: bool = False
    floodRisk: float = Field(default=0, ge=0, le=1)
    landslideRisk: float = Field(default=0, ge=0, le=1)
    roadBlockRisk: float = Field(default=0, ge=0, le=1)


class RouteStop(BaseModel):
    name: str
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    demandKg: float = Field(default=0, ge=0)
    serviceMinutes: int = Field(default=0, ge=0, le=1440)
    earliestMinutes: int = Field(default=0, ge=0, le=2879)
    latestMinutes: int = Field(default=2879, ge=0, le=2879)
    floodRisk: float = Field(default=0, ge=0, le=1)
    landslideRisk: float = Field(default=0, ge=0, le=1)
    roadBlockRisk: float = Field(default=0, ge=0, le=1)

    @model_validator(mode="after")
    def valid_window(self):
        if self.latestMinutes < self.earliestMinutes:
            raise ValueError("latestMinutes must be at or after earliestMinutes")
        return self


class VehicleRouteCandidate(BaseModel):
    id: str
    lane: str
    stops: list[str] = Field(min_length=2)
    stopDetails: list[RouteStop] = Field(default_factory=list)
    vehicle: str
    loadKg: float = Field(ge=0)
    capacityKg: float = Field(gt=0)
    baselineKm: float = Field(gt=0)
    priority: str = "Medium"
    status: str = "Draft"
    vehicleAvailable: bool = True
    coldChainRequired: bool = False
    coldChainAvailable: bool = True
    promisedDeliveryMinutes: int | None = Field(default=None, ge=0, le=2879)
    departureMinutes: int = Field(default=0, ge=0, le=2879)
    warehouseStockKg: float | None = Field(default=None, ge=0)
    floodRisk: float = Field(default=0, ge=0, le=1)
    landslideRisk: float = Field(default=0, ge=0, le=1)
    roadBlockRisk: float = Field(default=0, ge=0, le=1)
    roadClosed: bool = False
    lockVehicle: bool = False


class VehicleRoutingRequest(BaseModel):
    objective: Literal[
        "Balanced cost and carbon", "Lowest transport cost", "Lowest carbon impact",
        "Fastest service recovery", "Safest route", "Shortest path", "Greenest route",
    ] = "Balanced cost and carbon"
    vehicleType: str = "All eligible vehicles"
    routes: list[VehicleRouteCandidate] = Field(min_length=1, max_length=100)
    roadNetwork: list[RoadEdge] = Field(default_factory=list)
    includeLiveHazards: bool = True


class RouteStatusRequest(BaseModel):
    status: Literal["APPROVED", "IN_TRANSIT", "DELIVERED"]

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "optimisation-service",
            "models": ["STOCKPYL", "OR_TOOLS_SCIP", "OR_TOOLS_VRP", "PYOD",
                       "NASA_LHASA_ADAPTER", "GLOFAS_LISFLOOD_ADAPTER"]}


@app.post("/api/v1/inventory/policy")
def inventory_policy(request: InventoryPolicyRequest) -> dict:
    result = optimise_inventory_policy(**request.model_dump(exclude={"tenant_id", "warehouse_id", "sku_id"}))
    return {"tenantId": request.tenant_id, "warehouseId": request.warehouse_id, "skuId": request.sku_id, **result}


@app.post("/api/v1/transfers/optimize")
def transfer_network(request: NetworkTransferRequest) -> dict:
    result = optimise_transfer_network([item.model_dump() for item in request.positions],
                                       [item.model_dump() for item in request.lanes])
    return {"tenantId": request.tenantId, "skuId": request.skuId, **result}


@app.post("/api/v1/anomalies/score")
def anomalies(request: AnomalyRequest) -> dict:
    try:
        result = score_anomalies([item.model_dump() for item in request.observations], request.contamination)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return {"tenantId": request.tenantId, **result}


@app.get("/api/v1/hazards/model-outlooks")
async def model_hazards(provider: list[Literal["LHASA", "GLOFAS"]] = Query(default=["LHASA", "GLOFAS"])) -> dict:
    try:
        return await load_hazards(list(dict.fromkeys(provider)))
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Hazard provider could not be loaded: {error}") from error


@app.get("/api/v1/hazards/providers")
def hazard_providers() -> dict:
    return {"providers": [{"provider": key, **value} for key, value in PROVIDERS.items()]}


@app.post("/api/v1/routes/optimise")
async def vehicle_routes(request: VehicleRoutingRequest, tenant_id: str = Header(default="TEN-ACME-PHARMA", alias="X-Tenant-ID")) -> dict:
    tenant = tenant_id.strip() or "TEN-ACME-PHARMA"
    payload = request.model_dump()
    hazard_sources: list[str] = []
    if request.includeLiveHazards:
        try:
            outlooks = await load_hazards(["LHASA", "GLOFAS"])
            hazard_sources = apply_hazard_alerts(payload, outlooks.get("alerts", []))
        except Exception:
            hazard_sources = []
    response = {"tenantId": tenant, "objective": request.objective, "hazardSources": hazard_sources,
                **optimise_vehicle_routes(payload)}
    run_id = save_route_run(tenant, request.objective, payload, response)
    return {"runId": run_id, "persisted": True, **response}


@app.get("/api/v1/routes/runs/{run_id}")
def get_route_run(run_id: str, tenant_id: str = Header(default="TEN-ACME-PHARMA", alias="X-Tenant-ID")) -> dict:
    result = route_run(tenant_id.strip() or "TEN-ACME-PHARMA", run_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Route optimisation run was not found")
    return result


@app.post("/api/v1/routes/runs/{run_id}/routes/{route_id}/status")
def change_route_status(
    run_id: str, route_id: str, request: RouteStatusRequest,
    tenant_id: str = Header(default="TEN-ACME-PHARMA", alias="X-Tenant-ID"),
    actor_id: str = Header(default="demo-planner", alias="X-User-ID"),
) -> dict:
    try:
        return update_route_status(tenant_id.strip() or "TEN-ACME-PHARMA", run_id, route_id, request.status, actor_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

@app.post("/api/v1/recommend-transfer")
def recommend_transfer(request: TransferRequest) -> dict:
    transferable = max(int(request.source_available - request.source_safety_stock), 0)
    result = optimise_transfer_network([
        {"warehouseId": request.source_warehouse_id, "availableUnits": int(request.source_available),
         "safetyStockUnits": int(request.source_safety_stock), "targetStockUnits": 0,
         "shortagePenaltyPerUnit": max(request.unit_value, 0.01)},
        {"warehouseId": request.destination_warehouse_id, "availableUnits": 0, "safetyStockUnits": 0,
         "targetStockUnits": int(request.destination_shortage), "shortagePenaltyPerUnit": max(request.unit_value, 0.01)},
    ], [{"sourceWarehouseId": request.source_warehouse_id,
         "destinationWarehouseId": request.destination_warehouse_id,
         "costPerUnit": request.transport_cost / max(transferable, 1), "capacityUnits": transferable}])
    quantity = result["transfers"][0]["quantity"] if result["transfers"] else 0
    protected_value = quantity * request.unit_value
    allocated_cost = quantity * request.transport_cost / max(transferable, 1)
    net_benefit = protected_value - allocated_cost
    return {
        "action": "TRANSFER" if quantity > 0 and net_benefit > 0 else "NO_ACTION",
        "quantity": round(quantity, 2),
        "sourceWarehouseId": request.source_warehouse_id,
        "destinationWarehouseId": request.destination_warehouse_id,
        "estimatedProtectedValue": round(protected_value, 2),
        "transportCost": round(allocated_cost, 2),
        "netExpectedBenefit": round(net_benefit, 2),
        "constraintsChecked": result["constraintsChecked"],
        "model": result["model"],
        "requiresHumanApproval": True,
    }
