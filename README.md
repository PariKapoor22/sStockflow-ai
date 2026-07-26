StockFlow AI — Sprint 1 Foundation (Fixed v2)

StockFlow AI is an ERP-neutral inventory intelligence, demand forecasting and stock optimisation platform for wholesalers and distributors. It is designed to identify stockout risk, near-expiry inventory, excess stock and working-capital blockage, then generate explainable recommendations for procurement, stock transfer and inventory action.

This repository contains the Sprint 1 Fixed v2 foundation: a working Angular dashboard, a Kotlin/Spring Boot core API, deterministic Python forecasting and optimisation services, three logical MCP servers, synthetic data generation and Windows launch scripts.

Release status: Sprint 1 foundation / prototypePackage label: Fixed v2Recommended Git tag: v0.1.0-sprint1

What Sprint 1 delivers

Web dashboard

Responsive Angular dashboard

Sidebar navigation and product shell

Inventory KPI cards

Inventory-risk breakdown

Top-risk list

Demand forecast chart

Inventory value trend

AI recommendation cards

Network summary

Sprint 1 copilot interaction panel

Automatic fallback to bundled mock JSON when the core API is unavailable

Kotlin core API

Kotlin + Spring Boot application

Dashboard overview REST endpoint

Spring Boot Actuator health endpoint

CORS configuration for the Angular development server

Classpath-backed JSON fixture for Sprint 1

Backend integration test using MockMvc

Python intelligence services

FastAPI forecasting service

Deterministic weekly seasonal baseline

Confidence range for predicted demand

FastAPI optimisation service

Source safety-stock protection

Destination-shortage constraint

Transfer value, transport cost and expected benefit calculation

MCP layer

Data MCP: read-only access to the dashboard inventory summary

Intelligence MCP: forecast and transfer recommendation tools

Action MCP: controlled transfer-proposal creation

Streamable HTTP transport

Action tools disabled by default

Human approval preserved as a non-negotiable boundary

Synthetic data

Multi-tenant wholesaler/distributor data

Pharmaceutical, supermarket and merchandise verticals

Warehouses, retailers and SKUs

Batch inventory and expiry dates

Sales history

Open purchase orders

Warehouse transfer routes

Deterministic generator configuration

Validation report

Fixed v2 corrections

Fixed v2 addresses the following Sprint 1 backend and Windows execution issues:

Removed the Spring Boot 4/Jackson 2 ObjectMapper incompatibility.

Returns the dashboard fixture as an explicit application/json response.

Removed the obsolete direct Jackson 2 Kotlin-module dependency.

Added Maven discovery from PATH, %USERPROFILE%\Tools and C:\Tools.

Targets Java 17 bytecode for compatibility with supported Java 17, 21 and 25 runtimes.

Added backend test execution before the Windows launcher starts the API.

Added individual Windows launchers so each service starts from its correct directory.

See FIX_NOTES.md for the package-level fix summary.

Architecture

flowchart LR
    USER[Inventory Manager] --> WEB[Angular Dashboard\n:4200]
    WEB --> CORE[Kotlin Spring Boot Core API\n:8080]
    WEB -. fallback .-> MOCK[Local Dashboard JSON]

    MCPD[Data MCP\n:8201] --> CORE
    MCPI[Intelligence MCP\n:8202] --> FC[Forecasting Service\n:8101]
    MCPI --> OP[Optimisation Service\n:8102]
    MCPA[Action MCP\n:8203] --> PROPOSAL[Draft Proposal Only]

    DATA[Synthetic CSV Data] --> DEMO[Prototype Demonstration]

Sprint 1 runtime relationship

Angular UI
   ├── Core API available  → use /api/v1/dashboard/overview
   └── Core API unavailable → use local mock dashboard JSON

Data MCP          → Kotlin Core API
Intelligence MCP  → Forecasting and Optimisation services
Action MCP        → Controlled draft proposal only

MCP is the AI-facing capability layer. It does not replace REST APIs, ERP integration, transaction processing or approval workflows.

Technology stack

Layer

Technology

Web UI

Angular 21, TypeScript 5.9, RxJS

Core API

Kotlin 2.4.10, Spring Boot 4.1.0

Core API runtime target

Java 17 bytecode

Forecasting API

Python 3.11+, FastAPI, Pydantic

Optimisation API

Python 3.11+, FastAPI, Pydantic

MCP implementation

Python MCP SDK, FastMCP, HTTPX

API contract

OpenAPI 3.1

Build tools

npm, Maven, uv

Sprint 1 data

UTF-8 CSV and JSON fixtures

PostgreSQL, Redis, production ML models, OR-Tools, authentication and persistent approval workflows are planned for later sprints.

Repository structure

stockflow-ai-sprint1/
├── apps/
│   └── stockflow-web/                     Angular dashboard
├── services/
│   ├── stockflow-core-api/                Kotlin Spring Boot API
│   ├── forecasting-service/               Python FastAPI forecast service
│   └── optimisation-service/              Python FastAPI optimisation service
├── mcp/
│   └── stockflow_mcp/                     Data, Intelligence and Action MCP
├── contracts/
│   └── dashboard-api.openapi.yaml         Sprint 1 API contract
├── data/
│   ├── sample/                            Small reusable sample dataset
│   ├── generated/                         Locally generated dataset
│   ├── generator_config.yaml
│   └── sample_config.yaml
├── docs/
│   ├── BACKEND_AND_MCP_ARCHITECTURE.md
│   ├── RUN_WINDOWS.md
│   ├── SPRINT_PLAN.md
│   └── SYNTHETIC_DATA_SPECIFICATION.md
├── scripts/
│   ├── generate_synthetic_data.py
│   ├── validate_synthetic_data.py
│   └── validate_project.py
├── RUN_ALL_WINDOWS.cmd
├── run-web-windows.cmd
├── run-core-api-windows.cmd
├── run-forecasting-windows.cmd
├── run-optimisation-windows.cmd
├── run-mcp-data-windows.cmd
├── run-mcp-intelligence-windows.cmd
├── run-mcp-action-windows.cmd
├── configure-maven-windows.cmd
├── FIX_NOTES.md
└── README.md

Prerequisites

Install and verify the following tools:

Tool

Recommended version

Node.js

22.x

npm

10.x or compatible

Java

17 or newer

Maven

3.9.x

Python

3.11 or newer

uv

Current installed version

PyYAML

Required by the synthetic-data generator

Verify from Command Prompt:

node --version
npm --version
java -version
mvn --version
python --version
uv --version

Install PyYAML when it is not already available:

python -m pip install pyyaml

Maven discovery on Windows

The supplied scripts detect Maven in any of these locations:

mvn available on PATH
%USERPROFILE%\Tools\apache-maven-*\bin\mvn.cmd
C:\Tools\apache-maven-*\bin\mvn.cmd

If mvn is not on PATH, extract Maven under one of the supported Tools folders.

Quick start on Windows

Option 1 — Run only the dashboard

This is the quickest way to verify the UI. The dashboard will use the local fixture when the Kotlin API is not running.

From the repository root:

run-web-windows.cmd

Open:

http://localhost:4200

The first run automatically performs npm install when node_modules does not exist.

Option 2 — Run the complete Sprint 1 platform

First verify that Node.js, npm, Java, Maven, Python, uv and PyYAML are available. Then run from the repository root:

RUN_ALL_WINDOWS.cmd

The launcher:

Validates the required tools.

Detects Maven.

Generates synthetic data.

Validates the generated data.

Opens each component in a separate Command Prompt window.

Starts Angular after the backend/service terminals have opened.

Wait for each terminal to report that its service is running.

Recommended first run sequence

For easier troubleshooting, start the platform one component at a time:

1. Angular dashboard
2. Kotlin core API
3. Forecasting service
4. Optimisation service
5. Data MCP
6. Intelligence MCP
7. Action MCP

Use a separate Command Prompt window for every long-running service.

Run components individually

All helper commands below must be run from the repository root.

Angular dashboard

run-web-windows.cmd

Manual equivalent:

cd apps\stockflow-web
npm install
npm start

Application:

http://localhost:4200

The Angular service first requests:

/api/v1/dashboard/overview

When the backend is unavailable, it falls back to:

src/assets/mock/dashboard-overview.json

Kotlin core API

run-core-api-windows.cmd

The launcher performs:

mvn clean test
mvn spring-boot:run

Manual equivalent:

cd services\stockflow-core-api
mvn clean test
mvn spring-boot:run

Endpoints:

http://localhost:8080/actuator/health
http://localhost:8080/api/v1/dashboard/overview

Expected health response:

{
  "status": "UP"
}

Forecasting service

run-forecasting-windows.cmd

Manual equivalent:

cd services\forecasting-service
uv sync
uv run uvicorn stockflow_forecasting.main:app --host 127.0.0.1 --port 8101

Endpoints:

http://localhost:8101/health
http://localhost:8101/docs

Example request:

{
  "tenant_id": "TEN-ACME-PHARMA",
  "warehouse_id": "WH-BENGALURU",
  "sku_id": "SKU-PARA-650",
  "horizon_days": 30
}

The Sprint 1 service uses a deterministic weekly seasonal baseline and returns predicted demand with lower and upper bounds.

Optimisation service

run-optimisation-windows.cmd

Manual equivalent:

cd services\optimisation-service
uv sync
uv run uvicorn stockflow_optimisation.main:app --host 127.0.0.1 --port 8102

Endpoints:

http://localhost:8102/health
http://localhost:8102/docs

Example request:

{
  "tenant_id": "TEN-ACME-PHARMA",
  "sku_id": "SKU-PARA-650",
  "source_warehouse_id": "WH-CHENNAI",
  "destination_warehouse_id": "WH-BENGALURU",
  "source_available": 2450,
  "source_safety_stock": 500,
  "destination_shortage": 900,
  "transport_cost": 32000,
  "unit_value": 272.22
}

The service protects source safety stock, limits the transfer to the destination shortage and returns a transfer only when the estimated net benefit is positive.

MCP servers

Start MCP only after its downstream services are running.

Data MCP

run-mcp-data-windows.cmd

http://127.0.0.1:8201/mcp

Exposed capability:

get_inventory_summary
stockflow://dashboard/overview

Dependency:

Kotlin Core API → http://127.0.0.1:8080

Intelligence MCP

run-mcp-intelligence-windows.cmd

http://127.0.0.1:8202/mcp

Exposed capabilities:

forecast_demand
recommend_stock_transfer

Dependencies:

Forecasting API  → http://127.0.0.1:8101
Optimisation API → http://127.0.0.1:8102

Action MCP

run-mcp-action-windows.cmd

http://127.0.0.1:8203/mcp

The action server is disabled by default:

STOCKFLOW_ENABLE_ACTIONS=false

To enable draft proposal creation for a controlled local demonstration:

set STOCKFLOW_ENABLE_ACTIONS=true
run-mcp-action-windows.cmd

This creates a draft proposal only. It does not execute inventory movement or create an ERP transaction.

Test with MCP Inspector

MCP endpoints are protocol endpoints, not normal browser pages.

npx -y @modelcontextprotocol/inspector

Connect using Streamable HTTP and select one endpoint at a time.

Component endpoints

Component

Port

Endpoint

Angular dashboard

4200

http://localhost:4200

Kotlin core API

8080

http://localhost:8080/api/v1/dashboard/overview

Core API health

8080

http://localhost:8080/actuator/health

Forecasting health

8101

http://localhost:8101/health

Forecasting Swagger

8101

http://localhost:8101/docs

Optimisation health

8102

http://localhost:8102/health

Optimisation Swagger

8102

http://localhost:8102/docs

Data MCP

8201

http://127.0.0.1:8201/mcp

Intelligence MCP

8202

http://127.0.0.1:8202/mcp

Action MCP

8203

http://127.0.0.1:8203/mcp

Synthetic data

Generate the full dataset

Run from the repository root:

python scripts\generate_synthetic_data.py --config data\generator_config.yaml --output data\generated

Validate the generated dataset

python scripts\validate_synthetic_data.py --dataset data\generated

Validate the repository structure

python scripts\validate_project.py

The generator uses a fixed seed so repeated runs are deterministic for the same configuration.

Dataset model

The Sprint 1 generator supports:

3 tenants/business units

10 warehouses

50 retailers

100 SKUs

Pharmaceutical, supermarket and merchandise categories

Historical sales

Multiple batches and expiry dates

Open purchase orders

Warehouse transfer routes

Judge-facing Paracetamol stock-rebalancing scenario

Generated files are written under data/generated/. Large generated outputs are intentionally excluded by .gitignore; the smaller data/sample/ dataset remains version-controlled.

Testing and validation

Angular

cd apps\stockflow-web
npm run build

The current Sprint 1 package does not include a complete Angular unit-test specification, so npm test is not the primary validation command yet.

Kotlin API

cd services\stockflow-core-api
mvn clean test

The integration test verifies that:

/api/v1/dashboard/overview returns HTTP 200

riskTotal is present

Five KPI records are returned

Python syntax

From the repository root:

python -m compileall services mcp scripts

API testing

Use the generated Swagger pages:

Forecasting:  http://localhost:8101/docs
Optimisation: http://localhost:8102/docs

Environment variables

The supplied .env.example documents the local defaults:

STOCKFLOW_CORE_API_URL=http://127.0.0.1:8080
STOCKFLOW_FORECAST_API_URL=http://127.0.0.1:8101
STOCKFLOW_OPTIMISATION_API_URL=http://127.0.0.1:8102
STOCKFLOW_ENABLE_ACTIONS=false

Do not commit a real .env file containing secrets. .env is excluded through .gitignore.

Troubleshooting

npm error Missing script: "start"

Cause: npm start was executed from the repository root.

Use:

run-web-windows.cmd

or:

cd apps\stockflow-web
npm start

ModuleNotFoundError: No module named 'stockflow_forecasting'

Cause: Uvicorn was executed from the repository root or outside the service environment.

Use:

run-forecasting-windows.cmd

or:

cd services\forecasting-service
uv sync
uv run uvicorn stockflow_forecasting.main:app --port 8101

ModuleNotFoundError: No module named 'stockflow_optimisation'

Use:

run-optimisation-windows.cmd

or run uv sync and Uvicorn from services\optimisation-service.

'mvn' is not recognized

Install/extract Maven into one of the supported directories:

%USERPROFILE%\Tools\apache-maven-3.9.x
C:\Tools\apache-maven-3.9.x

Then run:

configure-maven-windows.cmd
run-core-api-windows.cmd

Angular deprecation or npm audit warnings

Dependency deprecation and audit messages do not necessarily prevent the development server from running. Review npm audit output before changing dependencies.

Do not automatically run:

npm audit fix --force

on the Sprint 1 baseline, because forced updates can introduce breaking Angular changes. Apply dependency upgrades through a separate branch and validate the build.

Terminate batch job (Y/N)?

When stopping Angular:

Press Ctrl+C.

Type Y only while the Terminate batch job (Y/N)? prompt is visible.

Press Enter.

When the normal command prompt has already returned, typing Y is treated as a command and produces 'y' is not recognized.

Port already in use

Find the process using a port:

netstat -ano | findstr :4200
netstat -ano | findstr :8080
netstat -ano | findstr :8101
netstat -ano | findstr :8102

Stop the relevant process only after confirming its PID:

taskkill /PID <PID> /F

Sprint boundaries

Implemented in Sprint 1 Fixed v2

Dashboard shell and visual analytics

Mock-first frontend data flow

Dashboard REST contract

Kotlin fixture-backed API

Deterministic forecast scaffold

Deterministic transfer recommendation scaffold

Data, Intelligence and Action MCP foundations

Synthetic-data generation and validation

Windows developer launchers

Deferred to Sprint 2

PostgreSQL schema

Flyway migrations

Tenant, warehouse, SKU, batch and sales persistence

CSV import pipeline

Dashboard aggregation from persisted data

Tenant-isolation enforcement

Deferred to Sprint 3

Model training and backtesting

Forecast accuracy metrics

Stockout and expiry risk models

OR-Tools optimisation

FEFO rebalancing

Purchase-versus-transfer comparison

Financial impact engine

Deferred to Sprint 4

Secured MCP host

Copilot REST API

LLM integration

Tool-call trace and evidence display

Prompt-injection and output controls

Deferred to Sprint 5

Persistent transfer and purchase proposals

Approval inbox

Approve/reject workflow

Audit and outcome measurement

Controlled ERP execution requests

See docs/SPRINT_PLAN.md for the implementation sequence.

Git workflow recommendation

Use the Fixed v2 package as the Sprint 1 baseline.

main
  └── protected release-ready code

develop or feature branches
  ├── feat/sprint2-data-foundation
  ├── feat/postgresql-persistence
  ├── feat/csv-import
  └── chore/dependency-updates

Recommended baseline tag:

git tag -a v0.1.0-sprint1 -m "StockFlow AI Sprint 1 Fixed v2"
git push origin v0.1.0-sprint1

Use pull requests for dependency upgrades and later sprint development. Do not modify the Fixed v2 baseline directly after tagging it.

Security and governance notes

Action MCP is disabled by default.

High-value actions must require human approval.

The AI layer must not receive unrestricted database access.

MCP tools must not directly alter inventory balances.

Tenant scope must be enforced server-side when persistence is introduced.

Secrets must never be committed to Git.

Generated recommendations should retain evidence, assumptions and financial impact.

Documentation

Document

Purpose

FIX_NOTES.md

Fixed v2 corrections

docs/RUN_WINDOWS.md

Windows execution guide

docs/SPRINT_PLAN.md

Five-sprint delivery plan

docs/BACKEND_AND_MCP_ARCHITECTURE.md

Backend and MCP architecture

docs/SYNTHETIC_DATA_SPECIFICATION.md

Synthetic-data rules and schemas

contracts/dashboard-api.openapi.yaml

Dashboard REST contract

VALIDATION_RESULTS.json

Package validation summary

Current prototype limitation

Sprint 1 is a foundation package. The dashboard and service contracts are operational, but the core API still serves a controlled fixture rather than PostgreSQL data. Forecasting and optimisation are deterministic scaffolds rather than trained production models. The copilot response is scripted, and Action MCP creates no commercial transaction.

These limitations are deliberate so the project can establish a stable, testable end-to-end foundation before persistence, production intelligence and approval-controlled execution are introduced.
