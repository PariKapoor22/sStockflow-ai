from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field, model_validator


FreshnessStatus = Literal["FRESH", "STALE", "UNINITIALIZED", "DEGRADED"]
ForecastStatus = Literal["PROVISIONAL", "VALIDATED"]


class DemandEvent(BaseModel):
    eventId: str = Field(min_length=1, max_length=128, description="Unique idempotent event identifier")
    tenantId: str = Field(min_length=1, max_length=64)
    warehouseId: str = Field(min_length=1, max_length=64)
    skuId: str = Field(min_length=1, max_length=80)
    timestamp: datetime = Field(description="ISO-8601 timestamp of transaction or observation")
    quantity: float = Field(ge=0.0, description="Observed demand or consumption quantity")
    features: dict[str, float] = Field(
        default_factory=dict,
        description="Optional exogenous numerical features (e.g. rainfall_mm_hr, hazard_risk, road_blocked)"
    )


class BatchDemandEventsRequest(BaseModel):
    events: list[DemandEvent] = Field(min_length=1, max_length=1000)


class ProvisionalForecastResponse(BaseModel):
    tenantId: str
    warehouseId: str
    skuId: str
    status: ForecastStatus = "PROVISIONAL"
    source: str = "RIVER_ONLINE"
    modelName: str
    modelVersion: str
    generationTime: str
    freshnessStatus: FreshnessStatus
    horizonDays: int
    pointForecast: list[float]
    lowerBounds: list[float]
    upperBounds: list[float]
    featuresUsed: list[str]
    trainingObservations: int
    fallbackUsed: bool = False
    fallbackReason: str | None = None


class OnlineModelHealthResponse(BaseModel):
    status: str
    service: str = "stockflow-forecasting-online"
    riverVersion: str
    activePositionsCount: int
    totalEventsProcessed: int
    checkpointDir: str
    persistenceMode: str
    minimumTrainingObservations: int


class PositionPromotionResult(BaseModel):
    warehouseId: str
    skuId: str
    riverWape: float
    statsforecastWape: float
    wapeDifference: float
    promoted: bool
    reason: str


class PromotionEvaluationResponse(BaseModel):
    tenantId: str
    evaluatedPositions: list[PositionPromotionResult]
    summary: dict[str, Any]
