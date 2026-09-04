import pytest
from stockflow_hazard.scorer import score_landslide, score_flood
from stockflow_hazard.errors import ValidationError

def test_score_landslide_normal():
    res = score_landslide(50.0, 45.0, "loam")
    assert res.score == 0.5
    assert res.level == "MEDIUM"

def test_score_flood_normal():
    # Flood weight: 0.8 rain, 0.2 slope
    res = score_flood(50.0, 45.0, "loam")
    # (0.8 * 0.5) + (0.2 * 0.5) = 0.4 + 0.1 = 0.5
    assert res.score == 0.5
    assert res.level == "MEDIUM"

def test_score_landslide_boundary():
    res = score_landslide(100.0, 90.0, "clay")
    assert res.score == 1.0 # clamped
    assert res.level == "HIGH"
    
    res2 = score_landslide(0.0, 0.0, "sandy")
    assert res2.score == 0.0
    assert res2.level == "LOW"

def test_score_flood_boundary():
    res = score_flood(200.0, 90.0, "clay")
    assert res.score == 1.0 # clamped
    assert res.level == "HIGH"

def test_risk_level_thresholds():
    # score < 0.34 is LOW, <= 0.66 is MEDIUM, > 0.66 is HIGH
    # Test around 0.34
    res = score_landslide(33.0, 0.0, "loam") # 0.6 * 0.33 = 0.198 -> LOW
    assert res.level == "LOW"
    
    # We construct inputs to get exactly around 0.33, 0.34, 0.66, 0.67
    # For score = 0.33 (LOW) -> rain = 55.0, slope = 0
    res = score_landslide(55.0, 0.0, "loam")
    assert res.score == 0.33
    assert res.level == "LOW"
    
    # For score = 0.34 (MEDIUM) -> rain = 56.67, slope = 0 -> 0.6 * 0.5667 = 0.34
    res = score_landslide(56.67, 0.0, "loam")
    assert res.score == 0.34
    assert res.level == "MEDIUM"

    # For score = 0.66 (MEDIUM) -> rain = 100 (0.6), slope = 13.5 (0.4 * 13.5/90 = 0.06) -> 0.66
    res = score_landslide(100.0, 13.5, "loam")
    assert res.score == 0.66
    assert res.level == "MEDIUM"

    # For score = 0.67 (HIGH) -> rain = 100 (0.6), slope = 15.75 (0.4 * 15.75/90 = 0.07) -> 0.67
    res = score_landslide(100.0, 15.75, "loam")
    assert res.score == 0.67
    assert res.level == "HIGH"

def test_score_missing_inputs():
    with pytest.raises(ValidationError):
        score_landslide(None, 45, "clay")
    with pytest.raises(ValidationError):
        score_landslide(50, None, "clay")
    with pytest.raises(ValidationError):
        score_landslide(50, 45, None)
    with pytest.raises(ValidationError):
        score_landslide(None, None, None)

def test_score_validation_failures():
    # Negative inputs
    with pytest.raises(ValidationError):
        score_landslide(-10, 45, "clay")
    with pytest.raises(ValidationError):
        score_landslide(50, -10, "clay")
        
    # Invalid ranges
    with pytest.raises(ValidationError):
        score_landslide(50, 100, "clay") # slope > 90
        
    # Invalid soil
    with pytest.raises(ValidationError):
        score_landslide(50, 45, "invalid_soil")
        
    # NaN and Infinity
    with pytest.raises(ValidationError):
        score_landslide(float('nan'), 45, "clay")
    with pytest.raises(ValidationError):
        score_landslide(50, float('inf'), "clay")

def test_determinism():
    res1 = score_flood(30, 20, "rocky")
    res2 = score_flood(30, 20, "rocky")
    assert res1.score == res2.score
    assert res1.level == res2.level
    
    res3 = score_landslide(12.5, 45.8, "clay")
    res4 = score_landslide(12.5, 45.8, "clay")
    assert res3.score == res4.score
    assert res3.level == res4.level
