from fastapi import FastAPI, HTTPException
from stockflow_hazard.contracts import BatchRiskScoreRequest, BatchRiskScoreResponse, map_to_risk_score_v1
from stockflow_hazard.scorer import score_landslide, score_flood
from stockflow_hazard.validation import validate_timestamps
from stockflow_hazard.errors import ValidationError

app = FastAPI(title="Hazard Scoring Service")

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "hazard-scoring-service",
        "version": "1.0.0",
        "contract_versions": ["RiskScoreV1:1.0"]
    }

@app.get("/contracts")
def get_contracts():
    return {"contracts": ["RiskScoreV1:1.0", "DistrictStatusV1:1.0"]}

@app.post("/v1/risk-scores/batch", response_model=BatchRiskScoreResponse)
def batch_score(request: BatchRiskScoreRequest):
    if len(request.items) > 100:
        raise HTTPException(status_code=413, detail="Batch size exceeds maximum of 100")
        
    responses = []
    errors = []
    
    for idx, item in enumerate(request.items):
        try:
            validate_timestamps(item.valid_from, item.valid_until)
            if item.hazard_type.upper() == "LANDSLIDE":
                res = score_landslide(item.rainfall_mm_hr, item.slope_degrees, item.soil_type)
            elif item.hazard_type.upper() == "FLOOD":
                res = score_flood(item.rainfall_mm_hr, item.slope_degrees, item.soil_type)
            else:
                raise ValidationError("Invalid hazard_type. Must be LANDSLIDE or FLOOD")
                
            mapped = map_to_risk_score_v1(res, item)
            responses.append(mapped)
        except ValidationError as e:
            errors.append({"index": idx, "segment_id": item.segment_id, "error": str(e), "error_type": "validation"})
        except Exception as e:
            # Log the actual exception server-side
            print(f"Unexpected error processing item {idx}: {e}")
            # Option B: Partial success. Keep processing other items.
            errors.append({"index": idx, "segment_id": item.segment_id, "error": "Internal scoring error", "error_type": "internal"})
            
    return BatchRiskScoreResponse(items=responses, errors=errors)
