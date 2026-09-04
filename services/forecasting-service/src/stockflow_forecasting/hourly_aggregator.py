from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from .schemas import DemandEvent, FreshnessStatus


# Debounce window in seconds before triggering an automated refresh or flushed batch.
# NOTE: 180 seconds (3 minutes) is an undocumented starting placeholder chosen for
# operational buffering in local/pilot deployments, not an empirically tuned optimum.
DEBOUNCE_WINDOW_SECONDS: int = 180

# Threshold for freshness status
STALENESS_THRESHOLD_SECONDS: int = 7200  # 2 hours


class HourlyBucket:
    def __init__(self, bucket_time: datetime):
        self.bucket_time = bucket_time
        self.total_quantity: float = 0.0
        self.event_count: int = 0
        self.feature_sums: dict[str, float] = {}
        self.last_event_time: datetime = bucket_time

    def add_event(self, event: DemandEvent) -> None:
        self.total_quantity += event.quantity
        self.event_count += 1
        self.last_event_time = event.timestamp
        for k, v in event.features.items():
            self.feature_sums[k] = self.feature_sums.get(k, 0.0) + float(v)

    def averaged_features(self) -> dict[str, float]:
        if self.event_count == 0:
            return {}
        return {k: v / self.event_count for k, v in self.feature_sums.items()}


class HourlyDemandAggregator:
    """
    Buffers and aggregates incoming demand events into discrete hourly buckets
    per (tenant_id, warehouse_id, sku_id).
    """

    def __init__(self, debounce_seconds: int = DEBOUNCE_WINDOW_SECONDS):
        self.debounce_seconds = debounce_seconds
        # (tenant, warehouse, sku, hour_iso) -> HourlyBucket
        self._buckets: dict[tuple[str, str, str, str], HourlyBucket] = {}
        # (tenant, warehouse, sku) -> last_event_datetime
        self._last_event_times: dict[tuple[str, str, str], datetime] = {}
        # (tenant, warehouse, sku) -> last_forecast_generation_time
        self._generation_times: dict[tuple[str, str, str], datetime] = {}

    @staticmethod
    def _hour_key(dt: datetime) -> str:
        truncated = dt.astimezone(UTC).replace(minute=0, second=0, microsecond=0)
        return truncated.isoformat()

    def ingest(self, event: DemandEvent) -> HourlyBucket:
        pos_key = (event.tenantId, event.warehouseId, event.skuId)
        hour_key = self._hour_key(event.timestamp)
        full_key = (*pos_key, hour_key)

        if full_key not in self._buckets:
            bucket_dt = datetime.fromisoformat(hour_key)
            self._buckets[full_key] = HourlyBucket(bucket_dt)

        bucket = self._buckets[full_key]
        bucket.add_event(event)
        self._last_event_times[pos_key] = datetime.now(UTC)
        return bucket

    def record_forecast_generation(self, tenant_id: str, warehouse_id: str, sku_id: str) -> datetime:
        now = datetime.now(UTC)
        self._generation_times[(tenant_id, warehouse_id, sku_id)] = now
        return now

    def get_freshness(self, tenant_id: str, warehouse_id: str, sku_id: str) -> FreshnessStatus:
        pos_key = (tenant_id, warehouse_id, sku_id)
        last_gen = self._generation_times.get(pos_key)
        if last_gen is None:
            return "UNINITIALIZED"

        elapsed = (datetime.now(UTC) - last_gen).total_seconds()
        if elapsed <= STALENESS_THRESHOLD_SECONDS:
            return "FRESH"
        return "STALE"
