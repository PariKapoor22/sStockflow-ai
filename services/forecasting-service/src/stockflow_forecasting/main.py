from __future__ import annotations

from importlib.metadata import version
from math import sqrt
from typing import Callable, Literal

import numpy as np
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, model_validator
from statsforecast.models import AutoARIMA, AutoETS, CrostonOptimized, SeasonalNaive


app = FastAPI(
    title="StockFlow StatsForecast Service",
    description="Open-source challenger models for StockFlow demand-forecast governance.",
    version="1.0.0",
)

ModelCode = Literal[
    "STATS_AUTO_ETS",
    "STATS_AUTO_ARIMA",
    "STATS_CROSTON_OPTIMIZED",
    "STATS_SEASONAL_NAIVE",
]


class CandidateRequest(BaseModel):
    tenantId: str = Field(min_length=1, max_length=64)
    warehouseId: str = Field(min_length=1, max_length=64)
    skuId: str = Field(min_length=1, max_length=80)
    modelHistory: list[float] = Field(min_length=14, max_length=730)
    actualHistory: list[float] = Field(min_length=14, max_length=730)
    horizonDays: int = Field(ge=1, le=180)
    backtestPeriods: int = Field(default=28, ge=2, le=90)
    minimumTrainingPeriods: int = Field(default=14, ge=7, le=365)
    seasonLength: int = Field(default=7, ge=1, le=365)
    demandPattern: Literal["SMOOTH", "ERRATIC", "INTERMITTENT", "LUMPY"]
    modelCodes: list[ModelCode] = Field(default_factory=lambda: [
        "STATS_AUTO_ETS",
        "STATS_AUTO_ARIMA",
        "STATS_CROSTON_OPTIMIZED",
        "STATS_SEASONAL_NAIVE",
    ])

    @model_validator(mode="after")
    def histories_align(self) -> "CandidateRequest":
        if len(self.modelHistory) != len(self.actualHistory):
            raise ValueError("modelHistory and actualHistory must have equal length")
        if self.minimumTrainingPeriods >= len(self.actualHistory):
            raise ValueError("minimumTrainingPeriods must be smaller than the history length")
        if any(not np.isfinite(value) or value < 0 for value in self.modelHistory + self.actualHistory):
            raise ValueError("history values must be finite and non-negative")
        return self


class CandidateResult(BaseModel):
    modelCode: ModelCode
    trainingSampleCount: int
    backtestPoints: int
    mae: float
    rmse: float
    mape: float | None
    wape: float
    smape: float
    mase: float | None
    rmsse: float | None
    bias: float
    selectionScore: float
    forecast: list[float]
    lowerBounds: list[float]
    upperBounds: list[float]


class CandidateResponse(BaseModel):
    tenantId: str
    warehouseId: str
    skuId: str
    engine: str
    engineVersion: str
    candidates: list[CandidateResult]
    failures: dict[str, str]


MODEL_FACTORIES: dict[str, Callable[[int], object]] = {
    "STATS_AUTO_ETS": lambda season: AutoETS(season_length=season),
    "STATS_AUTO_ARIMA": lambda season: AutoARIMA(season_length=season),
    "STATS_CROSTON_OPTIMIZED": lambda _season: CrostonOptimized(),
    "STATS_SEASONAL_NAIVE": lambda season: SeasonalNaive(season_length=season),
}

INTERMITTENT_MODELS = {"STATS_CROSTON_OPTIMIZED"}


def point_forecast(model_code: str, season_length: int, history: list[float], horizon: int) -> list[float]:
    model = MODEL_FACTORIES[model_code](season_length)
    result = model.forecast(np.asarray(history, dtype=np.float64), h=horizon)
    values = np.asarray(result["mean"], dtype=np.float64).reshape(-1)
    if len(values) != horizon or not np.all(np.isfinite(values)):
        raise ValueError(f"{model_code} returned an invalid forecast")
    return [max(float(value), 0.0) for value in values]


def candidate_metrics(request: CandidateRequest, model_code: ModelCode) -> CandidateResult:
    model_history = request.modelHistory
    actual_history = request.actualHistory
    start = max(request.minimumTrainingPeriods, len(actual_history) - request.backtestPeriods)
    predictions: list[float] = []
    actuals: list[float] = []
    for index in range(start, len(actual_history)):
        predictions.append(point_forecast(model_code, request.seasonLength, model_history[:index], 1)[0])
        actuals.append(max(float(actual_history[index]), 0.0))
    if not predictions:
        raise ValueError("not enough observations for backtesting")

    predicted = np.asarray(predictions)
    actual = np.asarray(actuals)
    errors = predicted - actual
    absolute_errors = np.abs(errors)
    squared_errors = np.square(errors)
    mae = float(np.mean(absolute_errors))
    rmse = float(sqrt(float(np.mean(squared_errors))))
    non_zero = actual != 0
    mape = float(np.mean(absolute_errors[non_zero] / np.abs(actual[non_zero])) * 100) if np.any(non_zero) else None
    total_actual = float(np.sum(np.abs(actual)))
    wape = float(np.sum(absolute_errors) * 100 / total_actual) if total_actual > 0 else mae
    denominator = np.abs(predicted) + np.abs(actual)
    smape_values = np.divide(200 * absolute_errors, denominator, out=np.zeros_like(denominator), where=denominator != 0)
    smape = float(np.mean(smape_values))
    naive_differences = np.diff(np.asarray(actual_history, dtype=np.float64))
    absolute_scale = float(np.mean(np.abs(naive_differences))) if len(naive_differences) else 0.0
    squared_scale = float(np.mean(np.square(naive_differences))) if len(naive_differences) else 0.0
    mase = mae / absolute_scale if absolute_scale > 0 else None
    rmsse = rmse / sqrt(squared_scale) if squared_scale > 0 else None
    bias = float(np.mean(errors))
    selection_score = mase * 100 + wape / 100 if mase is not None else wape + 1000
    intermittent_demand = request.demandPattern in {"INTERMITTENT", "LUMPY"}
    if intermittent_demand and model_code not in INTERMITTENT_MODELS:
        selection_score += 2
    elif not intermittent_demand and model_code in INTERMITTENT_MODELS:
        selection_score += 10

    forecast = point_forecast(model_code, request.seasonLength, model_history, request.horizonDays)
    lower_bounds = [max(value - 1.96 * rmse * sqrt(index + 1), 0.0) for index, value in enumerate(forecast)]
    upper_bounds = [value + 1.96 * rmse * sqrt(index + 1) for index, value in enumerate(forecast)]
    rounded = lambda value: round(float(value), 6)
    return CandidateResult(
        modelCode=model_code,
        trainingSampleCount=len(actual_history),
        backtestPoints=len(predictions),
        mae=rounded(mae),
        rmse=rounded(rmse),
        mape=rounded(mape) if mape is not None else None,
        wape=rounded(wape),
        smape=rounded(smape),
        mase=rounded(mase) if mase is not None else None,
        rmsse=rounded(rmsse) if rmsse is not None else None,
        bias=rounded(bias),
        selectionScore=rounded(selection_score),
        forecast=[rounded(value) for value in forecast],
        lowerBounds=[rounded(value) for value in lower_bounds],
        upperBounds=[rounded(value) for value in upper_bounds],
    )


@app.get("/health")
def health() -> dict:
    return {
        "status": "UP",
        "service": "stockflow-statsforecast",
        "version": app.version,
        "engineVersion": version("statsforecast"),
    }


@app.post("/api/v1/forecast/candidates", response_model=CandidateResponse)
def forecast_candidates(
    request: CandidateRequest,
    tenant_id: str = Header(alias="X-Tenant-ID"),
) -> CandidateResponse:
    if tenant_id.strip() != request.tenantId:
        raise HTTPException(status_code=403, detail="X-Tenant-ID does not match the request tenant")
    candidates: list[CandidateResult] = []
    failures: dict[str, str] = {}
    for model_code in dict.fromkeys(request.modelCodes):
        try:
            candidates.append(candidate_metrics(request, model_code))
        except Exception as error:
            failures[model_code] = str(error)[:240]
    if not candidates:
        raise HTTPException(status_code=422, detail={"message": "No StatsForecast candidate could be evaluated", "failures": failures})
    return CandidateResponse(
        tenantId=request.tenantId,
        warehouseId=request.warehouseId,
        skuId=request.skuId,
        engine="StatsForecast",
        engineVersion=version("statsforecast"),
        candidates=sorted(candidates, key=lambda item: (item.selectionScore, item.wape, item.modelCode)),
        failures=failures,
    )
