from stockflow_hazard.validation import validate_inputs
from stockflow_hazard.risk_levels import get_risk_level

SOIL_MULTIPLIERS = {
    "clay": 1.3,
    "sandy": 1.1,
    "loam": 1.0,
    "rocky": 0.8,
    "default": 1.0
}

def _clamp(val: float) -> float:
    return max(0.0, min(val, 1.0))

class ScoreResult:
    def __init__(self, score, level, inputs):
        self.score = score
        self.level = level
        self.inputs = inputs

def score_landslide(rainfall: float, slope: float, soil_type: str) -> ScoreResult:
    validate_inputs(rainfall, slope, soil_type)
    normalized_rain = _clamp(rainfall / 100.0)
    normalized_slope = _clamp(slope / 90.0)
    multiplier = SOIL_MULTIPLIERS.get(soil_type.lower(), 1.0)
    
    score = _clamp((0.6 * normalized_rain + 0.4 * normalized_slope) * multiplier)
    return ScoreResult(round(score, 2), get_risk_level(score), {"rainfall_mm_hr": rainfall, "slope_degrees": slope, "soil_type": soil_type})

def score_flood(rainfall: float, slope: float, soil_type: str) -> ScoreResult:
    validate_inputs(rainfall, slope, soil_type)
    normalized_rain = _clamp(rainfall / 100.0)
    normalized_slope = _clamp(slope / 90.0)
    multiplier = SOIL_MULTIPLIERS.get(soil_type.lower(), 1.0)
    
    score = _clamp((0.8 * normalized_rain + 0.2 * normalized_slope) * multiplier)
    return ScoreResult(round(score, 2), get_risk_level(score), {"rainfall_mm_hr": rainfall, "slope_degrees": slope, "soil_type": soil_type})
