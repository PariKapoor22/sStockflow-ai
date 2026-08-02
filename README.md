# StockFlow AI

**AI-assisted inventory intelligence, demand analytics, stock-risk detection, controlled data imports, and action recommendations for wholesalers and distributors.**

StockFlow AI is an ERP-neutral platform that helps inventory teams identify stockout exposure, near-expiry inventory, demand surges, excess stock, and inventory-data gaps using explainable analytics and deterministic business rules.

---

## Live deployment

- **Frontend:** https://stockflow-ai-oveyj.pages.dev
- **Backend API:** https://stockflow-core-api-100044030673.asia-southeast1.run.app
- **Health check:** https://stockflow-core-api-100044030673.asia-southeast1.run.app/actuator/health

> The frontend is hosted on Cloudflare Pages, the Kotlin/Spring Boot API runs on Google Cloud Run, and PostgreSQL is hosted on Neon.

---

## Current release status

### Phase 2 — Inventory Intelligence Platform

| Increment | Scope | Status |
|---|---|---|
| Increment 1 | PostgreSQL foundation and tenant-scoped master data | Complete |
| Increment 2 | Controlled synthetic foundation-data import | Complete |
| Increment 3 | Sales-history import and analytics | Complete |
| Increment 4 | Inventory intelligence, risk engine, and live dashboard | Complete |
| Frontend Increment 1 | Live intelligence workspace and navigation | Complete |
| Frontend Increment 2 | Warehouses, products/SKUs, batch inventory, and data-import workspaces | Complete |
| Frontend UX fixes | Functional topbar, dark-theme readability, hover contrast, and responsive spacing | Complete |
| Production redeployment | Rebuild and redeploy latest frontend to Cloudflare Pages | Verify after each release |
| Phase 3 | Forecasting, optimization, and AI-agent workflows | Planned |

---

## Current capabilities

### Dashboard

- Live PostgreSQL-backed inventory KPIs
- Inventory value
- Operational stock-risk count
- Inventory-data-gap count
- Near-expiry value
- Reserved and blocked inventory value
- Demand-surge detection
- Top operational risks
- Explainable recommendation cards
- Network metrics
- Demand trend visualization
- Inventory value trend
- Dark and light themes

### Inventory intelligence

- Calculates usable inventory from:
  - Available quantity
  - Reserved quantity
  - Blocked quantity
- Calculates inventory value
- Calculates average daily demand
- Calculates days of cover
- Detects low-cover and safety-stock risks
- Detects demand surges
- Detects near-expiry and expired inventory
- Detects excess and slow-moving stock
- Produces explainable replenishment and transfer recommendations

### Correct data-quality classification

The risk engine distinguishes real operational risk from incomplete inventory data.

| Condition | Classification |
|---|---|
| Inventory record exists and usable quantity is zero | `STOCKOUT_RISK` |
| Inventory exists but days of cover is below threshold | `STOCKOUT_RISK` |
| Inventory exists below safety-stock target | `SAFETY_STOCK_BREACH` |
| Demand exists but no inventory snapshot exists | `INVENTORY_DATA_GAP` |

Missing inventory snapshots are not treated as confirmed stockouts.

### Sales and demand analytics

- Tenant-scoped sales-history import
- Ordered, fulfilled, sold, returned, and lost-sales quantities
- Fulfilment-rate calculation
- Top-selling SKUs
- Historical demand trends
- Warehouse- and SKU-level demand summaries
- Stockout-row and lost-sales analysis

### Warehouses workspace

- Warehouse count
- Total configured capacity
- Cold-chain readiness
- Inventory-batch count
- Usable quantity by warehouse
- Inventory value by warehouse
- Warehouse-specific batch inspection

### Products and SKUs workspace

- Product and SKU master details
- Selling price and unit cost
- Margin
- Safety stock
- Reorder multiple
- Demand profile
- Shelf-life configuration
- FEFO support
- Tenant-scoped filtering

### Batch Inventory workspace

- Batch-level inventory positions
- Warehouse filtering
- SKU filtering
- Expiry filtering
- Available quantity
- Reserved quantity
- Blocked quantity
- Usable quantity
- Inventory value
- Snapshot-date visibility

### Controlled Data Imports workspace

- Foundation master-data import
- Retailer and sales-history import
- `VALIDATE_ONLY`
- `UPSERT`
- Strict validation
- Tenant ownership validation
- Import-job history
- File hash recording
- Accepted, rejected, and ignored row counts
- Row-level error inspection
- Idempotent import behavior

---

## Frontend interaction updates

The latest frontend includes functional controls for:

- Notifications
- Help and shortcuts
- Theme switching
- Profile menu
- Demo-session reset
- Global search focus using `Ctrl/⌘ + K`
- Closing popovers using `Escape`
- Closing popovers by clicking outside
- Dark-mode table-hover contrast
- Dark-mode import-form readability
- Visible operational-risk and recommendation icons
- Responsive button spacing
- Readable disabled import actions

> Notification, help, and profile content are currently frontend-managed. Dedicated notification and user-profile backend APIs are planned for a later phase.

---

## Multi-tenant sample data

The platform currently includes three synthetic tenants:

- `TEN-ACME-PHARMA`
- `TEN-FRESH-MART`
- `TEN-URBAN-TRADE`

Every tenant-scoped business API requires:

```http
X-Tenant-ID: TEN-ACME-PHARMA
```

---

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

### Verified Acme Pharma risk classification

| Classification | Count |
|---|---:|
| Operational stock risks | 16 |
| Demand-surge risks | 13 |
| Near-expiry risks | 1 |
| Inventory-data gaps | 117 |
| Total alerts | 147 |

Operational risks:

```text
16 stock risks + 13 demand surges + 1 near-expiry alert = 30 operational alerts
```

Data-quality alerts:

```text
117 inventory-data gaps
```

---

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
| Build | Maven and npm |
| Frontend hosting | Cloudflare Pages |
| Backend hosting | Google Cloud Run |
| Database hosting | Neon PostgreSQL |
| Secret storage | Google Secret Manager |
| Source control | GitHub |

---

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

---

## Local prerequisites

- Java 17
- Maven 3.9+
- Node.js and npm
- PostgreSQL 18
- Python 3
- Git

---

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

---

## Run the backend locally

From the repository root:

```cmd
call run-core-api-phase2-import-windows.cmd
```

Run backend tests:

```cmd
cd services\stockflow-core-api

"C:\Users\oveyj\Tools\apache-maven-3.9.16\bin\mvn.cmd" ^
  -Dkotlin.compiler.daemon=false clean test
```

Current verified result:

```text
Tests run: 10
Failures: 0
Errors: 0
BUILD SUCCESS
```

---

## Run the frontend locally

```cmd
cd apps\stockflow-web
npm install
npm start
```

Open:

```text
http://localhost:4200
```

### Local API proxy

For local development, `proxy.conf.json` can point `/api` to either:

```text
http://localhost:8080
```

or the deployed Cloud Run service:

```text
https://stockflow-core-api-100044030673.asia-southeast1.run.app
```

Example:

```json
{
  "/api": {
    "target": "https://stockflow-core-api-100044030673.asia-southeast1.run.app",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

---

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

---

## Deploy the frontend to Cloudflare Pages

```cmd
cd apps\stockflow-web

npx wrangler pages deploy dist\stockflow-web\browser ^
  --project-name stockflow-ai-oveyj ^
  --branch main ^
  --commit-dirty=true
```

Stable production URL:

```text
https://stockflow-ai-oveyj.pages.dev
```

After deployment, hard-refresh the browser:

```text
Ctrl + Shift + R
```

---

## Deploy the backend to Google Cloud Run

The backend is deployed from:

```text
services/stockflow-core-api
```

Required Google Cloud services:

- Cloud Run
- Cloud Build
- Artifact Registry
- Secret Manager

Runtime identity:

```text
stockflow-runtime@stockflow-ai-oveyj-2026.iam.gserviceaccount.com
```

Secret name:

```text
stockflow-db-password
```

Production environment variables:

```text
SPRING_PROFILES_ACTIVE
STOCKFLOW_DB_URL
STOCKFLOW_DB_USERNAME
STOCKFLOW_DB_PASSWORD
STOCKFLOW_DB_POOL_SIZE
STOCKFLOW_DB_MIN_IDLE
STOCKFLOW_CORS_ALLOWED_ORIGINS
```

---

## API examples

### Health

```cmd
curl ^
  https://stockflow-core-api-100044030673.asia-southeast1.run.app/actuator/health
```

### Dashboard overview

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/dashboard/overview"
```

### Sales summary

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/analytics/sales/summary"
```

### Top-selling SKUs

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/analytics/sales/top-skus?limit=10"
```

### Warehouses

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/warehouses"
```

### SKUs

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/skus"
```

### Batch inventory

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/inventory/batches"
```

### Inventory risks

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/risks/inventory?limit=20"
```

### Import history

```cmd
curl ^
  -H "X-Tenant-ID: TEN-ACME-PHARMA" ^
  "https://stockflow-core-api-100044030673.asia-southeast1.run.app/api/v1/imports"
```

---

## Security and operational controls

- Tenant ID is required for business APIs
- Database password is stored in Google Secret Manager
- Cloud Run uses a dedicated runtime service account
- CORS is explicitly configured
- Flyway controls database schema versions
- Import jobs retain audit information
- Production secrets are not committed to Git
- Controlled imports support validation before upsert
- Missing inventory snapshots are separated from operational risks

---

## Phase 3 roadmap

### Increment 5 — Demand forecasting

- 7-day, 30-day, and 90-day forecasts
- Forecasting by tenant, warehouse, and SKU
- Moving average
- Weighted moving average
- Exponential smoothing
- Seasonal models
- Model-performance tracking
- MAE, RMSE, MAPE, and forecast bias
- Confidence intervals
- Predicted stockout dates

### Increment 6 — Replenishment and transfer optimization

- Recommended purchase quantity
- Reorder date
- Safety-stock target
- Inter-warehouse transfer recommendation
- Source and destination warehouse
- Working-capital impact
- Shortage avoided
- Human approval and rejection workflow

### Increment 7 — Gemini-powered AI agent

- Natural-language explanations
- Dashboard summaries
- Inventory questions and answers
- Supplier-email generation
- Tool calling against StockFlow APIs
- Human approval before execution
- Complete decision and action audit trail

The forecasting and optimization engines remain domain-specific and explainable. Gemini will be used as the conversational and orchestration layer, not as the source of numerical inventory decisions.

---

## Known current limitations

- Demand Forecast currently shows historical and deterministic trend data; predictive model execution is planned for Phase 3.
- Notifications are frontend-managed.
- User profile and preferences are frontend-managed.
- Authentication and authorization are not yet production-grade.
- Recommendations are explainable but are not yet approval-driven executable workflows.
- Purchase orders and warehouse transfers are not yet posted automatically.

---

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

Update and push:

```cmd
git add README.md apps\stockflow-web
git commit -m "docs: update frontend workspaces deployment and phase roadmap"
git push origin main
```

---

## Project objective

StockFlow AI aims to help wholesalers and distributors reduce stockouts, expiry losses, excess inventory, and working-capital blockage through explainable inventory intelligence, predictive forecasting, and human-governed AI actions.
