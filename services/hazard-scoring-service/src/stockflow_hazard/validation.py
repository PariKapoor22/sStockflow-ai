from datetime import datetime
from stockflow_hazard.errors import ValidationError
import math

ALLOWED_SOILS = {"clay", "sandy", "loam", "rocky", "default"}

def validate_inputs(rainfall: float, slope: float, soil_type: str):
    if rainfall is None or slope is None or soil_type is None:
        raise ValidationError("Missing required inputs")
    if math.isnan(rainfall) or math.isinf(rainfall) or rainfall < 0:
        raise ValidationError("Invalid rainfall value")
    if math.isnan(slope) or math.isinf(slope) or slope < 0 or slope > 90:
        raise ValidationError("Invalid slope value")
    if soil_type.lower() not in ALLOWED_SOILS:
        raise ValidationError(f"Invalid soil type. Allowed: {ALLOWED_SOILS}")

def validate_timestamps(valid_from: str, valid_until: str):
    try:
        dt_from = datetime.fromisoformat(valid_from.replace('Z', '+00:00'))
        dt_until = datetime.fromisoformat(valid_until.replace('Z', '+00:00'))
        if dt_until <= dt_from:
            raise ValidationError("valid_until must be later than valid_from")
    except ValueError:
        raise ValidationError("Invalid timestamp format, must be ISO 8601")
