# StockFlow AI — Phase 2 Development Baseline

This repository starts the StockFlow AI product as **one integrated monorepo**. Sprint 1 delivers the Angular dashboard foundation and establishes contracts/scaffolding for the Kotlin core API, Python intelligence services, MCP servers, and synthetic data.


## Phase 2 status

Phase 2 Increment 1 and Increment 2 are now included:

- PostgreSQL datasource configuration
- Flyway schema migrations
- Tenant, warehouse, product, SKU and batch-inventory persistence
- Tenant-scoped foundation APIs
- Controlled synthetic-foundation ZIP import
- Validate-only and UPSERT modes
- Strict import and row-level rejection evidence
- Import job history and SHA-256 package fingerprinting
- Phase 2-ready synthetic foundation package
- H2-backed integration tests
- Windows Phase 2 launchers

Start here:

- `docs/PHASE2_INCREMENT1_DATABASE_FOUNDATION.md`
- `docs/SYNTHETIC_DATA_ASSESSMENT.md`
- `docs/PHASE2_INCREMENT2_CONTROLLED_IMPORT.md`

## Sprint 1 status

Implemented:

- Angular dashboard matching the approved StockFlow AI visual direction
- Responsive sidebar, top bar, KPI cards, risk overview, top risks, charts, recommendations and copilot panel
- Mock-data-first Angular service with automatic fallback from the backend API to local JSON
- Kotlin + Spring Boot core API scaffold with a dashboard contract endpoint
- Python forecasting and optimisation service skeletons
- Three logical MCP server skeletons: Data, Intelligence and Action
- Deterministic synthetic data generator and validator
- Sample multi-vertical synthetic dataset
- OpenAPI contract and Windows run instructions

Deferred to later increments:

- Sales, purchase-order, movement, dispatch and return persistence
- Real forecast model training
- OR-Tools optimisation
- Authentication and tenant isolation enforcement
- Approval persistence and ERP execution
- Production LLM integration

## Repository structure

```text
stockflow-ai-sprint1/
├── apps/stockflow-web/                 Angular UI
├── services/stockflow-core-api/        Kotlin Spring Boot BFF/core scaffold
├── services/forecasting-service/       Python FastAPI skeleton
├── services/optimisation-service/      Python FastAPI skeleton
├── mcp/                                Data, Intelligence and Action MCP servers
├── data/                               Synthetic data configuration and samples
├── contracts/                          OpenAPI contracts
├── docs/                               Architecture and sprint documentation
└── scripts/                            Data generation and validation scripts
```

## Recommended local versions

- Node.js 22.x
- Angular 21.x
- Java 17 or newer (Java 21/25 supported)
- Kotlin 2.4.x
- Spring Boot 4.1.x
- Python 3.11+
- uv

## Start Sprint 1 UI on Windows

```cmd
cd apps\stockflow-web
npm install
npm start
```

Open:

```text
http://localhost:4200
```

The Angular UI first calls `http://localhost:8080/api/v1/dashboard/overview`. If the Kotlin API is unavailable, it automatically loads `src/assets/mock/dashboard-overview.json`.

## Start the Kotlin API

Install Maven, then run either the helper script from the repository root:

```cmd
run-core-api-windows.cmd
```

or run Maven directly:

```cmd
cd services\stockflow-core-api
mvn spring-boot:run
```

API:

```text
http://localhost:8080/api/v1/dashboard/overview
http://localhost:8080/actuator/health
```

## Start Python intelligence services

Forecasting:

```cmd
cd services\forecasting-service
uv sync
uv run uvicorn stockflow_forecasting.main:app --port 8101
```

Optimisation:

```cmd
cd services\optimisation-service
uv sync
uv run uvicorn stockflow_optimisation.main:app --port 8102
```

## Generate synthetic data

From the repository root:

```cmd
python scripts\generate_synthetic_data.py --config data\generator_config.yaml --output data\generated
python scripts\validate_synthetic_data.py --dataset data\generated
```

## Start MCP servers

```cmd
cd mcp
uv sync
uv run python -m stockflow_mcp.data_server
```

Use separate terminals for:

```cmd
uv run python -m stockflow_mcp.intelligence_server
uv run python -m stockflow_mcp.action_server
```

Default endpoints:

```text
Data MCP:         http://127.0.0.1:8201/mcp
Intelligence MCP: http://127.0.0.1:8202/mcp
Action MCP:       http://127.0.0.1:8203/mcp
```

MCP endpoints are protocol endpoints, not normal browser pages. Use MCP Inspector or an MCP client.

## Validate the repository

```cmd
python scripts\validate_project.py
```

## Next implementation

Phase 2 Increment 3 will add sales-history persistence, streaming/batched CSV ingestion, demand aggregation and database-backed dashboard KPIs. See `docs/SPRINT_PLAN.md`.

## Phase 2 Increment 4 — Inventory Intelligence

Increment 4 adds PostgreSQL-backed demand analytics, deterministic inventory-risk rules and a live dashboard overview. See:

- `docs/PHASE2_INCREMENT4_INVENTORY_INTELLIGENCE.md`
- `StockFlow_AI_Phase2_Increment4_Apply_and_Run.md`

Primary endpoints:

```text
/api/v1/analytics/demand/*
/api/v1/risks/*
/api/v1/dashboard/overview
```
