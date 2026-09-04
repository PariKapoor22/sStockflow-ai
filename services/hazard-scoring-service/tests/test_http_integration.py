import pytest
import subprocess
import sys
import time
import httpx
from datetime import datetime, timezone, timedelta

@pytest.fixture(scope="module")
def live_server():
    # Start the actual uvicorn server as a subprocess using the current python executable
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "stockflow_hazard.main:app", "--host", "127.0.0.1", "--port", "8001"],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Wait for the server to start
    for _ in range(30):
        try:
            res = httpx.get("http://127.0.0.1:8001/health")
            if res.status_code == 200:
                break
        except httpx.RequestError:
            time.sleep(0.1)
    else:
        proc.terminate()
        pytest.fail("Server did not start in time")
        
    yield "http://127.0.0.1:8001"
    
    # Teardown
    proc.terminate()
    proc.wait()

def test_batch_score_live(live_server):
    now = datetime.now(timezone.utc)
    valid_from = now.isoformat()
    valid_until = (now + timedelta(hours=6)).isoformat()
    
    payload = {
        "items": [
            {
                "district_id": "d-in-as-kam",
                "segment_id": "seg_as_kam_001",
                "hazard_type": "LANDSLIDE",
                "observed_at": valid_from,
                "valid_from": valid_from,
                "valid_until": valid_until,
                "geometry": {"type": "LineString", "coordinates": [[91.566539, 26.150295], [91.565144, 26.103057]]},
                "rainfall_mm_hr": 20.0,
                "slope_degrees": 15.0,
                "soil_type": "clay"
            },
            {
                "district_id": "d-in-as-kam",
                "segment_id": "seg_as_kam_002",
                "hazard_type": "FLOOD",
                "observed_at": valid_from,
                "valid_from": valid_from,
                "valid_until": valid_until,
                "geometry": {"type": "LineString", "coordinates": [[91.565144, 26.103057], [91.586902, 26.089684]]},
                "rainfall_mm_hr": -20.0, # Invalid to test item-level error
                "slope_degrees": 15.0,
                "soil_type": "clay"
            }
        ]
    }
    
    res = httpx.post(f"{live_server}/v1/risk-scores/batch", json=payload)
    assert res.status_code == 200
    
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["segment_id"] == "seg_as_kam_001"
    assert data["items"][0]["district_id"] == "d-in-as-kam"
    assert data["items"][0]["hazard_type"] == "LANDSLIDE"
    
    assert len(data["errors"]) == 1
    assert data["errors"][0]["segment_id"] == "seg_as_kam_002"
    assert "error" in data["errors"][0]

def test_invalid_geometry_or_timestamp_live(live_server):
    # Test valid_until before valid_from
    payload = {
        "items": [
            {
                "district_id": "d-in-as-kam",
                "segment_id": "seg_as_kam_003",
                "hazard_type": "LANDSLIDE",
                "observed_at": "2026-08-26T10:00:00Z",
                "valid_from": "2026-08-26T12:00:00Z",
                "valid_until": "2026-08-26T10:00:00Z", # Invalid: reversed
                "geometry": {"type": "LineString", "coordinates": [[91.566539, 26.150295], [91.565144, 26.103057]]},
                "rainfall_mm_hr": 20.0,
                "slope_degrees": 15.0,
                "soil_type": "clay"
            }
        ]
    }
    res = httpx.post(f"{live_server}/v1/risk-scores/batch", json=payload)
    data = res.json()
    assert len(data["errors"]) == 1
    assert "valid_until must be later" in data["errors"][0]["error"]
