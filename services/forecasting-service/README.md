# StockFlow StatsForecast Challenger

This FastAPI service evaluates open-source StatsForecast models alongside StockFlow's in-process Kotlin forecast engine.

## Models

- AutoETS
- AutoARIMA
- CrostonOptimized
- SeasonalNaive

Each candidate is rolling-origin backtested and returns WAPE, MASE, RMSSE, bias, point forecasts and 95% forecast bounds. Spring Boot compares those governed metrics with its local models and persists whichever candidate wins.

## Run on Windows

From the repository root:

```cmd
call run-forecasting-windows.cmd
```

Keep that CMD open on port `8101`, then start the Spring Boot backend in a second CMD. The backend scripts enable the challenger automatically and fall back to the in-process models if this service is unavailable.

## Verify

```cmd
curl http://127.0.0.1:8101/health
```

OpenAPI documentation is available at `http://127.0.0.1:8101/docs`.

## Contract

```http
POST /api/v1/forecast/candidates
X-Tenant-ID: TEN-ACME-PHARMA
Content-Type: application/json
```

The request contains the outlier-treated model history, untouched actual history, forecast horizon, backtest window, seasonal period and demand classification. The response contains independently scored candidates; it never persists data or bypasses Spring Boot tenant controls.

## River Online Challenger (Near-Real-Time Layer)

In addition to batch StatsForecast candidate evaluation, this service provides an additive online forecasting challenger using **River** (`SNARIMAX` and `HoltWinters`) per `REAL_TIME_DEMAND_FORECASTING.md`.

### Architecture & Safeguards
- **Status Labeling**: Online River forecasts are strictly labeled `"status": "PROVISIONAL"`. Governed batch forecasts remain `"status": "VALIDATED"`. Downstream procurement or automated transfers must only consume validated forecasts.
- **Strict Isolation**: State is strictly partitioned by `(tenant_id, warehouse_id, sku_id)` to prevent cross-tenant data leakage.
- **Idempotency**: Event ingestion tracks processed `eventId` values to prevent double-learning.
- **Automatic Fallback**: Positions with fewer than `MINIMUM_ONLINE_TRAINING_OBSERVATIONS` (14 observations) automatically trigger fallback to the latest validated forecast.

### Named Constants (Undocumented Starting Placeholders)
- `DEBOUNCE_WINDOW_SECONDS = 180` (3 minutes): Ingestion buffer window before triggering batch aggregations. Starting placeholder, not an empirical optimum.
- `PROMOTION_WAPE_IMPROVEMENT_THRESHOLD = 0.02` (2.0% WAPE margin): Minimum error reduction required to promote River over StatsForecast in governed evaluations. Starting placeholder, not an empirical optimum.
- `MINIMUM_ONLINE_TRAINING_OBSERVATIONS = 14`: Minimum observations (2 cycles of 7-day seasonality) required before an online model is considered sufficiently trained.

### Known Limitations
> [!WARNING]
> **Local-Disk-Only Checkpoints**: Model checkpoint persistence is currently implemented via local-disk filesystem serialization (`.checkpoints/` pickle files). This is a known prototype limitation and is **not production-durable** across ephemeral container restarts (e.g. Cloud Run instances). A production deployment must back checkpoints with distributed object storage (S3/GCS) or durable cache (Redis).

### Online Endpoints
- `POST /api/v1/forecast/online/events` (Ingests transactional demand events with optional exogenous hazard/weather features)
- `GET /api/v1/forecast/provisional` (Generates provisional forecast with automatic fallback if untrained)
- `GET /api/v1/forecast/online/health` (Inspects active model counts, memory, and checkpoint status)
- `POST /api/v1/forecast/online/evaluate-promotion` (Evaluates River vs StatsForecast candidates under governed WAPE threshold)

