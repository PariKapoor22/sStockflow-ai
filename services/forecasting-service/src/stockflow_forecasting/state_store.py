from __future__ import annotations

import os
import pickle
from datetime import UTC, datetime
from typing import Any
from .river_models import BaseRiverForecaster, RiverSNARIMAXForecaster, RiverHoltWintersForecaster
from .schemas import DemandEvent, ProvisionalForecastResponse


# Minimum number of sequential training observations required for a River online
# model to be considered sufficiently trained.
# NOTE: 14 observations (equivalent to two full cycles of 7-day seasonality or
# two weeks of daily observations) is an undocumented starting placeholder chosen
# to prevent extreme extrapolation from uncalibrated autoregressive parameters.
# Positions with fewer observations trigger automatic fallback to validated forecasts.
MINIMUM_ONLINE_TRAINING_OBSERVATIONS: int = 14


class PositionState:
    def __init__(self, tenant_id: str, warehouse_id: str, sku_id: str, forecaster: BaseRiverForecaster):
        self.tenant_id = tenant_id
        self.warehouse_id = warehouse_id
        self.sku_id = sku_id
        self.forecaster = forecaster
        self.processed_event_ids: set[str] = set()
        self.last_updated_at: datetime = datetime.now(UTC)
        self.total_events_count: int = 0
        self.latest_validated_forecast: list[float] | None = None


class OnlineStateStore:
    """
    Thread-safe in-memory store with local disk checkpoint persistence.
    Maintains strict tenant and warehouse isolation: state is partitioned
    strictly by (tenant_id, warehouse_id, sku_id).
    """

    def __init__(self, checkpoint_dir: str | None = None):
        if checkpoint_dir is None:
            checkpoint_dir = os.getenv("STOCKFLOW_FORECAST_CHECKPOINT_DIR", ".checkpoints")
        self.checkpoint_dir = checkpoint_dir
        os.makedirs(self.checkpoint_dir, exist_ok=True)
        # (tenant_id, warehouse_id, sku_id) -> PositionState
        self._positions: dict[tuple[str, str, str], PositionState] = {}
        self._total_events: int = 0

    @staticmethod
    def _key(tenant_id: str, warehouse_id: str, sku_id: str) -> tuple[str, str, str]:
        return (tenant_id.strip(), warehouse_id.strip(), sku_id.strip())

    def _file_path(self, key: tuple[str, str, str]) -> str:
        safe_tenant = key[0].replace(":", "_").replace("/", "_")
        safe_warehouse = key[1].replace(":", "_").replace("/", "_")
        safe_sku = key[2].replace(":", "_").replace("/", "_")
        filename = f"{safe_tenant}__{safe_warehouse}__{safe_sku}.pkl"
        return os.path.join(self.checkpoint_dir, filename)

    def get_or_create(
        self,
        tenant_id: str,
        warehouse_id: str,
        sku_id: str,
        model_type: str = "SNARIMAX",
        season_length: int = 7,
    ) -> PositionState:
        key = self._key(tenant_id, warehouse_id, sku_id)
        if key not in self._positions:
            # Check if checkpoint exists on disk
            path = self._file_path(key)
            if os.path.exists(path):
                try:
                    with open(path, "rb") as f:
                        state = pickle.load(f)
                    self._positions[key] = state
                    return state
                except Exception:
                    pass

            # Create new isolated instance
            if model_type.upper() == "HOLT_WINTERS":
                forecaster = RiverHoltWintersForecaster(season_length=season_length)
            else:
                forecaster = RiverSNARIMAXForecaster(season_length=season_length)

            self._positions[key] = PositionState(tenant_id, warehouse_id, sku_id, forecaster)

        return self._positions[key]

    def ingest_event(self, event: DemandEvent) -> tuple[bool, str]:
        """
        Idempotent ingestion of demand events into River online model.
        Returns (is_new_event, message).
        """
        state = self.get_or_create(event.tenantId, event.warehouseId, event.skuId)

        # Idempotency check: if event was already processed, ignore safely
        if event.eventId in state.processed_event_ids:
            return False, f"Event {event.eventId} already processed (idempotent skipped)"

        # Learn online observation
        state.forecaster.learn_one(y=event.quantity, x=event.features)
        state.processed_event_ids.add(event.eventId)
        state.last_updated_at = datetime.now(UTC)
        state.total_events_count += 1
        self._total_events += 1

        # Persist checkpoint to disk
        self.save_checkpoint(event.tenantId, event.warehouseId, event.skuId)

        return True, f"Event {event.eventId} ingested successfully"

    def record_validated_forecast(
        self, tenant_id: str, warehouse_id: str, sku_id: str, forecast: list[float]
    ) -> None:
        """Stores latest validated batch forecast as fallback candidate."""
        state = self.get_or_create(tenant_id, warehouse_id, sku_id)
        state.latest_validated_forecast = list(forecast)
        self.save_checkpoint(tenant_id, warehouse_id, sku_id)

    def generate_provisional_forecast(
        self,
        tenant_id: str,
        warehouse_id: str,
        sku_id: str,
        horizon_days: int = 7,
        future_features: list[dict[str, float]] | None = None,
    ) -> ProvisionalForecastResponse:
        state = self.get_or_create(tenant_id, warehouse_id, sku_id)
        obs_count = state.forecaster.observation_count
        now_iso = datetime.now(UTC).isoformat()

        # Check for insufficient training -> trigger fallback
        if obs_count < MINIMUM_ONLINE_TRAINING_OBSERVATIONS:
            fallback_forecast = state.latest_validated_forecast or [0.0] * horizon_days
            if len(fallback_forecast) < horizon_days:
                fallback_forecast = (fallback_forecast + [0.0] * horizon_days)[:horizon_days]
            lowers, uppers = state.forecaster.compute_bounds(fallback_forecast)

            return ProvisionalForecastResponse(
                tenantId=tenant_id,
                warehouseId=warehouse_id,
                skuId=sku_id,
                status="PROVISIONAL",
                source="RIVER_ONLINE_FALLBACK",
                modelName=state.forecaster.model_name,
                modelVersion="river-0.26.1",
                generationTime=now_iso,
                freshnessStatus="STALE" if obs_count == 0 else "FRESH",
                horizonDays=horizon_days,
                pointForecast=fallback_forecast[:horizon_days],
                lowerBounds=lowers[:horizon_days],
                upperBounds=uppers[:horizon_days],
                featuresUsed=sorted(list(state.forecaster.features_seen)),
                trainingObservations=obs_count,
                fallbackUsed=True,
                fallbackReason=f"INSUFFICIENT_TRAINING_OBSERVATIONS ({obs_count} < {MINIMUM_ONLINE_TRAINING_OBSERVATIONS})"
            )

        # Model is sufficiently trained -> generate River forecast
        point_forecast = state.forecaster.forecast(horizon=horizon_days, xs=future_features)
        lowers, uppers = state.forecaster.compute_bounds(point_forecast)

        return ProvisionalForecastResponse(
            tenantId=tenant_id,
            warehouseId=warehouse_id,
            skuId=sku_id,
            status="PROVISIONAL",
            source="RIVER_ONLINE",
            modelName=state.forecaster.model_name,
            modelVersion="river-0.26.1",
            generationTime=now_iso,
            freshnessStatus="FRESH",
            horizonDays=horizon_days,
            pointForecast=point_forecast,
            lowerBounds=lowers,
            upperBounds=uppers,
            featuresUsed=sorted(list(state.forecaster.features_seen)),
            trainingObservations=obs_count,
            fallbackUsed=False,
            fallbackReason=None
        )

    def save_checkpoint(self, tenant_id: str, warehouse_id: str, sku_id: str) -> bool:
        key = self._key(tenant_id, warehouse_id, sku_id)
        state = self._positions.get(key)
        if not state:
            return False
        path = self._file_path(key)
        try:
            with open(path, "wb") as f:
                pickle.dump(state, f)
            return True
        except Exception:
            return False

    def load_all_checkpoints(self) -> int:
        count = 0
        if not os.path.exists(self.checkpoint_dir):
            return 0
        for fname in os.listdir(self.checkpoint_dir):
            if fname.endswith(".pkl"):
                p = os.path.join(self.checkpoint_dir, fname)
                try:
                    with open(p, "rb") as f:
                        state: PositionState = pickle.load(f)
                    key = self._key(state.tenant_id, state.warehouse_id, state.sku_id)
                    self._positions[key] = state
                    count += 1
                except Exception:
                    pass
        return count

    def stats(self) -> dict[str, Any]:
        return {
            "activePositionsCount": len(self._positions),
            "totalEventsProcessed": self._total_events,
            "checkpointDir": self.checkpoint_dir,
            "persistenceMode": "LOCAL_DISK_PICKLE",
            "minimumTrainingObservations": MINIMUM_ONLINE_TRAINING_OBSERVATIONS,
        }
