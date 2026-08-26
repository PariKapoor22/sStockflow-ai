# StockFlow decision intelligence service

This FastAPI service hosts the open-source decision engines used by StockFlow.
It recommends actions but never executes inventory, purchases, or transfers.

## Engines

- **Stockpyl** — normal-demand newsvendor base-stock and reorder policy.
- **Google OR-Tools** — integer, minimum-cost stock rebalancing subject to source
  safety stock, lane capacity, and destination target constraints.
- **Google OR-Tools Routing** — multi-stop vehicle routing with capacity,
  availability, cold-chain, stock, delivery-window, closure and hazard checks.
- **PyOD ECOD** — unsupervised multivariate anomaly scoring for demand and
  inventory observations.
- **NASA LHASA adapter** — normalizes configured LHASA GeoJSON model output.
- **GloFAS/LISFLOOD adapter** — normalizes configured GloFAS GeoJSON output.

The hazard adapters do not fabricate zones. If no provider dataset URL is
configured, they return an empty list with `configured: false`. Every returned
feature carries its provider, model, validity metadata, and `live` flag.

## Run on Windows

From the repository root:

```cmd
run-optimisation-windows.cmd
```

Optional live model-output feeds:

```cmd
set LHASA_GEOJSON_URL=https://your-data-host/lhasa-outlook.geojson
set GLOFAS_GEOJSON_URL=https://your-data-host/glofas-outlook.geojson
```

Both URLs must return a GeoJSON `FeatureCollection`. The service normalizes
common properties including `severity`, `risk_level`, `probability`,
`confidence`, `observed_at`, `valid_from`, and `valid_until`.

OpenAPI documentation is available at `http://localhost:8102/docs`.

## Vehicle-routing API

`POST /api/v1/routes/optimise` is the route-optimisation boundary used by the
Angular Route Optimization page. It combines the teammate-supplied road graph
and risk rules with OR-Tools fleet assignment and guided-local-search routing.

The request accepts candidate vehicles/routes, stop coordinates and time
windows, an optional road network, and an objective such as shortest, safest,
greenest, fastest, lowest cost, or balanced. The response returns the assigned
vehicle, sequenced stops, distance, duration, arrival time, cost, CO2e,
constraints checked, rejected candidates, solver name and matrix provenance.

Distance sources are selected in this order:

1. a supplied road graph, including closed-road and hazard penalties;
2. Google Routes traffic matrix when `GOOGLE_MAPS_BACKEND_API_KEY` is set;
3. a clearly labelled geodesic prototype fallback.

Runs are persisted to `route-optimisation.db` by default. Override the location
with `STOCKFLOW_ROUTE_DB`. The lifecycle endpoints are:

- `GET /api/v1/routes/runs/{runId}`
- `POST /api/v1/routes/runs/{runId}/routes/{routeId}/status`

Allowed route transitions are controlled: optimized/ready routes may be
approved, approved routes may enter transit, and in-transit routes may be
marked delivered. The status mutation records `X-User-ID` as the actor.

## Start the complete application

From the repository root, run `RUN_ALL_WINDOWS.cmd`. It starts StatsForecast,
this service, Spring Boot and Angular, waits for each health check, and writes
service logs under `.stockflow/logs/`.
