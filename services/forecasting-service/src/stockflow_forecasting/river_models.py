from __future__ import annotations

import math
from typing import Any
from river import time_series


class BaseRiverForecaster:
    """Base interface for incremental online time-series forecasters using River."""

    def __init__(self, model_name: str, season_length: int = 7):
        self.model_name = model_name
        self.season_length = season_length
        self.observation_count: int = 0
        self.sum_squared_error: float = 0.0
        self.last_prediction: float = 0.0
        self.features_seen: set[str] = set()

    def learn_one(self, y: float, x: dict[str, float] | None = None) -> None:
        raise NotImplementedError

    def forecast(self, horizon: int, xs: list[dict[str, float]] | None = None) -> list[float]:
        raise NotImplementedError

    @property
    def rmse(self) -> float:
        if self.observation_count <= 1:
            return 1.0
        return math.sqrt(self.sum_squared_error / max(self.observation_count - 1, 1))

    def compute_bounds(self, point_forecast: list[float]) -> tuple[list[float], list[float]]:
        error_scale = max(self.rmse, 0.5)
        lowers = [
            max(0.0, round(float(val - 1.96 * error_scale * math.sqrt(idx + 1)), 4))
            for idx, val in enumerate(point_forecast)
        ]
        uppers = [
            round(float(val + 1.96 * error_scale * math.sqrt(idx + 1)), 4)
            for idx, val in enumerate(point_forecast)
        ]
        return lowers, uppers


class RiverSNARIMAXForecaster(BaseRiverForecaster):
    """
    River SNARIMAX online forecaster.
    Supports exogenous features (weather, road disruption, hazard scores).
    """

    def __init__(self, season_length: int = 7, p: int = 1, d: int = 0, q: int = 1):
        super().__init__(model_name="RIVER_SNARIMAX", season_length=season_length)
        self.model = time_series.SNARIMAX(
            p=p,
            d=d,
            q=q,
            m=season_length,
        )

    def learn_one(self, y: float, x: dict[str, float] | None = None) -> None:
        feat = dict(x or {})
        if feat:
            self.features_seen.update(feat.keys())

        # Update running error metrics against prior 1-step forecast
        if self.observation_count > 0:
            err = self.last_prediction - y
            self.sum_squared_error += err * err

        self.model.learn_one(y=float(y), x=feat if feat else None)
        self.observation_count += 1

        # Predict next step ahead for tracking error in subsequent observation
        try:
            preds = self.model.forecast(horizon=1, xs=[feat] if feat else None)
            self.last_prediction = max(float(preds[0]), 0.0)
        except Exception:
            self.last_prediction = float(y)

    def forecast(self, horizon: int, xs: list[dict[str, float]] | None = None) -> list[float]:
        if horizon <= 0:
            return []
        try:
            raw = self.model.forecast(horizon=horizon, xs=xs if xs else None)
            return [max(round(float(val), 4), 0.0) for val in raw]
        except Exception:
            # Fallback to last known prediction repeated if forecast matrix has singularity
            val = max(round(self.last_prediction, 4), 0.0)
            return [val] * horizon


class RiverHoltWintersForecaster(BaseRiverForecaster):
    """
    River Holt-Winters additive online forecaster for seasonal/trended demand.
    """

    def __init__(self, season_length: int = 7, alpha: float = 0.3, beta: float = 0.1, gamma: float = 0.3):
        super().__init__(model_name="RIVER_HOLT_WINTERS", season_length=season_length)
        self.model = time_series.HoltWinters(
            alpha=alpha,
            beta=beta,
            gamma=gamma,
            seasonality=season_length,
        )

    def learn_one(self, y: float, x: dict[str, float] | None = None) -> None:
        if self.observation_count > 0:
            err = self.last_prediction - y
            self.sum_squared_error += err * err

        self.model.learn_one(y=float(y))
        self.observation_count += 1

        try:
            preds = self.model.forecast(horizon=1)
            self.last_prediction = max(float(preds[0]), 0.0)
        except Exception:
            self.last_prediction = float(y)

    def forecast(self, horizon: int, xs: list[dict[str, float]] | None = None) -> list[float]:
        if horizon <= 0:
            return []
        try:
            raw = self.model.forecast(horizon=horizon)
            return [max(round(float(val), 4), 0.0) for val in raw]
        except Exception:
            val = max(round(self.last_prediction, 4), 0.0)
            return [val] * horizon
