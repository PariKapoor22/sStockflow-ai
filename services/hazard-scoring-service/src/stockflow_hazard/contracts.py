from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class RiskScoreInput(BaseModel):
    tenant_id: str = "TEN-ACME-PHARMA"
    district_id: str
    segment_id: str
    hazard_type: str
    observed_at: str
    valid_from: str
    valid_until: str
    geometry: Dict[str, Any]
    rainfall_mm_hr: float
    slope_degrees: float
    soil_type: str

class RiskScoreV1(BaseModel):
    schema_version: str = "1.0"
    risk_id: str
    id: Optional[str] = None
    tenant_id: str
    district_id: str
    segment_id: str
    hazard_type: str
    risk_score: float
    probability: Optional[float] = None
    risk_level: str
    confidence: float
    source_type: str
    observed_at: str
    valid_from: str
    valid_until: str
    geometry: Dict[str, Any]
    inputs: Dict[str, Any]
    evidence: List[Dict[str, str]]
    model: Dict[str, str]

class BatchRiskScoreRequest(BaseModel):
    items: List[RiskScoreInput]

class BatchRiskScoreResponse(BaseModel):
    items: List[RiskScoreV1]
    errors: List[Dict[str, Any]] = []

# Fixed prototype value for heuristic rules, as no defensible formula is agreed yet.
HEURISTIC_SOURCE_CONFIDENCE = 0.55

def map_to_risk_score_v1(internal_result, req_input: RiskScoreInput) -> RiskScoreV1:
    risk_id = f"{req_input.segment_id}:{req_input.hazard_type.lower()}:{req_input.valid_from}"
    return RiskScoreV1(
        risk_id=risk_id,
        id=risk_id,
        tenant_id=req_input.tenant_id,
        district_id=req_input.district_id,
        segment_id=req_input.segment_id,
        hazard_type=req_input.hazard_type.upper(),
        risk_score=internal_result.score,
        probability=internal_result.score,
        risk_level=internal_result.level,
        confidence=HEURISTIC_SOURCE_CONFIDENCE,
        source_type="HEURISTIC",
        observed_at=req_input.observed_at,
        valid_from=req_input.valid_from,
        valid_until=req_input.valid_until,
        geometry=req_input.geometry,
        inputs=internal_result.inputs,
        evidence=[{"type": "DATASET", "label": "Prototype NER terrain scenario", "reference": "mock://ner-terrain-v1"}],
        model={"name": "ner-rule-scorer", "version": "1.0.0", "method": "HEURISTIC_WEIGHTED_SCORE"}
    )

