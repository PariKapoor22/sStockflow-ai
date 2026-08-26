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
