# StockFlow AI

**AI-assisted inventory intelligence, demand analytics, stock-risk detection, and action recommendations for wholesalers and distributors.**

StockFlow AI is an ERP-neutral platform designed to help inventory teams identify stockout exposure, near-expiry inventory, excess stock, demand surges, and data-quality gaps using explainable analytics and deterministic business rules.

## Live deployment

- **Web application:** https://stockflow-ai-oveyj.pages.dev
- **Backend API:** https://stockflow-core-api-100044030673.asia-southeast1.run.app
- **Health endpoint:** https://stockflow-core-api-100044030673.asia-southeast1.run.app/actuator/health

## Current release status

**Phase 2 — Inventory Intelligence Platform**

| Increment | Scope | Status |
|---|---|---|
| Increment 1 | PostgreSQL foundation and tenant-scoped master data | Complete |
| Increment 2 | Controlled synthetic foundation-data import | Complete |
| Increment 3 | Sales-history import and sales analytics | Complete |
| Increment 4 | Inventory intelligence, risk engine, and live dashboard | Complete |
| Frontend Increment 1 | Live intelligence workspace and operational navigation | Latest frontend update |
| Phase 3 | Forecasting, optimization, and AI agent workflows | Planned |

## What the current system does

### Inventory intelligence

- Calculates usable inventory from available, reserved, and blocked quantities
- Calculates inventory value and days of cover
- Detects low-cover and safety-stock risks
- Detects near-expiry inventory
- Detects demand surges
- Separates genuine operational risks from missing inventory snapshots
- Produces explainable recommendations for replenishment and stock transfer

### Sales and demand analytics

- Imports tenant-scoped retailer and sales-history data
- Calculates ordered, fulfilled, sold, returned, and lost-sales quantities
- Calculates fulfilment rate
- Identifies top-selling SKUs
- Produces historical demand trends by tenant, warehouse, and SKU

### Multi-tenant design

The platform currently contains three sample tenants:

- `TEN-ACME-PHARMA`
- `TEN-FRESH-MART`
- `TEN-URBAN-TRADE`

Every business API requires the tenant header:

```http
X-Tenant-ID: TEN-ACME-PHARMA
```

## Verified dataset

| Entity | Records |
|---|---:|
| Tenants | 3 |
| Warehouses | 10 |
| Products | 50 |
| SKUs | 100 |
| Inventory batches | 79 |
| Retailers | 50 |
| Sales-history rows | 178,156 |

## Verified Acme Pharma risk classification

| Classification | Count |
|---|---:|
| Operational stock risks | 16 |
| Demand-surge risks | 13 |
| Near-expiry risks | 1 |
| Inventory-data gaps | 117 |
| Total alerts | 147 |

Missing warehouse-SKU inventory snapshots are classified as `INVENTORY_DATA_GAP`, not as confirmed stockouts.

## Architecture

```text
Angular web application
        |
        v
Cloudflare Pages
        |
        v
Kotlin / Spring Boot API
        |
        v
Google Cloud Run
        |
        v
Neon PostgreSQL
```

### Technology stack

| Layer | Technology |
|---|---|
| Frontend | Angular, TypeScript |
| Backend | Kotlin, Spring Boot |
| Database | PostgreSQL |
| Database migrations | Flyway |
| Persistence | Spring Data JPA and JdbcTemplate |
| Build | Maven |
| Cloud frontend | Cloudflare Pages |
| Cloud backend | Google Cloud Run |
| Cloud database | Neon PostgreSQL |
| Secret storage | Google Secret Manager |
| Source control | GitHub |

## Repository structure

```text
stockflow-ai/
├── apps/
│   └── stockflow-web/
├── services/
│   └── stockflow-core-api/
├── data/
│   └── import/
├── scripts/
├── run-core-api-phase2-import-windows.cmd
├── run-web-windows.cmd
└── README.md
```

## Local prerequisites

- Java 17
- Maven 3.9+
- Node.js and npm
- PostgreSQL 18
- Python 3
- Git

## Local database configuration

```text
Host: localhost
Port: 5433
Database: stockflow_phase2
Username: stockflow_app
```

Set the environment variables before starting the backend:

```cmd
set "STOCKFLOW_DB_URL=jdbc:postgresql://localhost:5433/stockflow_phase2"
set "STOCKFLOW_DB_USERNAME=stockflow_app"
set "STOCKFLOW_DB_PASSWORD=stockflow_dev"
```

Do not commit production passwords or connection strings containing passwords.

## Run the backend locally

From the repository root:

```cmd
call run-core-api-phase2-import-windows.cmd
```

Run backend tests:

```cmd
cd services\stockflow-core-api
"C:\Users\oveyj\Tools\apache-maven-3.9.16\bin\mvn.cmd" -Dkotlin.compiler.daemon=false clean test
```

Current verified result:

```text
Tests run: 10
Failures: 0
Errors: 0
BUILD SUCCESS
```

## Run the frontend locally

From the repository root:

```cmd
call run-web-windows.cmd
```

Open:

```text
http://localhost:4200
```

## Build the frontend

```cmd
cd apps\stockflow-web
npm install
npm run build
```

Expected output directory:

```text
apps/stockflow-web/dist/stockflow-web/browser
```

## Deploy the frontend to Cloudflare Pages

```cmd
cd apps\stockflow-web

npx wrangler pages deploy dist\stockflow-web\browser ^
  --project-name stockflow-ai-oveyj ^
  --branch main
```

Stable production URL:

```text
https://stockflow-ai-oveyj.pages.dev
```

## Deploy the backend to Google Cloud Run

The backend is deployed from:

```text
services/stockflow-core-api
```

Deployment requirements:

- Google Cloud billing enabled
- Cloud Run API enabled
- Cloud Build API enabled
- Artifact Registry API enabled
- Secret Manager API enabled
- Neon password stored as `stockflow-db-password`
- Runtime service account: `stockflow-runtime`

The backend uses these environment variables:

```text
SPRING_PROFILES_ACTIVE
STOCKFLOW_DB_URL
STOCKFLOW_DB_USERNAME
STOCKFLOW_DB_PASSWORD
STOCKFLOW_DB_POOL_SIZE
STOCKFLOW_DB_MIN_IDLE
STOCKFLOW_CORS_ALLOWED_ORIGINS
```

## API examples

### Health

```cmd
curl https://stockflow-core-api-100044030673.asia-southeast1.run.app/actuator/health
```

### Dashboard overview

```cmd
curl -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/dashboard/overview"
```

### Sales summary

```cmd
curl -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/analytics/sales/summary"
```

### Top-selling SKUs

```cmd
curl -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/analytics/sales/top-skus?limit=10"
```

### Inventory risks

```cmd
curl -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/risks/inventory?limit=20"
```

## Data import capabilities

The backend supports controlled ZIP-based imports with:

- `VALIDATE_ONLY`
- `UPSERT`
- Strict validation
- Tenant isolation
- Import-job history
- Error tracking
- File-hash recording
- Idempotent data loading

Supported import packages include:

- Synthetic foundation data
- Synthetic retailer and sales-history data

## Security and operational controls

- Tenant ID is required for business APIs
- Database password is stored in Google Secret Manager
- Cloud Run uses a dedicated runtime service account
- CORS is explicitly configured
- Flyway controls database schema versions
- Import jobs retain audit information
- Production secrets must never be committed to Git

## Phase 3 roadmap

### Increment 5 — Demand forecasting

- 7-day, 30-day, and 90-day forecasts
- Forecasting by tenant, warehouse, and SKU
- Moving average, weighted average, exponential smoothing, and seasonal models
- Model-performance tracking using MAE, RMSE, MAPE, and bias
- Predicted stockout dates
- Confidence intervals

### Increment 6 — Replenishment and transfer optimization

- Recommended order quantity
- Reorder date
- Safety-stock target
- Inter-warehouse transfer recommendations
- Working-capital impact
- Shortage avoided
- Human approval and rejection workflow

### Increment 7 — Gemini-powered AI agent

- Natural-language explanation of forecasts and recommendations
- Dashboard summaries
- Inventory Q&A
- Supplier-email generation
- Tool calling against StockFlow APIs
- Human approval before execution
- Complete decision and action audit trail

The forecasting and optimization engines will remain domain-specific and explainable. Gemini will be used as the conversational and orchestration layer, not as the source of numerical inventory decisions.

## Git workflow

Before committing:

```cmd
git status --short
git diff --stat
```

Generated folders should remain ignored:

```text
node_modules/
dist/
.angular/
target/
```

Update and push the README:

```cmd
copy /Y StockFlow_AI_README_UPDATED.md README.md
git add README.md
git commit -m "docs: update project status architecture and deployment guide"
git push origin main
```

## License

Add the selected project license before commercial or public distribution.

## Project objective

StockFlow AI aims to help wholesalers and distributors reduce stockouts, expiry losses, excess inventory, and working-capital blockage through explainable inventory intelligence, predictive forecasting, and human-governed AI actions.
