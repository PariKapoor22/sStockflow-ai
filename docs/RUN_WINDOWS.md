# Windows Run Guide — Sprint 1

## Prerequisites

```cmd
node --version
npm --version
java -version
python --version
uv --version
mvn --version
```

The Windows scripts can also detect Maven automatically when it is installed below either of these folders:

```text
%USERPROFILE%\Tools\apache-maven-*\bin\mvn.cmd
C:\Tools\apache-maven-*\bin\mvn.cmd
```

## Recommended first run: backend only

From the repository root:

```cmd
run-core-api-windows.cmd
```

The script runs the backend tests and starts Spring Boot only when they pass.

Verify:

```text
http://localhost:8080/actuator/health
http://localhost:8080/api/v1/dashboard/overview
```

Stop the backend with `Ctrl+C` before using the complete launcher.

## Run the complete platform

From the repository root:

```cmd
RUN_ALL_WINDOWS.cmd
```

The launcher validates the installed tools, starts each service as a hidden child
process, waits for its health check, and keeps everything attached to this one
Command Prompt. It starts:

- Kotlin Core API
- Angular UI
- Forecasting service
- Optimisation service

When all checks pass, open `http://localhost:4200`. Keep the launcher window
open; press `Ctrl+C` once to stop the child processes. Per-service output is
written under `.stockflow\logs\<timestamp>`.

## Manual commands

### Generate and validate sample data

Run from the repository root:

```cmd
python scripts\generate_synthetic_data.py --config data\generator_config.yaml --output data\generated
python scripts\validate_synthetic_data.py --dataset data\generated
```

### Angular

```cmd
cd apps\stockflow-web
npm install
npm start
```

Open `http://localhost:4200`.

### Kotlin API

```cmd
cd services\stockflow-core-api
mvn clean test
mvn spring-boot:run
```

### Forecasting

```cmd
call run-forecasting-windows.cmd
```

Keep this CMD window open before starting the Kotlin API. The service exposes:

- health: `http://127.0.0.1:8101/health`
- API documentation: `http://127.0.0.1:8101/docs`
- governed candidate endpoint: `POST /api/v1/forecast/candidates`

The standard `run-core-api-windows.cmd` launcher enables the StatsForecast
challenger automatically and points Spring Boot at port `8101`. StatsForecast
adds AutoETS, AutoARIMA, Croston Optimized and Seasonal Naive candidates to the
existing Kotlin candidates. Spring Boot still performs the final model
selection and persists the forecast. If the Python process is unavailable, the
forecast run safely continues with the internal models.

### Optimisation

```cmd
call run-optimisation-windows.cmd
```

Keep this window open before starting the Kotlin API. It provides Stockpyl
inventory policies, OR-Tools stock-transfer and multi-stop vehicle routing,
PyOD anomaly scoring, and normalized NASA LHASA plus GloFAS/LISFLOOD
model-output adapters. The local Route Optimization page uses this service on
port `8102`. API docs:
`http://127.0.0.1:8102/docs`.

When `GOOGLE_MAPS_BACKEND_API_KEY` is defined, vehicle routing uses a Google
Routes traffic matrix. Otherwise it uses a labelled geodesic fallback. A
caller may also submit a road graph with closures and hazard scores.

Configure that backend key once from the project root. The prompt hides the
key and writes it to the Git-ignored `.env` file; Windows launchers load it
automatically on future starts:

```cmd
configure-google-maps-windows.cmd
RUN_ALL_WINDOWS.cmd
```

Live hazard model outputs are optional and must be supplied as GeoJSON feeds:

```cmd
set LHASA_GEOJSON_URL=https://your-data-host/lhasa-outlook.geojson
set GLOFAS_GEOJSON_URL=https://your-data-host/glofas-outlook.geojson
run-optimisation-windows.cmd
```

Unconfigured providers return no model zones and are shown as unconfigured;
StockFlow never turns prototype polygons into live hazard predictions.

### MCP data server

```cmd
cd mcp
uv sync
uv run python -m stockflow_mcp.data_server
```

Do not test `/mcp` by opening it as a normal browser page. Use MCP Inspector:

```cmd
npx -y @modelcontextprotocol/inspector
```

The Kotlin module targets Java 17 bytecode so it can run on supported newer JDK runtimes as well.
