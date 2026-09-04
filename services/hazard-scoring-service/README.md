# Hazard Scoring Service

Standalone heuristic scoring service for determining route/segment hazard levels (landslide, flood) based on environmental inputs.

## Setup & Startup
1. `poetry install`
2. `poetry run uvicorn stockflow_hazard.main:app --reload --port 8000`

## Tests
`poetry run pytest`

## Environment Variables
- `TENANT_ID` (placeholder: `TEN-ACME-PHARMA`)
- `API_KEY` (placeholder: `dummy_key`)

## Contracts Supported
- `RiskScoreV1:1.0`
- `DistrictStatusV1:1.0`

## Scoring Formula (Heuristic)
- **Landslide**: `clamp(0, 1, (0.6 * (rainfall/100) + 0.4 * (slope/90)) * soil_multiplier)`
- **Flood**: `clamp(0, 1, (0.8 * (rainfall/100) + 0.2 * (slope/90)) * soil_multiplier)` (example varied weights)
- **Units**: rainfall in mm/hr, slope in degrees.
- **Confidence**: Fixed prototype value (0.55 for heuristic rules).
- **Validity**: `valid_until` is set to `valid_from + 6 hours` prototype default.

## Prototype Limitations
- **Confidence**: Confidence is currently a fixed placeholder constant (`HEURISTIC_SOURCE_CONFIDENCE = 0.55`), not calculated based on data quality or completeness.

## API Integration
Only accessible by internal orchestrators (e.g., Spring Boot).
Timeout expectation: < 500ms for batch sizes up to 100.
Controlled Errors:
- `413 Payload Too Large`: Batch size exceeds maximum.
- `200 OK` (with `errors` array): Partial item-level failures (both validation errors and internal processing errors are tagged accordingly in the `errors` array).
