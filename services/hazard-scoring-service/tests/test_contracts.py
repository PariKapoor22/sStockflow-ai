from stockflow_hazard.contracts import RiskScoreInput, map_to_risk_score_v1
from stockflow_hazard.scorer import ScoreResult

def test_map_to_risk_score_v1():
    req = RiskScoreInput(
        district_id="d-in-ml-ekh",
        segment_id="seg_ml_ekh_001",
        hazard_type="LANDSLIDE",
        observed_at="2026-08-26T00:00:00Z",
        valid_from="2026-08-26T00:00:00Z",
        valid_until="2026-08-26T06:00:00Z",
        geometry={"type": "LineString", "coordinates": [[91.353256, 25.231966], [91.386862, 25.168724]]},
        rainfall_mm_hr=50.0,
        slope_degrees=45.0,
        soil_type="loam"
    )
    
    internal_res = ScoreResult(0.82, "HIGH", {"rainfall_mm_hr": 50.0, "slope_degrees": 45.0, "soil_type": "loam"})
    mapped = map_to_risk_score_v1(internal_res, req)
    
    assert mapped.schema_version == "1.0"
    assert mapped.risk_id == "seg_ml_ekh_001:landslide:2026-08-26T00:00:00Z"
    assert mapped.id == "seg_ml_ekh_001:landslide:2026-08-26T00:00:00Z"
    assert mapped.tenant_id == "TEN-ACME-PHARMA"
    assert mapped.district_id == "d-in-ml-ekh"
    assert mapped.segment_id == "seg_ml_ekh_001"
    assert mapped.hazard_type == "LANDSLIDE"
    assert mapped.risk_score == 0.82
    assert mapped.probability == 0.82
    assert mapped.risk_level == "HIGH"
    assert mapped.confidence == 0.55
    assert mapped.source_type == "HEURISTIC"
