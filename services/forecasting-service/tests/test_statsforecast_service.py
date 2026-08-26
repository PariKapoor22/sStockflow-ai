from fastapi.testclient import TestClient

from stockflow_forecasting.main import app


client = TestClient(app)


def test_health_reports_statsforecast() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["engineVersion"]


def test_candidate_endpoint_returns_governed_metrics_and_horizon() -> None:
    history = [90 + (20 if index % 7 in (5, 6) else 0) + index / 10 for index in range(42)]
    response = client.post(
        "/api/v1/forecast/candidates",
        headers={"X-Tenant-ID": "TEN-ACME-PHARMA"},
        json={
            "tenantId": "TEN-ACME-PHARMA",
            "warehouseId": "WH-CHENNAI",
            "skuId": "SKU-PARA-650",
            "modelHistory": history,
            "actualHistory": history,
            "horizonDays": 7,
            "backtestPeriods": 4,
            "minimumTrainingPeriods": 21,
            "seasonLength": 7,
            "demandPattern": "SMOOTH",
            "modelCodes": ["STATS_SEASONAL_NAIVE", "STATS_CROSTON_OPTIMIZED"],
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["engine"] == "StatsForecast"
    assert len(payload["candidates"]) == 2
    assert len(payload["candidates"][0]["forecast"]) == 7
    assert payload["candidates"][0]["backtestPoints"] == 4
    assert payload["candidates"][0]["wape"] >= 0


def test_tenant_header_must_match_body() -> None:
    response = client.post(
        "/api/v1/forecast/candidates",
        headers={"X-Tenant-ID": "TEN-OTHER"},
        json={
            "tenantId": "TEN-ACME-PHARMA",
            "warehouseId": "WH-CHENNAI",
            "skuId": "SKU-PARA-650",
            "modelHistory": [10] * 28,
            "actualHistory": [10] * 28,
            "horizonDays": 7,
            "backtestPeriods": 4,
            "minimumTrainingPeriods": 14,
            "seasonLength": 7,
            "demandPattern": "SMOOTH",
            "modelCodes": ["STATS_SEASONAL_NAIVE"],
        },
    )
    assert response.status_code == 403


def test_all_supported_statsforecast_models_can_be_evaluated_independently() -> None:
    history = [35 + (index % 7) * 2 + index / 20 for index in range(42)]
    supported_models = [
        "STATS_AUTO_ETS",
        "STATS_AUTO_ARIMA",
        "STATS_CROSTON_OPTIMIZED",
        "STATS_SEASONAL_NAIVE",
    ]
    for model_code in supported_models:
        response = client.post(
            "/api/v1/forecast/candidates",
            headers={"X-Tenant-ID": "TEN-ACME-PHARMA"},
            json={
                "tenantId": "TEN-ACME-PHARMA",
                "warehouseId": "WH-CHENNAI",
                "skuId": "SKU-PARA-650",
                "modelHistory": history,
                "actualHistory": history,
                "horizonDays": 7,
                "backtestPeriods": 2,
                "minimumTrainingPeriods": 28,
                "seasonLength": 7,
                "demandPattern": "SMOOTH",
                "modelCodes": [model_code],
            },
        )
        assert response.status_code == 200, f"{model_code}: {response.text}"
        assert response.json()["candidates"][0]["modelCode"] == model_code
