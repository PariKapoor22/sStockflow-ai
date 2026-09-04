from __future__ import annotations

import tempfile
import pytest
from datetime import UTC, datetime, timedelta
from fastapi.testclient import TestClient

from stockflow_forecasting.main import app
from stockflow_forecasting.state_store import OnlineStateStore, MINIMUM_ONLINE_TRAINING_OBSERVATIONS
from stockflow_forecasting.hourly_aggregator import DEBOUNCE_WINDOW_SECONDS, HourlyDemandAggregator
from stockflow_forecasting.governance import PROMOTION_WAPE_IMPROVEMENT_THRESHOLD, evaluate_promotion
from stockflow_forecasting.schemas import DemandEvent


client = TestClient(app)


def test_online_health_reports_river_version_and_stats():
    res_health = client.get("/health")
    assert res_health.status_code == 200
    data = res_health.json()
    assert "riverVersion" in data
    assert data["status"] == "UP"

    res_online = client.get("/api/v1/forecast/online/health")
    assert res_online.status_code == 200
    online_data = res_online.json()
    assert online_data["status"] == "UP"
    assert online_data["minimumTrainingObservations"] == 14
    assert online_data["persistenceMode"] == "LOCAL_DISK_PICKLE"


def test_state_isolation_between_tenants_and_warehouses():
    with tempfile.TemporaryDirectory() as tmp_dir:
        store = OnlineStateStore(checkpoint_dir=tmp_dir)

        # Tenant A: high demand (100)
        for i in range(16):
            ev_a = DemandEvent(
                eventId=f"ev-a-{i}",
                tenantId="TEN-ACME-PHARMA",
                warehouseId="WH-GUWAHATI",
                skuId="SKU-PARA-650",
                timestamp=datetime.now(UTC) + timedelta(days=i),
                quantity=100.0,
            )
            store.ingest_event(ev_a)

        # Tenant B: low demand (5)
        for i in range(16):
            ev_b = DemandEvent(
                eventId=f"ev-b-{i}",
                tenantId="TEN-FRESH-MART",
                warehouseId="WH-SHILLONG",
                skuId="SKU-SUP-005",
                timestamp=datetime.now(UTC) + timedelta(days=i),
                quantity=5.0,
            )
            store.ingest_event(ev_b)

        fc_a = store.generate_provisional_forecast("TEN-ACME-PHARMA", "WH-GUWAHATI", "SKU-PARA-650", horizon_days=3)
        fc_b = store.generate_provisional_forecast("TEN-FRESH-MART", "WH-SHILLONG", "SKU-SUP-005", horizon_days=3)

        assert fc_a.tenantId == "TEN-ACME-PHARMA"
        assert fc_b.tenantId == "TEN-FRESH-MART"
        assert fc_a.fallbackUsed is False
        assert fc_b.fallbackUsed is False
        # Point forecasts must remain strongly separated, proving no state leakage
        assert sum(fc_a.pointForecast) > 150.0
        assert sum(fc_b.pointForecast) < 50.0


def test_idempotent_event_ingestion():
    with tempfile.TemporaryDirectory() as tmp_dir:
        store = OnlineStateStore(checkpoint_dir=tmp_dir)
        ev = DemandEvent(
            eventId="EV-UNIQUE-12345",
            tenantId="TEN-ACME-PHARMA",
            warehouseId="WH-GUWAHATI",
            skuId="SKU-PARA-650",
            timestamp=datetime.now(UTC),
            quantity=42.0,
        )

        is_new1, msg1 = store.ingest_event(ev)
        assert is_new1 is True
        state1 = store.get_or_create("TEN-ACME-PHARMA", "WH-GUWAHATI", "SKU-PARA-650")
        assert state1.forecaster.observation_count == 1
        prediction_before = state1.forecaster.last_prediction
        fc_before = store.generate_provisional_forecast("TEN-ACME-PHARMA", "WH-GUWAHATI", "SKU-PARA-650", horizon_days=3)

        # Replay identical event
        is_new2, msg2 = store.ingest_event(ev)
        assert is_new2 is False
        assert "already processed" in msg2
        # Observation count and model predictions must NOT have changed by even 1 bit
        assert state1.forecaster.observation_count == 1
        assert state1.forecaster.last_prediction == prediction_before
        fc_after = store.generate_provisional_forecast("TEN-ACME-PHARMA", "WH-GUWAHATI", "SKU-PARA-650", horizon_days=3)
        assert fc_after.pointForecast == fc_before.pointForecast


def test_checkpoint_persistence_across_simulated_restart():
    with tempfile.TemporaryDirectory() as tmp_dir:
        # First process instance: ingest 15 events and generate reference forecast
        store1 = OnlineStateStore(checkpoint_dir=tmp_dir)
        for i in range(15):
            ev = DemandEvent(
                eventId=f"chk-{i}",
                tenantId="TEN-TEST",
                warehouseId="WH-1",
                skuId="SKU-1",
                timestamp=datetime.now(UTC) + timedelta(hours=i),
                quantity=20.0 + i,
            )
            store1.ingest_event(ev)

        fc1 = store1.generate_provisional_forecast("TEN-TEST", "WH-1", "SKU-1", horizon_days=3)
        del store1  # Destroy in-memory state completely

        # Simulate full restart: instantiate brand new OnlineStateStore reading same checkpoint dir
        store2 = OnlineStateStore(checkpoint_dir=tmp_dir)
        reloaded_state = store2.get_or_create("TEN-TEST", "WH-1", "SKU-1")

        # Verify state metadata survived
        assert reloaded_state.forecaster.observation_count == 15
        assert len(reloaded_state.processed_event_ids) == 15
        assert "chk-0" in reloaded_state.processed_event_ids
        assert "chk-14" in reloaded_state.processed_event_ids

        # Verify numerical point forecast and confidence bounds match the pre-restart output exactly
        fc2 = store2.generate_provisional_forecast("TEN-TEST", "WH-1", "SKU-1", horizon_days=3)
        assert fc2.fallbackUsed is False
        assert fc2.trainingObservations == 15
        assert fc2.pointForecast == fc1.pointForecast
        assert fc2.lowerBounds == fc1.lowerBounds
        assert fc2.upperBounds == fc1.upperBounds


def test_fallback_to_validated_when_untrained():
    with tempfile.TemporaryDirectory() as tmp_dir:
        store = OnlineStateStore(checkpoint_dir=tmp_dir)
        # Store a validated batch forecast
        validated_values = [30.0, 31.0, 32.0, 30.0, 29.0, 30.0, 31.0]
        store.record_validated_forecast("TEN-TEST", "WH-1", "SKU-FALLBACK", validated_values)

        # Ingest only 5 events (< MINIMUM_ONLINE_TRAINING_OBSERVATIONS = 14)
        for i in range(5):
            ev = DemandEvent(
                eventId=f"fallback-ev-{i}",
                tenantId="TEN-TEST",
                warehouseId="WH-1",
                skuId="SKU-FALLBACK",
                timestamp=datetime.now(UTC) + timedelta(days=i),
                quantity=15.0,
            )
            store.ingest_event(ev)

        fc = store.generate_provisional_forecast("TEN-TEST", "WH-1", "SKU-FALLBACK", horizon_days=7)
        assert fc.status == "PROVISIONAL"
        assert fc.fallbackUsed is True
        assert fc.fallbackReason == f"INSUFFICIENT_TRAINING_OBSERVATIONS (5 < {MINIMUM_ONLINE_TRAINING_OBSERVATIONS})"
        assert fc.pointForecast == validated_values


def test_governed_promotion_comparison():
    # River WAPE 15.0%, StatsForecast WAPE 20.0% -> difference is 5.0% >= 2.0% threshold -> Promoted
    actuals = [10.0, 10.0, 10.0, 10.0, 10.0]
    preds_better = [11.0, 11.0, 11.0, 11.0, 11.0]  # total error 5.0, actual 50.0 -> WAPE = 10.0%
    res1 = evaluate_promotion("WH-1", "SKU-1", actuals, preds_better, statsforecast_wape=20.0, threshold=PROMOTION_WAPE_IMPROVEMENT_THRESHOLD)
    assert res1.promoted is True
    assert res1.riverWape == 10.0
    assert res1.statsforecastWape == 20.0
    assert res1.wapeDifference == 10.0

    # River WAPE 19.0%, StatsForecast WAPE 20.0% -> difference is 1.0% < 2.0% threshold -> Not Promoted
    preds_marginal = [11.9, 11.9, 11.9, 11.9, 11.9]  # total error 9.5, actual 50.0 -> WAPE = 19.0%
    res2 = evaluate_promotion("WH-1", "SKU-1", actuals, preds_marginal, statsforecast_wape=20.0, threshold=PROMOTION_WAPE_IMPROVEMENT_THRESHOLD)
    assert res2.promoted is False
    assert "did not satisfy" in res2.reason


def test_exogenous_disruption_feature_input():
    with tempfile.TemporaryDirectory() as tmp_dir:
        store = OnlineStateStore(checkpoint_dir=tmp_dir)
        for i in range(16):
            ev = DemandEvent(
                eventId=f"hazard-ev-{i}",
                tenantId="TEN-ACME-PHARMA",
                warehouseId="WH-GUWAHATI",
                skuId="SKU-PARA-650",
                timestamp=datetime.now(UTC) + timedelta(days=i),
                quantity=50.0 + i * 2.0,
                features={
                    "rainfall_mm_hr": 45.0 if i % 2 == 0 else 5.0,
                    "hazard_risk": 0.82 if i % 2 == 0 else 0.10,
                    "road_blocked": 1.0 if i % 2 == 0 else 0.0,
                },
            )
            store.ingest_event(ev)

        # Forecast under high disruption
        fc_disrupted = store.generate_provisional_forecast(
            "TEN-ACME-PHARMA",
            "WH-GUWAHATI",
            "SKU-PARA-650",
            horizon_days=3,
            future_features=[
                {"rainfall_mm_hr": 80.0, "hazard_risk": 0.95, "road_blocked": 1.0},
                {"rainfall_mm_hr": 60.0, "hazard_risk": 0.85, "road_blocked": 1.0},
                {"rainfall_mm_hr": 40.0, "hazard_risk": 0.75, "road_blocked": 1.0},
            ],
        )

        # Forecast under zero disruption / clear weather
        fc_clear = store.generate_provisional_forecast(
            "TEN-ACME-PHARMA",
            "WH-GUWAHATI",
            "SKU-PARA-650",
            horizon_days=3,
            future_features=[
                {"rainfall_mm_hr": 0.0, "hazard_risk": 0.0, "road_blocked": 0.0},
                {"rainfall_mm_hr": 0.0, "hazard_risk": 0.0, "road_blocked": 0.0},
                {"rainfall_mm_hr": 0.0, "hazard_risk": 0.0, "road_blocked": 0.0},
            ],
        )

        # Assert status and properties
        assert fc_disrupted.status == "PROVISIONAL"
        assert fc_disrupted.fallbackUsed is False
        assert sorted(fc_disrupted.featuresUsed) == ["hazard_risk", "rainfall_mm_hr", "road_blocked"]
        assert len(fc_disrupted.pointForecast) == 3

        # Assert exogenous variables actively impact mathematical predictions (not just decorative metadata)
        assert fc_disrupted.pointForecast != fc_clear.pointForecast


def test_online_endpoints_via_testclient():
    import uuid
    headers = {"X-Tenant-ID": "TEN-ACME-PHARMA"}
    sku = f"SKU-TEST-{uuid.uuid4().hex[:8]}"
    event_id = f"API-EV-{uuid.uuid4().hex[:8]}"

    # Ingest event via API
    ingest_res = client.post(
        "/api/v1/forecast/online/events",
        headers=headers,
        json={
            "eventId": event_id,
            "tenantId": "TEN-ACME-PHARMA",
            "warehouseId": "WH-GUWAHATI",
            "skuId": sku,
            "timestamp": datetime.now(UTC).isoformat(),
            "quantity": 35.0,
            "features": {"rainfall_mm_hr": 20.0, "hazard_risk": 0.45},
        },
    )
    assert ingest_res.status_code == 200
    assert ingest_res.json()["ingested"] is True
    assert ingest_res.json()["debounceWindowSeconds"] == 180

    # Query provisional forecast
    prov_res = client.get(
        f"/api/v1/forecast/provisional?warehouse_id=WH-GUWAHATI&sku_id={sku}&horizon_days=5",
        headers=headers,
    )
    assert prov_res.status_code == 200
    data = prov_res.json()
    assert data["status"] == "PROVISIONAL"
    assert data["source"] == "RIVER_ONLINE_FALLBACK"  # 1 event < 14 minimum
    assert data["fallbackUsed"] is True
    assert data["trainingObservations"] == 1
