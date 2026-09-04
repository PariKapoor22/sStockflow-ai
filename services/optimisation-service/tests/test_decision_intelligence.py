from fastapi.testclient import TestClient

from stockflow_optimisation.hazards import normalize_feature
from stockflow_optimisation.main import app
from stockflow_optimisation.routing import apply_hazard_alerts


client = TestClient(app)


def test_stockpyl_policy_respects_reorder_multiple():
    response = client.post("/api/v1/inventory/policy", json={
        "tenant_id": "tenant-demo", "warehouse_id": "WH-1", "sku_id": "SKU-1",
        "demand_mean": 50, "demand_sd": 8, "lead_time_days": 2,
        "holding_cost": .18, "stockout_cost": .70,
        "inventory_position": 100, "reorder_multiple": 12,
    })
    assert response.status_code == 200
    result = response.json()
    assert result["model"] == "STOCKPYL_NEWSVENDOR_NORMAL"
    assert result["recommendedOrderQuantity"] % 12 == 0
    assert result["requiresHumanApproval"] is True


def test_ortools_preserves_source_safety_stock_and_fills_nearest_capacity():
    response = client.post("/api/v1/transfers/optimize", json={
        "tenantId": "tenant-demo", "skuId": "SKU-1",
        "positions": [
            {"warehouseId": "A", "availableUnits": 180, "safetyStockUnits": 80,
             "targetStockUnits": 80, "shortagePenaltyPerUnit": 50},
            {"warehouseId": "B", "availableUnits": 10, "safetyStockUnits": 10,
             "targetStockUnits": 90, "shortagePenaltyPerUnit": 50},
        ],
        "lanes": [{"sourceWarehouseId": "A", "destinationWarehouseId": "B",
                   "costPerUnit": 2, "capacityUnits": 60}],
    })
    assert response.status_code == 200
    result = response.json()
    assert result["model"] == "GOOGLE_OR_TOOLS_SCIP"
    assert result["transfers"][0]["quantity"] == 60
    assert result["unmetShortageUnits"] == {"B": 20}


def test_pyod_marks_clear_outlier():
    observations = [
        {"observationId": f"normal-{index}", "features": {"demand": 10 + index * .01, "lostSales": 0}}
        for index in range(10)
    ] + [{"observationId": "outlier", "features": {"demand": 500, "lostSales": 100}}]
    response = client.post("/api/v1/anomalies/score", json={
        "tenantId": "tenant-demo", "contamination": .1, "observations": observations,
    })
    assert response.status_code == 200
    result = response.json()
    outlier = next(item for item in result["observations"] if item["observationId"] == "outlier")
    assert result["model"] == "PYOD_ECOD"
    assert outlier["isAnomaly"] is True


def test_hazard_normalizer_preserves_provenance_and_geojson():
    result = normalize_feature("LHASA", {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [91.89, 25.57]},
        "properties": {"id": "lh-1", "risk_level": "high", "probability": .82},
    }, live=True)
    assert result is not None
    assert result["hazardType"] == "LANDSLIDE"
    assert result["model"] == "NASA_LHASA"
    assert result["live"] is True
    assert result["geometry"]["coordinates"] == [91.89, 25.57]


def test_unconfigured_hazard_sources_return_no_fake_zones(monkeypatch):
    monkeypatch.delenv("LHASA_GEOJSON_URL", raising=False)
    monkeypatch.delenv("GLOFAS_GEOJSON_URL", raising=False)
    response = client.get("/api/v1/hazards/model-outlooks")
    assert response.status_code == 200
    result = response.json()
    assert result["alerts"] == []
    assert all(source["configured"] is False for source in result["sources"])


def test_ortools_vrp_sequences_stops_and_reports_constraints(monkeypatch):
    monkeypatch.delenv("GOOGLE_MAPS_BACKEND_API_KEY", raising=False)
    response = client.post("/api/v1/routes/optimise", headers={"X-Tenant-ID": "tenant-demo"}, json={
        "objective": "Safest route",
        "vehicleType": "All eligible vehicles",
        "routes": [{
            "id": "RTE-TEST", "lane": "Guwahati regional relief delivery",
            "stops": ["Guwahati Central", "Nongpoh Checkpoint", "Jorabat Cross-dock", "Shillong Hub"],
            "vehicle": "12T electric truck", "loadKg": 9000, "capacityKg": 12000,
            "baselineKm": 900, "priority": "Critical", "status": "Draft",
            "departureMinutes": 360, "promisedDeliveryMinutes": 1800,
            "vehicleAvailable": True, "coldChainRequired": True, "coldChainAvailable": True,
            "warehouseStockKg": 10000,
        }],
    })
    assert response.status_code == 200
    result = response.json()
    assert result["solver"] == "GOOGLE_OR_TOOLS_GUIDED_LOCAL_SEARCH"
    assert result["rejected"] == []
    route = result["routes"][0]
    assert route["stops"][0] == "Guwahati Central"
    assert route["stops"][-1] == "Shillong Hub"
    assert sorted(route["stops"]) == sorted(["Guwahati Central", "Nongpoh Checkpoint", "Jorabat Cross-dock", "Shillong Hub"])
    assert route["matrixProvider"] == "GEODESIC_1_18_FALLBACK"
    assert "DELIVERY_TIME_WINDOWS" in route["constraintsChecked"]
    assert route["optimizedKm"] > 0


def test_vrp_rejects_capacity_and_cold_chain_violations(monkeypatch):
    monkeypatch.delenv("GOOGLE_MAPS_BACKEND_API_KEY", raising=False)
    response = client.post("/api/v1/routes/optimise", json={
        "objective": "Balanced cost and carbon",
        "vehicleType": "All eligible vehicles",
        "routes": [
            {"id": "OVER", "lane": "Over capacity", "stops": ["Guwahati Central", "Nongpoh Checkpoint"],
             "vehicle": "diesel truck", "loadKg": 12001, "capacityKg": 12000, "baselineKm": 350,
             "coldChainAvailable": False},
            {"id": "COLD", "lane": "Cold chain", "stops": ["Guwahati Central", "Nongpoh Checkpoint"],
             "vehicle": "diesel truck", "loadKg": 1000, "capacityKg": 12000, "baselineKm": 350,
             "coldChainRequired": True, "coldChainAvailable": False},
        ],
    })
    assert response.status_code == 200
    reasons = {item["id"]: item["reason"] for item in response.json()["rejected"]}
    assert reasons["OVER"] == "Vehicle payload capacity exceeded"
    assert "Cold-chain" in reasons["COLD"]


def test_route_run_is_persisted_and_status_transitions_are_controlled(monkeypatch, tmp_path):
    monkeypatch.delenv("GOOGLE_MAPS_BACKEND_API_KEY", raising=False)
    monkeypatch.setenv("STOCKFLOW_ROUTE_DB", str(tmp_path / "route-tests.db"))
    headers = {"X-Tenant-ID": "tenant-persistence", "X-User-ID": "planner-test"}
    response = client.post("/api/v1/routes/optimise", headers=headers, json={
        "objective": "Shortest path",
        "includeLiveHazards": False,
        "routes": [{
            "id": "RTE-PERSIST", "lane": "Shillong relief corridor",
            "stops": ["Guwahati Hub", "Nongpoh", "Shillong Hub"],
            "vehicle": "12T electric truck", "loadKg": 5000, "capacityKg": 12000,
            "baselineKm": 110, "priority": "Critical", "status": "Draft",
        }],
    })
    assert response.status_code == 200
    run_id = response.json()["runId"]
    assert response.json()["persisted"] is True

    persisted = client.get(f"/api/v1/routes/runs/{run_id}", headers=headers)
    assert persisted.status_code == 200
    assert persisted.json()["routes"][0]["id"] == "RTE-PERSIST"

    approved = client.post(
        f"/api/v1/routes/runs/{run_id}/routes/RTE-PERSIST/status",
        headers=headers, json={"status": "APPROVED"},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "Approved"
    assert approved.json()["statusChangedBy"] == "planner-test"

    invalid = client.post(
        f"/api/v1/routes/runs/{run_id}/routes/RTE-PERSIST/status",
        headers=headers, json={"status": "DELIVERED"},
    )
    assert invalid.status_code == 409


def test_hazard_normalizer_supports_flat_risk_score_v1():
    flat_item = {
        "schema_version": "1.0",
        "risk_id": "seg_as_kam_001:landslide:2026-08-26T06:00:00Z",
        "id": "seg_as_kam_001:landslide:2026-08-26T06:00:00Z",
        "district_id": "d-in-as-kam",
        "segment_id": "seg_as_kam_001",
        "hazard_type": "LANDSLIDE",
        "risk_score": 0.85,
        "probability": 0.85,
        "risk_level": "HIGH",
        "confidence": 0.55,
        "source_type": "HEURISTIC",
        "observed_at": "2026-08-26T05:55:00Z",
        "valid_from": "2026-08-26T06:00:00Z",
        "valid_until": "2026-08-26T12:00:00Z",
        "geometry": {
            "type": "LineString",
            "coordinates": [[91.566539, 26.150295], [91.565144, 26.103057]]
        }
    }
    normalized = normalize_feature("STOCKFLOW_HAZARD", flat_item, live=True)
    assert normalized is not None
    assert normalized["id"] == "seg_as_kam_001:landslide:2026-08-26T06:00:00Z"
    assert normalized["hazardType"] == "LANDSLIDE"
    assert normalized["severity"] == "HIGH"
    assert normalized["probability"] == 0.85
    assert normalized["geometry"]["type"] == "LineString"
    assert normalized["model"] == "STOCKFLOW_HAZARD_SCORER"
    assert normalized["live"] is True
    assert normalized["areaName"] == "d-in-as-kam"


def test_linestring_hazard_applies_risk_penalty_to_route():
    flat_item = {
        "schema_version": "1.0",
        "risk_id": "seg_as_kam_001:landslide:2026-08-26T06:00:00Z",
        "id": "seg_as_kam_001:landslide:2026-08-26T06:00:00Z",
        "district_id": "d-in-as-kam",
        "segment_id": "seg_as_kam_001",
        "hazard_type": "LANDSLIDE",
        "risk_score": 0.85,
        "probability": 0.85,
        "risk_level": "HIGH",
        "geometry": {
            "type": "LineString",
            "coordinates": [[91.566539, 26.150295], [91.565144, 26.103057]]
        }
    }
    normalized = normalize_feature("STOCKFLOW_HAZARD", flat_item, live=True)
    assert normalized is not None

    payload = {
        "routes": [
            {
                "id": "RTE-NER-1",
                "stopDetails": [
                    {
                        "name": "Guwahati Central",
                        "latitude": 26.1445,
                        "longitude": 91.7362,
                        "landslideRisk": 0.0,
                        "floodRisk": 0.0
                    },
                    {
                        "name": "Imphal Hub",
                        "latitude": 24.8170,
                        "longitude": 93.9368,
                        "landslideRisk": 0.0,
                        "floodRisk": 0.0
                    }
                ]
            }
        ]
    }

    sources = apply_hazard_alerts(payload, [normalized])
    assert "STOCKFLOW_HAZARD" in sources

    stops = payload["routes"][0]["stopDetails"]
    guwahati_stop = next(s for s in stops if s["name"] == "Guwahati Central")
    imphal_stop = next(s for s in stops if s["name"] == "Imphal Hub")

    # Guwahati Central is ~17km from the Kamrup segment (within 35km threshold), should have landslideRisk applied
    assert guwahati_stop["landslideRisk"] == 0.85

    # Imphal Hub is over 200km away, should remain 0.0
    assert imphal_stop["landslideRisk"] == 0.0

