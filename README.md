# StockFlow AI

> ERP-neutral inventory intelligence, demand forecasting, stock-risk detection, and explainable inventory planning for wholesalers and distributors.

StockFlow AI helps multi-warehouse businesses identify stockout exposure, near-expiry inventory, excess stock, demand surges, and inventory-data gaps. It combines tenant-scoped operational data, deterministic inventory rules, statistical forecasting, model backtesting, and explainable diagnostics.

---

## Live deployment

| Component | URL | Current scope |
|---|---|---|
| Frontend | https://stockflow-ai-oveyj.pages.dev | Supabase-authenticated Angular application |
| Backend API | https://stockflow-core-api-100044030673.asia-southeast1.run.app | Phase 2 cloud baseline |
| Health check | https://stockflow-core-api-100044030673.asia-southeast1.run.app/actuator/health | Cloud API health |

> Phase 3 forecasting increments are verified locally. Deploy the latest backend and frontend builds before treating the cloud URLs as the Phase 3 release.

---

## Current release status

**Current development stage:** Phase 3 — Forecasting  
**Latest completed backend increment:** Increment 5B.1 — Forecast Calibration and Diagnostics  
**Next planned increment:** Increment 5C — Forecast Operations and Governance

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
| Frontend operations UX | Transfers, purchase planning, orders, returns, route and sustainability views | Complete interactive UI |
| Frontend admin UX | Users and roles, settings, sustainability policy, security, and integration health | Complete interactive UI |
| Phase 3 Increment 5A | Forecasting foundation and backtesting | Complete |
| Phase 3 Increment 5B | Forecast-quality engine and additional models | Complete |
| Phase 3 Increment 5B.1 | Calibration, diagnostics, daily/weekly selection | Complete and verified |
| Phase 3 Increment 5C | Forecast scheduling, retries, monitoring, governance | Next |
| Increment 6 | Replenishment and transfer optimization | Planned |
| Increment 7 | Gemini inventory agent and MCP orchestration | Planned |

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

The Angular authentication boundary is deployed. The backend must still validate the Supabase JWT and verify that the authenticated user is authorized for the requested `X-Tenant-ID` before production access control is complete.

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

Every tenant-scoped business API requires:

```http
X-Tenant-ID: TEN-ACME-PHARMA
```

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

The current engine evaluates ten candidate models:

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
| Backend | Kotlin, Spring Boot |
| Database | PostgreSQL |
| Database migrations | Flyway |
| Persistence | Spring Data JPA, JdbcTemplate |
| Build | Maven, npm |
| API contracts | REST, OpenAPI |
| Frontend hosting | Cloudflare Pages |
| Backend hosting | Google Cloud Run |
| Cloud database | Neon PostgreSQL |
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
- PostgreSQL 18
- Python 3
- Git

Verified local ports:

| Service | Port |
|---|---:|
| Angular frontend | 4200 |
| Spring Boot API | 8080 |
| PostgreSQL | 5433 |

---

## Local database configuration

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

## Run Increment 5B.1 locally

From the repository root:

```cmd
cd /d C:\Users\oveyj\Downloads\StockFlow_AI_Phase2_Increment4

run-core-api-phase3-forecast-calibration-windows.cmd
```

Expected startup:

```text
Tomcat started on port 8080
Started StockFlowApplicationKt
```

Health check:

```cmd
curl http://localhost:8080/actuator/health
```

Run the calibration verification:

```cmd
verify-forecast-calibration-api-windows.cmd
```

---

## Run backend tests

```cmd
cd /d C:\Users\oveyj\Downloads\StockFlow_AI_Phase2_Increment4\services\stockflow-core-api

"C:\Users\oveyj\Tools\apache-maven-3.9.16\bin\mvn.cmd" ^
  -Dkotlin.compiler.daemon=false clean test
```

Current expected result:

```text
Tests run: 20
Failures: 0
Errors: 0
BUILD SUCCESS
```

---

## Run the frontend

```cmd
cd /d C:\Users\oveyj\Downloads\StockFlow_AI_Phase2_Increment4\apps\stockflow-web

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
  "http://localhost:8080/api/v1/forecasts/diagnostics/WH-CHENNAI/SKU-PARA-650"
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
- Responsive mobile navigation
- Responsive filters and tables
- Functional notification, help, and profile panels
- Keyboard shortcuts
- Toast messages
- Improved dark-mode contrast
- Responsive operations workspaces with interactive filters and local demo-state actions
- Responsive admin workspaces with role controls, policy settings, and clearly labelled local demo-state actions

Notifications remain frontend-managed. Signed-in user identity and session state come from Supabase Auth.

---

## Current limitations

- The latest Phase 3 backend is not yet deployed to Cloud Run.
- The predictive forecast frontend requires validation against the deployed Phase 3 API.
- Sixty calibrated Acme Pharma positions remain low confidence.
- Forecast operations are not yet scheduled.
- Retry, cancellation, and failure-recovery workflows are not implemented.
- Forecast accuracy degradation alerts are not implemented.
- Operations UI workspaces are implemented; optimization and transactional backend endpoints are not yet connected.
- Users & Roles and Settings are implemented as interactive UI previews; secured admin APIs and settings persistence are not yet connected.
- Purchase orders and stock transfers are not created automatically.
- Frontend authentication is deployed; backend Supabase JWT validation and authenticated tenant authorization are still required.
- Production password-recovery email delivery should use custom SMTP instead of Supabase's testing email service.
- The Gemini agent is not yet implemented.

---

## Next increment — Phase 3 Increment 5C

Increment 5C will operationalize the forecasting engine.

Planned capabilities:

- Tenant-specific schedules
- Daily and weekly forecast execution
- Queued and scheduled runs
- Run lifecycle management
- Failed-position retry
- Full-run retry
- Run cancellation
- Accuracy-performance history
- Confidence movement
- Model-selection history
- Data-freshness alerts
- Forecast-quality degradation alerts
- Governance rules for downstream use

Planned lifecycle:

```text
SCHEDULED
QUEUED
RUNNING
COMPLETED
PARTIALLY_COMPLETED
FAILED
RETRYING
CANCELLED
```

---

## Roadmap

```text
Completed: Phase 2 inventory intelligence
Completed: Increment 5A forecasting foundation
Completed: Increment 5B forecast-quality engine
Completed: Increment 5B.1 calibration and diagnostics

Next:      Increment 5C forecasting operations and governance
Then:      Increment 6 replenishment and transfer optimization
Then:      Increment 7 Gemini inventory agent and MCP integration
```

### Increment 6

Planned:

- Recommended purchase quantity
- Recommended reorder date
- Inter-warehouse transfer recommendations
- Supplier-lead-time support
- Open-purchase-order awareness
- Reorder-multiple enforcement
- Working-capital impact
- Human approval workflow

### Increment 7

Planned:

- Gemini-powered inventory copilot
- Natural-language inventory questions
- Grounded tool calls
- MCP or REST tool adapters
- Forecast and recommendation explanations
- Read-only mode by default
- Human approval before write actions
- Prompt and tool-call audit
- No direct database access from the model

---

## Security and governance principles

- Tenant ID on every business operation
- No secret or `service_role` credentials committed to source control; the browser-safe Supabase publishable key is intentionally public
- Supabase user JWT validation at the backend boundary before trusting authenticated requests
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
#   S t o c k f l o w - a i .  
 #   S t o c k f l o w - a i .  
 