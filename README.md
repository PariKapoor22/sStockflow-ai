# StockFlow AI

> ERP-neutral inventory intelligence, demand forecasting, stock-risk detection, and explainable inventory planning for wholesalers and distributors.

StockFlow AI helps multi-warehouse businesses identify stockout exposure, near-expiry inventory, excess stock, demand surges, and inventory-data gaps. It combines tenant-scoped operational data, deterministic inventory rules, statistical forecasting, model backtesting, and explainable diagnostics.

---

## Live deployment

| Component | URL | Current scope |
|---|---|---|
| Frontend | https://stockflow-ai-oveyj.pages.dev | Supabase-authenticated Angular application |
| Backend API | https://stockflow-core-api-100044030673.asia-southeast1.run.app | Inventory, risk, forecasting and warehouse-scoped dashboard API |
| Route and carbon API | https://stockflow-carbon-100044030673.asia-southeast1.run.app | Explainable route, capacity, cost and prototype CO2e calculations |
| Health check | https://stockflow-core-api-100044030673.asia-southeast1.run.app/actuator/health | Cloud API health |

> Phase 3 forecasting and the local OR-Tools vehicle-routing integration are verified. The deployed Carbon API remains the production-facing legacy route service until the decision-intelligence service is deployed.

---

## Current release status

**Current development stage:** Prototype release hardening
**Latest completed backend increment:** Increment 7 — Grounded Copilot and MCP orchestration
**Next planned increment:** Production road-network and fleet integrations

| Phase / increment | Scope | Status |
|---|---|---|
| Phase 1 | Product shell, initial services, synthetic-data foundation | Complete |
| Phase 2 Increment 1 | PostgreSQL foundation and tenant-scoped master data | Complete |
| Phase 2 Increment 2 | Controlled foundation-data import | Complete |
| Phase 2 Increment 3 | Sales-history import and demand analytics | Complete |
| Phase 2 Increment 4 | Inventory intelligence and risk engine | Complete |
| Frontend Increment 1 | Live intelligence dashboard and navigation | Complete |
| Frontend Increment 2 | Warehouses, products/SKUs, batches, and imports | Complete |
| Frontend Increment 3 | Predictive-demand forecasting workspace | Complete locally |
| Frontend authentication | Supabase login, signup, session recovery, sign-out, and password recovery | Complete and deployed |
| Frontend navigation | Icon-led collapsible `INTELLIGENCE`, `OPERATIONS`, `INVENTORY`, and `ADMIN` groups with responsive compact mode | Complete locally |
| Frontend operations UX | Transfers, purchase planning, orders, returns, route and sustainability views | Complete interactive UI |
| Frontend admin UX | Users and roles, settings, sustainability policy, security, and integration health | Complete interactive UI |
| Phase 3 Increment 5A | Forecasting foundation and backtesting | Complete |
| Phase 3 Increment 5B | Forecast-quality engine and additional models | Complete |
| Phase 3 Increment 5B.1 | Calibration, diagnostics, daily/weekly selection | Complete and verified |
| Phase 3 Increment 5C | Forecast scheduling, retries, monitoring, governance | Complete |
| Increment 6 | Replenishment, purchase execution and transfer decision optimization | Complete |
| Increment 7 | Grounded inventory agent and MCP orchestration | Complete |
| Fleetbase Phases 1–5 | Vehicle discovery, native fleet UI, tenant mapping, durable transfer linkage and gated undispatched order creation | Complete locally |

---

## What the platform does

### Inventory intelligence

- Calculates available, reserved, blocked, and usable inventory
- Calculates inventory value and days of cover
- Detects stockout and safety-stock risk
- Detects demand surges
- Detects near-expiry and expired batches
- Detects excess and slow-moving inventory
- Separates operational inventory risk from data-quality gaps
- Produces explainable risk and recommendation outputs

### Demand analytics

- Imports tenant-scoped sales history
- Tracks ordered, fulfilled, sold, returned, and lost-sales quantities
- Calculates fulfilment rates
- Produces warehouse- and SKU-level demand summaries
- Provides demand trends and top-selling SKU analysis

### Forecasting

- Runs focused or tenant-wide forecasts
- Supports 7-, 30-, and 90-day horizons
- Performs rolling backtesting
- Compares multiple statistical models
- Selects daily or weekly aggregation by warehouse-SKU position
- Classifies demand using ADI and CV²
- Identifies smooth, erratic, intermittent, and lumpy demand
- Calculates confidence, prediction bounds, and projected stockout dates
- Stores model performance and diagnostic reason codes

### Data imports

- Supports `VALIDATE_ONLY` and `UPSERT`
- Enforces tenant ownership
- Stores import-job history
- Stores accepted, rejected, and ignored row counts
- Records file hashes
- Provides row-level error evidence
- Supports idempotent imports

### Authentication

- Uses Supabase Auth for email/password login and account creation
- Restores browser sessions and refreshes access tokens automatically
- Protects the Angular dashboard behind an authenticated session
- Supports password-reset emails and secure password recovery
- Displays the authenticated user's profile metadata and provides sign-out
- Adds the Supabase user access token to backend API requests as `Authorization: Bearer <token>`

In secured deployments, the Core API validates Supabase JWTs, verifies active membership before accepting `X-Tenant-ID`, and permission-gates mutating operations. The Copilot host separately validates Supabase JWTs, derives tenant scope from trusted token claims or an explicitly configured server-side default, and forwards the bearer token to Core API-backed MCP tools. The Core API exposes `/api/v1/security/me` plus administrator membership-management APIs; first-user administrator bootstrap remains opt-in.

### Multi-tenancy and role-based access control

- Tenant-owned operational records carry a `tenant_id`, and Core API queries scope records to the authenticated tenant.
- `X-Tenant-ID` selects a tenant context; it is not authorization by itself. With production security enabled, the Core API accepts it only after validating the Supabase JWT and an active database-backed tenant membership.
- Built-in roles include Administrator, Inventory Manager, Warehouse Manager, Purchase Manager, Logistics Manager, Sustainability Analyst, Approver, and Viewer.
- Permissions cover inventory and risk reads, forecast execution, imports, transfer and purchase proposals, independent approval, routing, sustainability, execution, order management, and user administration.
- Optional warehouse assignments narrow operational access within a tenant, while security audit events record membership changes and denied permission checks.
- Local development is intentionally permissive. Any externally reachable Core API deployment must set `STOCKFLOW_SECURITY_ENABLED=true` and configure the Supabase JWT issuer.

---

## Important risk-classification rule

Missing inventory data is not treated as a confirmed stockout.

| Condition | Classification |
|---|---|
| Inventory exists and usable quantity is zero | `STOCKOUT_RISK` |
| Inventory exists but cover is below threshold | `STOCKOUT_RISK` |
| Inventory is below the configured safety stock | `SAFETY_STOCK_BREACH` |
| Demand exists but no inventory snapshot exists | `INVENTORY_DATA_GAP` |

---

## Verified synthetic dataset

| Entity | Records |
|---|---:|
| Tenants | 3 |
| Warehouses | 10 |
| Products | 50 |
| SKUs | 100 |
| Inventory batches | 79 |
| Retailers | 50 |
| Sales-history rows | 178,156 |

Configured tenants:

```text
TEN-ACME-PHARMA
TEN-FRESH-MART
TEN-URBAN-TRADE
```

Tenant-scoped services use the following header to carry tenant context:

```http
X-Tenant-ID: TEN-ACME-PHARMA
```

The header alone is not proof of access. A secured Core API request must also carry a valid JWT whose subject has an active membership in that tenant. The authenticated Copilot endpoint derives its tenant scope from verified JWT metadata or an explicitly configured server-side default.

---

## Verified Phase 2 risk results

Acme Pharma validation:

| Classification | Count |
|---|---:|
| Operational stock risks | 16 |
| Demand-surge risks | 13 |
| Near-expiry risks | 1 |
| Inventory-data gaps | 117 |
| Total alerts | 147 |

```text
30 operational alerts
117 data-quality alerts
```

---

## Phase 3 forecasting models

The core engine evaluates ten built-in candidate models:

1. Naive
2. Moving Average
3. Weighted Moving Average
4. Seasonal Naive
5. Simple Exponential Smoothing
6. Holt Linear Trend
7. Holt-Winters Additive
8. Croston Classic
9. Croston SBA
10. TSB

When `STATSFORECAST_ENABLED=true`, the Python forecasting service also supplies
four open-source StatsForecast challengers:

11. AutoETS
12. AutoARIMA
13. Croston Optimized
14. Seasonal Naive (StatsForecast)

Spring Boot sends tenant-scoped demand history to the Python service over HTTP,
compares all successful candidates using the same governed backtest metrics,
selects the winner, and remains responsible for persistence and API responses.
If the Python service is down or rejects a series, the run falls back to the ten
built-in models instead of failing the whole forecast job. Selected external
models appear in the website as `Stats Auto Ets`, `Stats Auto Arima`,
`Stats Croston Optimized`, or `Stats Seasonal Naive`.

The decision-intelligence service on port `8102` adds these open-source engines:

- Stockpyl normal-demand newsvendor inventory policies
- Google OR-Tools integer stock-transfer optimisation
- Google OR-Tools multi-vehicle, multi-stop route optimisation
- PyOD ECOD anomaly scoring
- normalized NASA LHASA landslide model outputs
- normalized Copernicus GloFAS/LISFLOOD flood model outputs

Run it with `run-optimisation-windows.cmd`, or start the full application with
`RUN_ALL_WINDOWS.cmd`. Spring Boot exposes configured model
hazards to the website, where they are merged with official alerts on the GIS
map. Unconfigured model feeds return no zones instead of synthetic live data.

The Route Optimization page calls the same service directly in local
development. It supports fleet assignment, stop sequencing, payload,
availability, cold-chain, warehouse-stock, time-window, closure and hazard
constraints. It uses a supplied road graph first, Google Routes traffic data
when the backend key is configured, and an explicitly labelled geodesic
fallback otherwise. Every run is persisted and route status transitions are
audited before their resulting delivery impact is applied in the UI.

Forecast-quality metrics:

- MAE
- RMSE
- MAPE
- WAPE
- sMAPE
- MASE
- RMSSE
- Bias
- Composite selection score

---

## Increment 5B.1 calibration capabilities

Increment 5B.1 added:

- Average Demand Interval
- Coefficient of Variation Squared
- Daily-versus-weekly forecast comparison
- Croston Classic
- TSB
- MASE and RMSSE
- Forecast eligibility status
- Position-level diagnostic reason codes
- Calibration summaries
- Tenant-wide confidence distribution
- Flyway migration `V012`

Example diagnostic reason codes:

```text
INTERMITTENT_DEMAND
LUMPY_DEMAND
HIGH_ZERO_DEMAND_RATIO
HIGH_DEMAND_VARIABILITY
OUTLIER_HEAVY_HISTORY
NO_MEANINGFUL_SEASONALITY
LOW_BACKTEST_ACCURACY
WEEKLY_AGGREGATION_SELECTED
DAILY_AGGREGATION_SELECTED
```

---

## Verified tenant-wide calibration result

Validation scope:

```text
Tenant: TEN-ACME-PHARMA
As-of date: 2026-06-30
Forecast horizon: 7 days
History window: 180 days
```

Execution:

| Result | Value |
|---|---:|
| Positions requested | 148 |
| Positions processed | 148 |
| Positions failed | 0 |
| Daily forecast values generated | 1,036 |
| Eligible positions | 148 |
| Ineligible positions | 0 |
| Daily aggregation selected | 39 |
| Weekly aggregation selected | 109 |
| Projected stockouts | 7 |
| Total forecast quantity | 47,797.16 |

Calibration quality:

| Metric | Before calibration | After calibration |
|---|---:|---:|
| Average WAPE | 105.60% | **48.67%** |
| WAPE improvement | — | **56.93 percentage points** |
| Average MASE | — | **0.58** |
| Average RMSSE | — | **0.58** |
| High-confidence positions | 0 | **28** |
| Medium-confidence positions | 0 | **60** |
| Low-confidence positions | 148 | **60** |

Aggregation usage:

| Aggregation | Positions |
|---|---:|
| Weekly | 109 |
| Daily | 39 |

Selected-model usage:

| Model | Positions |
|---|---:|
| Croston SBA | 50 |
| Croston Classic | 21 |
| Naive | 17 |
| Seasonal Naive | 17 |
| Holt-Winters Additive | 13 |
| Moving Average | 9 |
| TSB | 9 |
| Holt Linear Trend | 9 |
| Weighted Moving Average | 2 |
| Simple Exponential Smoothing | 1 |

Demand-pattern usage:

| Pattern | Positions |
|---|---:|
| Intermittent | 147 |
| Lumpy | 1 |

### Governance interpretation

- High-confidence forecasts can support operational planning.
- Medium-confidence forecasts require planner review.
- Low-confidence forecasts remain advisory.
- Forecasts must not automatically create purchase orders or transfers.
- Downstream optimization must revalidate inventory, open orders, lead times, and approval policy.

---

## Architecture

```text
ERP / distributor systems / CSV imports
                  |
                  v
        Kotlin Spring Boot API
                  |
        +---------+----------+
        |                    |
        v                    v
 PostgreSQL data       Forecasting engine
        |                    |
        +---------+----------+
                  |
                  v
       Risk and diagnostic APIs
                  |
                  v
          Angular application
                  |
                  v
        Supabase authentication
                  |
                  v
     Planner review and approval
                  |
                  v
 Future optimization and Gemini agent
```

Deployment topology:

```text
Angular frontend  -> Cloudflare Pages
Kotlin API        -> Google Cloud Run
PostgreSQL        -> Neon
Authentication    -> Supabase Auth
Secrets           -> Google Secret Manager
Source control    -> GitHub
```

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | Angular, TypeScript |
| Authentication | Supabase Auth and `@supabase/supabase-js` |
| Core backend | Kotlin, Spring Boot |
| Route and carbon backend | Python, FastAPI, Pydantic, geopy |
| Database | PostgreSQL |
| Database migrations | Flyway |
| Persistence | Spring Data JPA, JdbcTemplate |
| Build | Maven, npm |
| API contracts | REST, OpenAPI |
| Frontend hosting | Cloudflare Pages |
| Backend hosting | Google Cloud Run |
| Cloud database | Supabase PostgreSQL |
| Secret storage | Google Secret Manager |
| Source control | GitHub |
| Future AI layer | Gemini on Google Cloud |
| Future AI integration | MCP tools backed by StockFlow APIs |

---

## Repository structure

```text
stockflow-ai/
├── apps/
│   └── stockflow-web/
├── services/
│   ├── stockflow-core-api/
│   ├── forecasting-service/
│   └── optimisation-service/
├── mcp/
├── contracts/
├── data/
├── docs/
├── scripts/
├── run-core-api-phase3-forecast-calibration-windows.cmd
├── verify-forecast-calibration-api-windows.cmd
└── README.md
```

Some future folders may still be placeholders until their increments are implemented.

---

## Local prerequisites

- Java 17
- Maven 3.9+
- Node.js and npm
- Python 3
- [`uv`](https://docs.astral.sh/uv/) for the Python services
- Git
- PostgreSQL 18 only when running the persistent `phase2` profile; the default local launcher uses an in-memory H2 database

Verified local ports:

| Service | Port |
|---|---:|
| Angular frontend | 4200 |
| Spring Boot API | 8080 |
| StatsForecast service | 8101 |
| Decision intelligence service | 8102 |
| Data MCP server | 8201 |
| Intelligence MCP server | 8202 |
| StockFlow Copilot | 8300 |
| Route and carbon service | 8400 |
| PostgreSQL | 5433 |

---

## Run the complete application locally

The recommended Windows launcher starts StatsForecast, decision intelligence/OR-Tools, route and carbon calculation, the Spring Boot Core API, both read-only MCP servers, the StockFlow Copilot, and the Angular website from one Command Prompt. It keeps their output in timestamped log files and stops the processes it started when you press `Ctrl+C`.

From the repository root:

```cmd
cd /d "C:\Users\oveyj\Documents\New project\stockflow-repair"
RUN_ALL_WINDOWS.cmd
```

Keep that Command Prompt open. When all readiness checks pass, open:

```text
http://localhost:4200
```

The first run can take several minutes while Maven, npm, and `uv` resolve dependencies. The launcher reuses a service if its expected port is already occupied. Runtime logs are written under:

```text
.stockflow\logs\<timestamp>\
```

To check prerequisites and launcher files without starting the services:

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\run-all-windows.ps1 -CheckOnly
```

The single-window launcher skips the Core API test suite during startup. Run the tests separately before committing or deploying changes.

### Optional local environment file

The launcher scripts load `.env` from the repository root when it exists. Create it from the safe example, then replace only the values needed on your machine:

```cmd
copy .env.example .env
notepad .env
```

Do not commit `.env`. Google Maps, Fleetbase, and other external integrations remain disabled or use a clearly identified fallback until their server-side credentials are configured.

### Local database configuration

The default `sprint1` profile uses an in-memory H2 database populated with demo data, so PostgreSQL is not required for the one-command prototype run. Data is recreated when the Core API restarts.

To use persistent PostgreSQL data, add `SPRING_PROFILES_ACTIVE=phase2` to `.env` and configure:

Example local environment:

```text
Host: localhost
Port: 5433
Database: stockflow_phase2
Username: stockflow_app
```

Set credentials through environment variables:

```cmd
set "STOCKFLOW_DB_URL=jdbc:postgresql://localhost:5433/stockflow_phase2"
set "STOCKFLOW_DB_USERNAME=stockflow_app"
set "STOCKFLOW_DB_PASSWORD=<your-local-password>"
```

Never commit production passwords or database URLs containing embedded credentials.

---

## Run services individually

Use this only when debugging a particular service. Open a separate Command Prompt for each command and run them from the repository root:

```cmd
cd /d "C:\Users\oveyj\Documents\New project\stockflow-repair"
run-forecasting-windows.cmd
run-optimisation-windows.cmd
run-core-api-windows.cmd
run-web-windows.cmd
```

Expected Core API startup:

```text
Tomcat started on port 8080
Started StockFlowApplicationKt
```

Health check:

```cmd
curl http://localhost:8080/actuator/health
```

Optional calibration verification:

```cmd
verify-forecast-calibration-api-windows.cmd
```

---

## Run backend tests

```cmd
cd /d "C:\Users\oveyj\Documents\New project\stockflow-repair"
call configure-maven-windows.cmd
cd services\stockflow-core-api
mvn -Dkotlin.compiler.daemon=false clean test
```

Expected result:

```text
BUILD SUCCESS
```

---

## Run the frontend

```cmd
cd /d "C:\Users\oveyj\Documents\New project\stockflow-repair\apps\stockflow-web"

npm install
npm start
```

Before starting the frontend, configure the browser-safe Supabase values in:

```text
apps/stockflow-web/src/assets/config/runtime-config.js
```

```javascript
window.__stockflowConfig = {
  supabaseUrl: 'https://your-project-ref.supabase.co',
  supabasePublishableKey: 'sb_publishable_your_key'
};
```

Use only a publishable key or legacy `anon` key in the browser. Never use a Supabase secret or `service_role` key. See [`apps/stockflow-web/SUPABASE_AUTH_SETUP.md`](apps/stockflow-web/SUPABASE_AUTH_SETUP.md) for redirect URL, email-provider, local testing, and deployment configuration.

Open:

```text
http://localhost:4200
```

Build:

```cmd
npm run build
```

---

## Main APIs

### Health

```http
GET /actuator/health
```

### Foundation and master data

```http
GET /api/v1/foundation/summary
GET /api/v1/warehouses
GET /api/v1/warehouses/{warehouseId}
GET /api/v1/skus
GET /api/v1/inventory/batches
```

### Imports

```http
GET  /api/v1/imports
GET  /api/v1/imports/{id}
GET  /api/v1/imports/{id}/errors
POST /api/v1/imports/synthetic-foundation
POST /api/v1/imports/synthetic-sales
```

### Demand analytics

```http
GET /api/v1/analytics/demand/summary
GET /api/v1/analytics/demand/skus
GET /api/v1/analytics/demand/trend
```

### Inventory risks

```http
GET /api/v1/risks/summary
GET /api/v1/risks/inventory
```

### Forecasting

```http
POST /api/v1/forecasts/runs
GET  /api/v1/forecasts/runs
GET  /api/v1/forecasts/latest
GET  /api/v1/forecasts/summary
GET  /api/v1/forecasts/model-performance
GET  /api/v1/forecasts/configuration
PUT  /api/v1/forecasts/configuration
GET  /api/v1/forecasts/accuracy-summary
GET  /api/v1/forecasts/diagnostics
GET  /api/v1/forecasts/diagnostics/{warehouseId}/{skuId}
GET  /api/v1/forecasts/calibration-summary
```

---

## API examples

Create a tenant-wide seven-day forecast:

```cmd
curl -i -X POST ^
  -H "Content-Type: application/json" ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  -d "{\"horizonDays\":7,\"historyDays\":180}" ^
  "http://localhost:8080/api/v1/forecasts/runs"
```

Read the calibration summary:

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "http://localhost:8080/api/v1/forecasts/calibration-summary"
```

Read the accuracy summary:

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "http://localhost:8080/api/v1/forecasts/accuracy-summary"
```

Read a position diagnostic:

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "http://localhost:8080/api/v1/forecasts/diagnostics/WH-GUWAHATI/SKU-PARA-650"
```

---

## Frontend workspaces

- Dashboard
- Inventory Intelligence
- Warehouses
- Products and SKUs
- Batch Inventory
- Data Imports
- Predictive Demand Forecast
- Forecast model comparison
- Forecast run history
- Forecast confidence and projected stockouts
- Smart Transfers with route optimization and sustainability impact
- Purchase Planning with spend phasing and supplier health
- Orders with fulfilment pipeline and allocation status
- Returns with disposition, quality signals and value recovery
- Users & Roles with access scopes, permission profiles, MFA visibility, and member filters
- Settings for organization defaults, planning policy, route objectives, sustainability targets, alerts, security, and integration health

Frontend UX includes:

- Dark and light themes
- Icon-led collapsible navigation groups for Intelligence, Operations, Inventory, and Admin, with active-group highlighting and automatic expansion when a workspace is selected
- Compact sidebar mode that displays the group symbols while preserving expandable navigation on larger layouts
- Responsive mobile navigation
- Responsive filters and tables
- Functional notification, help, and profile panels
- Keyboard shortcuts
- Toast messages
- Improved dark-mode contrast
- Responsive operations workspaces with interactive filters and local demo-state actions
- Responsive admin workspaces with role controls, policy settings, and clearly labelled local demo-state actions
- StockFlow Copilot remains available through its floating launcher and popover; only the redundant dashboard-header AI button has been removed

Notifications remain frontend-managed. Signed-in user identity and session state come from Supabase Auth.

---

## Current limitations

- The latest Phase 3 backend is not yet deployed to Cloud Run.
- The predictive forecast frontend requires validation against the deployed Phase 3 API.
- Sixty calibrated Acme Pharma positions remain low confidence.
- Forecast operations are not yet scheduled.
- Retry, cancellation, and failure-recovery workflows are not implemented.
- Forecast accuracy degradation alerts are not implemented.
- OR-Tools vehicle routing is complete locally. Live traffic requires `GOOGLE_MAPS_BACKEND_API_KEY`; without it the response and UI disclose the geodesic fallback. Production-scale dispatch still needs real fleet availability, orders, road closures and telemetry feeds.
- LHASA and GloFAS/LISFLOOD require externally prepared GeoJSON model-output feeds. The adapters are integrated, but a live source is not bundled with the repository.
- The tenant picker is a static prototype list, while Users & Roles and Settings remain frontend previews. The UI does not yet discover the signed-in user's memberships, restrict tenant choices through `/api/v1/security/me`, or call the implemented membership-management APIs.
- Supabase signup creates an authenticated identity but does not automatically grant tenant membership; an administrator must provision it unless the normally disabled first-user bootstrap is explicitly enabled.
- Transfer and purchase proposals can be persisted and independently approved, but approval does not execute inventory movement, dispatch a vehicle or place a supplier order.
- Supabase JWT validation and tenant RBAC are implemented for the Core API and Copilot, but the Core API configuration defaults to permissive local mode unless `STOCKFLOW_SECURITY_ENABLED=true` is supplied by the deployment. Protected local workflows receive a synthetic `LOCAL_ADMIN` context.
- RBAC currently concentrates on mutating workflows and membership administration. Most general read endpoints require active tenant membership when security is enabled but do not yet enforce their domain-specific read permission codes, and warehouse scopes are not universal across every read API.
- The Carbon and optimisation APIs currently trust tenant/user headers and must remain private behind the Core API until JWT or authenticated service-to-service enforcement is added.
- Tenant isolation is primarily enforced in application queries. PostgreSQL Row-Level Security remains a defence-in-depth production-hardening item.
- Production password-recovery email delivery should use custom SMTP instead of Supabase's testing email service.
- The MCP Copilot is deployed. Gemini fallback requires `GEMINI_API_KEY` to be configured on the Cloud Run Copilot service.

### Human-gated Action API

Phase 2 adds a tenant-scoped proposal workflow under `/api/v1/actions`:

- `POST /transfers` and `POST /purchases` create `DRAFT` proposals and require an `Idempotency-Key` header.
- `POST /proposals/{id}/submit` moves a draft to `PENDING_APPROVAL`.
- `POST /proposals/{id}/approve` and `/reject` require the `PROPOSAL_APPROVE` permission.
- The proposer cannot approve or reject their own proposal.
- Duplicate open proposals, cross-tenant records and out-of-scope warehouses are rejected.
- Every lifecycle transition is appended to proposal history.
- Action MCP tools wrap these APIs but never execute a transfer or purchase.
- Transfers and Purchase Planning include an API-backed proposal queue, draft form, submission/review controls and status-history dialog. Recommendation data remains representative until the recommendation engine is connected end to end.

Lifecycle: `DRAFT -> PENDING_APPROVAL -> APPROVED | REJECTED`, with cancellation allowed before review.

### Transfer execution workflow

Approved transfer proposals can now be converted into one idempotent execution:

- `PLANNED`: execution ledger created from the approved proposal.
- `RESERVED`: usable source inventory is reserved across FEFO batches.
- `IN_TRANSIT`: only the execution's reserved quantities are deducted from source stock.
- `RECEIVED`: the same batches are posted once to destination inventory, with actual cost and CO2e evidence.
- `CANCELLED`: planned executions are closed; reserved executions release their reservations. Dispatched stock cannot be cancelled.

The workflow requires `TRANSFER_EXECUTE`, respects tenant/warehouse scope, prevents duplicate execution per proposal and records every state transition. The Transfers UI exposes allocation, dispatch, receipt and execution-audit controls.

---

## Phase 3 Increment 5C — forecast operations and governance

Increment 5C operationalizes the calibrated forecasting engine with durable, tenant-scoped jobs.

Implemented capabilities:

- Tenant-specific schedules
- Daily and weekly forecast execution
- Queued and scheduled runs
- Run lifecycle management
- Full-job retry with attempt lineage
- Queued-job cancellation
- Existing accuracy, confidence, calibration and model-selection diagnostics
- Data-freshness alerts
- Forecast-quality degradation alerts
- Acknowledgement workflow for governance alerts
- Role-gated manual queue processing and schedule administration
- Demand Forecast UI for jobs, schedules, retries and alerts

Planned lifecycle:

```text
QUEUED
RUNNING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

---

## Roadmap

```text
Completed: Phase 2 inventory intelligence
Completed: Increment 5A forecasting foundation
Completed: Increment 5B forecast-quality engine
Completed: Increment 5B.1 calibration and diagnostics
Completed: Increment 5C forecasting operations and governance

Completed: Increment 6 replenishment, purchase execution and transfer decisions
Completed: Increment 7 grounded Copilot and MCP integration
Future:    Production road-network, telematics and verified fleet-emission integrations
```

### Increment 6

Implemented replenishment slice:

- Live warehouse/SKU purchase recommendations
- Latest forecast with 30-day-sales fallback
- Supplier lead-time and preferred-supplier support
- Safety-stock and target-cover calculations
- Open purchase-proposal deduction
- Reorder-multiple rounding
- Explainable need date, confidence and quantity evidence
- Direct handoff into the human approval workflow

Purchase-order execution completed:

- Approved purchase proposals convert into controlled purchase orders
- Supplier dispatch and acknowledgement lifecycle
- Partial and complete goods receipts with batch and expiry details
- Idempotent receipt posting into the latest inventory snapshot
- Tenant, warehouse and role enforcement for every execution action
- Complete purchase-order audit history
- Open purchase-order quantities feed back into replenishment planning

Remaining:

- Production deployment and load testing of the completed local road-network and multi-stop OR-Tools service

Fleetbase integration status: all eight phases are complete locally, including tenant-bound reads, vehicle UI, durable transfer-order linkage, guarded creation, FEFO-gated dispatch, tracker/ETA visibility, signed idempotent webhooks, reconciliation, recovery and production-readiness reporting.

Transfer decision intelligence completed:

- Live destination shortages and eligible source surpluses
- Source safety-stock protection after transfer
- Warehouse-coordinate distance estimation
- Vehicle-capacity trip calculation
- Transfer cost versus supplier purchase comparison
- Estimated savings and working capital moved
- Explainable carbon estimate with disclosed assumptions
- Direct handoff to the existing human approval workflow

### Increment 7

Implemented:

- Gemini-powered inventory copilot
- Natural-language inventory questions
- Grounded tool calls
- MCP or REST tool adapters
- Forecast and recommendation explanations
- Read-only mode by default
- Human approval before write actions
- Prompt and tool-call audit
- No direct database access from the model
- Deterministic domain intent routing with product and warehouse alias resolution
- Live transfer recommendation grounding for route and vehicle comparisons
- Completed-transfer sustainability totals from the execution ledger
- Secret-disclosure and self-approval policy guards
- Regression coverage for inventory aggregation, product resolution, live routing and execution impact

---

## Security and governance principles

- Tenant ID on every business operation
- No secret or `service_role` credentials committed to source control; the browser-safe Supabase publishable key is intentionally public
- Supabase user JWT validation at the backend boundary before trusting authenticated requests
- Active database-backed tenant membership and role permissions
- Tenant membership verification before accepting a caller-selected `X-Tenant-ID`
- Optional warehouse-level access scopes for operational actions
- First-user administrator bootstrap disabled unless explicitly configured
- Human approval for high-value actions
- Read-only AI tools by default
- Complete forecast and recommendation audit
- Backend validation before execution
- No direct LLM access to PostgreSQL
- No autonomous financial or inventory posting
- Deterministic services remain the source of numerical truth

---

## Git workflow

Review changes:

```cmd
git status --short
```

Stage:

```cmd
git add README.md
```

Create a signed commit:

```cmd
git commit -S -m "docs: update README for forecast calibration increment"
```

Push:

```cmd
git push origin main
```

---

## Repository

```text
https://github.com/Web4everyone32/stockflow-ai.git
```

---

## Creator and provenance

**StockFlow AI is designed and engineered by Veyjval B.**

Repository releases and important commits are cryptographically signed using a dedicated StockFlow AI signing key. Verification information and the public signing key are available in [OWNERSHIP.md](OWNERSHIP.md).

Copyright © 2026 Veyjval B. All rights reserved.

---

## License

Add the intended open-source or commercial license before public distribution.
