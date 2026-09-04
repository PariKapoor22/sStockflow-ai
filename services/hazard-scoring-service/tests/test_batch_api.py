from fastapi.testclient import TestClient
from stockflow_hazard.main import app

client = TestClient(app)

def test_batch_score_success():
    payload = {
        "items": [
            {
                "district_id": "d-in-as-kam",
                "segment_id": "seg_as_kam_001",
                "hazard_type": "LANDSLIDE",
                "observed_at": "2026-08-26T00:00:00Z",
                "valid_from": "2026-08-26T00:00:00Z",
                "valid_until": "2026-08-26T06:00:00Z",
                "geometry": {"type": "LineString", "coordinates": [[91.566539, 26.150295], [91.565144, 26.103057]]},
                "rainfall_mm_hr": 20,
                "slope_degrees": 15,
                "soil_type": "clay"
            }
        ]
    }
    response = client.post("/v1/risk-scores/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["district_id"] == "d-in-as-kam"
    assert data["items"][0]["segment_id"] == "seg_as_kam_001"
    assert data["items"][0]["id"] == data["items"][0]["risk_id"]
    assert data["items"][0]["probability"] == data["items"][0]["risk_score"]
    assert data["items"][0]["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert len(data["errors"]) == 0

def test_batch_score_validation_error():
    payload = {
        "items": [
            {
                "district_id": "d-in-as-kam",
                "segment_id": "seg_as_kam_001",
                "hazard_type": "LANDSLIDE",
                "observed_at": "2026-08-26T00:00:00Z",
                "valid_from": "2026-08-26T00:00:00Z",
                "valid_until": "2026-08-26T06:00:00Z",
                "geometry": {"type": "LineString", "coordinates": [[91.566539, 26.150295], [91.565144, 26.103057]]},
                "rainfall_mm_hr": -20,
                "slope_degrees": 15,
                "soil_type": "clay"
            }
        ]
    }
    response = client.post("/v1/risk-scores/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 0
    assert len(data["errors"]) == 1
    assert data["errors"][0]["segment_id"] == "seg_as_kam_001"

from unittest.mock import patch
from stockflow_hazard.scorer import score_landslide

def test_batch_score_unexpected_error_partial_success():
    payload = {
        "items": [
            {
                "district_id": "d-in-as-kam",
                "segment_id": "seg_as_kam_001",
                "hazard_type": "LANDSLIDE",
                "observed_at": "2026-08-26T00:00:00Z",
                "valid_from": "2026-08-26T00:00:00Z",
                "valid_until": "2026-08-26T06:00:00Z",
                "geometry": {"type": "LineString", "coordinates": [[91.566539, 26.150295], [91.565144, 26.103057]]},
                "rainfall_mm_hr": 20,
                "slope_degrees": 15,
                "soil_type": "clay"
            },
            {
                "district_id": "d-in-as-kam",
                "segment_id": "seg_as_kam_bug",
                "hazard_type": "LANDSLIDE",
                "observed_at": "2026-08-26T00:00:00Z",
                "valid_from": "2026-08-26T00:00:00Z",
                "valid_until": "2026-08-26T06:00:00Z",
                "geometry": {"type": "LineString", "coordinates": [[91.566539, 26.150295], [91.565144, 26.103057]]},
                "rainfall_mm_hr": 99.0, # Used to trigger mock
                "slope_degrees": 15,
                "soil_type": "clay"
            },
            {
                "district_id": "d-in-ml-ekh",
                "segment_id": "seg_ml_ekh_001",
                "hazard_type": "LANDSLIDE",
                "observed_at": "2026-08-26T00:00:00Z",
                "valid_from": "2026-08-26T00:00:00Z",
                "valid_until": "2026-08-26T06:00:00Z",
                "geometry": {"type": "LineString", "coordinates": [[91.353256, 25.231966], [91.386862, 25.168724]]},
                "rainfall_mm_hr": 20,
                "slope_degrees": 15,
                "soil_type": "clay"
            }
        ]
    }
    
    def mock_score(rain, slope, soil):
        if rain == 99.0:
            raise Exception("Mocked unexpected error")
        return score_landslide(rain, slope, soil)
        
    with patch("stockflow_hazard.main.score_landslide", side_effect=mock_score):
        response = client.post("/v1/risk-scores/batch", json=payload)
        
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["items"][0]["segment_id"] == "seg_as_kam_001"
    assert data["items"][0]["district_id"] == "d-in-as-kam"
    assert data["items"][1]["segment_id"] == "seg_ml_ekh_001"
    assert data["items"][1]["district_id"] == "d-in-ml-ekh"
    assert len(data["errors"]) == 1
    assert data["errors"][0]["segment_id"] == "seg_as_kam_bug"
    assert data["errors"][0]["error_type"] == "internal"
