StockFlow AI — Sprint 1 Foundation

ERP-neutral inventory intelligence, demand forecasting, and stock optimisation for wholesalers and distributors

StockFlow AI identifies stockout risk, near-expiry inventory, excess stock, and working-capital blockage. It generates explainable recommendations for procurement, inter-warehouse stock transfer, and inventory action.

This repository contains the Sprint 1 Fixed v2 foundation, including:

A working Angular dashboard

A Kotlin and Spring Boot core API

Deterministic Python forecasting and optimisation services

Three logical MCP servers

Synthetic data generation and validation

Windows launch and configuration scripts

Release Information

Item

Value

Release status

Sprint 1 foundation / prototype

Package label

Fixed v2

Recommended Git tag

v0.1.0-sprint1

Primary target users

Wholesalers and distributors

Supported verticals

Pharmaceuticals, supermarkets, and merchandise

Development environment

Windows-first local development

Table of Contents

What Sprint 1 Delivers

Fixed v2 Corrections

Architecture

Technology Stack

Repository Structure

Prerequisites

Quick Start on Windows

Run Components Individually

MCP Servers

Component Endpoints

Synthetic Data

Testing and Validation

Environment Variables

Troubleshooting

Sprint Boundaries

Git Workflow Recommendation

Security and Governance

Documentation

Current Prototype Limitations

What Sprint 1 Delivers

Web Dashboard

The Angular web application includes:

Responsive dashboard layout

Sidebar navigation and product shell

Inventory KPI cards

Inventory-risk breakdown

Top-risk inventory list

Demand forecast chart

Inventory value trend

AI recommendation cards

Network summary

Sprint 1 copilot interaction panel

Automatic fallback to bundled mock JSON when the core API is unavailable

Kotlin Core API

The core backend includes:

Kotlin and Spring Boot application

Dashboard overview REST endpoint

Spring Boot Actuator health endpoint

CORS configuration for the Angular development server

Classpath-backed JSON fixture for Sprint 1

Backend integration testing using MockMvc

Python Intelligence Services

Forecasting Service

FastAPI-based forecasting API

Deterministic weekly seasonal baseline

Predicted-demand confidence range

Lower and upper forecast bounds

Optimisation Service

FastAPI-based stock optimisation API

Source safety-stock protection

Destination-shortage constraint

Transfer-value calculation

Transport-cost calculation

Expected-benefit calculation

Positive-net-benefit validation

MCP Layer

StockFlow AI includes three logical MCP servers:

Data MCP

Provides read-only access to the dashboard inventory summary.

Intelligence MCP

Provides forecasting and stock-transfer recommendation tools.

Action MCP

Provides controlled transfer-proposal creation.

The Action MCP server:

Is disabled by default

Creates draft proposals only

Does not execute stock movement

Does not create an ERP transaction

Preserves human approval as a mandatory boundary

Synthetic Data

The synthetic-data foundation supports:

Multiple tenants and business units

Wholesaler and distributor operating models

Pharmaceutical, supermarket, and merchandise verticals

Warehouses, retailers, and SKUs

Batch inventory and expiry dates

Historical sales

Open purchase orders

Warehouse transfer routes

Deterministic generator configuration

Validation reporting

Fixed v2 Corrections

Fixed v2 addresses the following Sprint 1 backend and Windows execution issues:

Removed the Spring Boot 4 and Jackson 2 ObjectMapper incompatibility

Returned the dashboard fixture as an explicit application/json response

Removed the obsolete direct Jackson 2 Kotlin module dependency

Added Maven discovery from:

PATH

%USERPROFILE%\Tools

C:\Tools

Configured Java 17 bytecode compatibility for Java 17, 21, and 25 runtimes

Added backend test execution before the Windows launcher starts the API

Added individual Windows launchers so every service starts from its correct directory

See FIX_NOTES.md for the package-level correction summary.

Architecture

flowchart LR
    USER[Inventory Manager] --> WEB[Angular Dashboard<br/>Port 4200]
    WEB --> CORE[Kotlin Spring Boot Core API<br/>Port 8080]
    WEB -. API unavailable .-> MOCK[Local Dashboard JSON]

    MCPD[Data MCP<br/>Port 8201] --> CORE
    MCPI[Intelligence MCP<br/>Port 8202] --> FC[Forecasting Service<br/>Port 8101]
    MCPI --> OP[Optimisation Service<br/>Port 8102]
    MCPA[Action MCP<br/>Port 8203] --> PROPOSAL[Draft Proposal Only]

    DATA[Synthetic CSV Data] --> DEMO[Prototype Demonstration]

Sprint 1 Runtime Relationship

Angular UI
├── Core API available   → /api/v1/dashboard/overview
└── Core API unavailable → local mock dashboard JSON

Data MCP         → Kotlin Core API
Intelligence MCP → Forecasting and Optimisation services
Action MCP       → Controlled draft proposal only

MCP is the AI-facing capability layer. It does not replace REST APIs, ERP integration, transaction processing, or approval workflows.

Technology Stack

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

The following capabilities are planned for later sprints:

PostgreSQL

Redis

Production machine-learning models

OR-Tools optimisation

Authentication and authorisation

Persistent approval workflows

Controlled ERP execution

Repository Structure

stockflow-ai-sprint1/
├── apps/
│   └── stockflow-web/                  # Angular dashboard
├── services/
│   ├── stockflow-core-api/             # Kotlin Spring Boot API
│   ├── forecasting-service/            # Python FastAPI forecast service
│   └── optimisation-service/           # Python FastAPI optimisation service
├── mcp/
│   └── stockflow_mcp/                  # Data, Intelligence, and Action MCP
├── contracts/
│   └── dashboard-api.openapi.yaml      # Sprint 1 API contract
├── data/
│   ├── sample/                         # Small reusable sample dataset
│   ├── generated/                      # Locally generated dataset
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

Recommended Version

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

Verify the Development Environment

Run the following commands from Command Prompt:

node --version
npm --version
java -version
mvn --version
python --version
uv --version

Install PyYAML when it is not already available:

python -m pip install pyyaml

Maven Discovery on Windows

The supplied scripts detect Maven in any of the following locations:

mvn available on PATH

%USERPROFILE%\Tools\apache-maven-*\bin\mvn.cmd

C:\Tools\apache-maven-*\bin\mvn.cmd

When Maven is not available on PATH, extract it under one of these supported locations:

%USERPROFILE%\Tools\apache-maven-3.9.x

or:

C:\Tools\apache-maven-3.9.x

Then run:

configure-maven-windows.cmd

Quick Start on Windows

Option 1 — Run Only the Dashboard

This is the quickest way to verify the web interface.

The dashboard automatically uses the local JSON fixture when the Kotlin API is unavailable.

From the repository root, run:

run-web-windows.cmd

Open:

http://localhost:4200

The first run automatically executes npm install when node_modules does not exist.

Option 2 — Run the Complete Sprint 1 Platform

First verify that the following are available:

Node.js

npm

Java

Maven

Python

uv

PyYAML

Then run from the repository root:

RUN_ALL_WINDOWS.cmd

The launcher:

Validates the required tools

Detects Maven

Generates synthetic data

Validates the generated data

Opens every component in a separate Command Prompt window

Starts Angular after the backend and service terminals have opened

Wait for every terminal to report that its service is running.

Recommended First-Run Sequence

For easier troubleshooting, start the platform one component at a time:

Angular dashboard

Kotlin core API

Forecasting service

Optimisation service

Data MCP

Intelligence MCP

Action MCP

Use a separate Command Prompt window for every long-running service.

Run Components Individually

All helper commands in this section must be run from the repository root.

Angular Dashboard

Run:

run-web-windows.cmd

Manual equivalent:

cd apps\stockflow-web
npm install
npm start

Application URL:

http://localhost:4200

The Angular application first requests:

/api/v1/dashboard/overview

When the backend is unavailable, it falls back to:

src/assets/mock/dashboard-overview.json

Kotlin Core API

Run:

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

Forecasting Service

Run:

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

The Sprint 1 service uses a deterministic weekly seasonal baseline and returns:

Predicted demand

Lower confidence bound

Upper confidence bound

Optimisation Service

Run:

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

The optimisation service:

Protects source safety stock

Limits transfer quantity to destination shortage

Calculates transfer value and transport cost

Returns a recommendation only when the estimated net benefit is positive

MCP Servers

Start an MCP server only after its dependent downstream services are running.

Data MCP

Run:

run-mcp-data-windows.cmd

Endpoint:

http://127.0.0.1:8201/mcp

Exposed capabilities:

get_inventory_summary
stockflow://dashboard/overview

Dependency:

Kotlin Core API → http://127.0.0.1:8080

Intelligence MCP

Run:

run-mcp-intelligence-windows.cmd

Endpoint:

http://127.0.0.1:8202/mcp

Exposed capabilities:

forecast_demand
recommend_stock_transfer

Dependencies:

Forecasting API  → http://127.0.0.1:8101
Optimisation API → http://127.0.0.1:8102

Action MCP

Run:

run-mcp-action-windows.cmd

Endpoint:

http://127.0.0.1:8203/mcp

The Action MCP server is disabled by default:

STOCKFLOW_ENABLE_ACTIONS=false

To enable controlled draft-proposal creation for a local demonstration:

set STOCKFLOW_ENABLE_ACTIONS=true
run-mcp-action-windows.cmd

Enabling Action MCP creates a draft proposal only. It does not move inventory, update stock balances, or create an ERP transaction.

Test with MCP Inspector

MCP endpoints are protocol endpoints and are not intended to be opened as standard browser pages.

Start MCP Inspector:

npx -y @modelcontextprotocol/inspector

Connect using Streamable HTTP and select one endpoint at a time.

Component Endpoints

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

Synthetic Data

Generate the Full Dataset

Run from the repository root:

python scripts\generate_synthetic_data.py --config data\generator_config.yaml --output data\generated

Validate the Generated Dataset

python scripts\validate_synthetic_data.py --dataset data\generated

Validate the Repository Structure

python scripts\validate_project.py

The generator uses a fixed random seed. Repeated executions therefore produce deterministic output for the same configuration.

Dataset Model

The Sprint 1 generator supports:

3 tenants or business units

10 warehouses

50 retailers

100 SKUs

Pharmaceutical categories

Supermarket categories

Merchandise categories

Historical sales

Multiple batches and expiry dates

Open purchase orders

Warehouse transfer routes

Judge-facing Paracetamol stock-rebalancing scenario

Generated files are written under:

data/generated/

Large generated outputs are intentionally excluded through .gitignore.

The smaller reusable sample dataset remains version-controlled under:

data/sample/

Testing and Validation

Angular Build Validation

cd apps\stockflow-web
npm run build

The Sprint 1 package does not yet include a complete Angular unit-test specification. Therefore, npm test is not the primary Angular validation command for this release.

Kotlin API Testing

cd services\stockflow-core-api
mvn clean test

The backend integration test verifies that:

/api/v1/dashboard/overview returns HTTP 200

riskTotal is present

Five KPI records are returned

Python Syntax Validation

Run from the repository root:

python -m compileall services mcp scripts

API Testing

Use the generated Swagger interfaces:

Service

Swagger URL

Forecasting

http://localhost:8101/docs

Optimisation

http://localhost:8102/docs

Environment Variables

The supplied .env.example documents the local defaults:

STOCKFLOW_CORE_API_URL=http://127.0.0.1:8080
STOCKFLOW_FORECAST_API_URL=http://127.0.0.1:8101
STOCKFLOW_OPTIMISATION_API_URL=http://127.0.0.1:8102
STOCKFLOW_ENABLE_ACTIONS=false

Do not commit a real .env file containing secrets. The .env file is excluded through .gitignore.

Troubleshooting

npm error Missing script: "start"

Cause: npm start was executed from the repository root.

Use:

run-web-windows.cmd

or:

cd apps\stockflow-web
npm start

ModuleNotFoundError: No module named 'stockflow_forecasting'

Cause: Uvicorn was executed from the repository root or outside the forecasting-service environment.

Use:

run-forecasting-windows.cmd

or:

cd services\forecasting-service
uv sync
uv run uvicorn stockflow_forecasting.main:app --port 8101

ModuleNotFoundError: No module named 'stockflow_optimisation'

Use:

run-optimisation-windows.cmd

or run uv sync and Uvicorn from:

services\optimisation-service

'mvn' is not recognized

Install or extract Maven into one of the supported directories:

%USERPROFILE%\Tools\apache-maven-3.9.x

or:

C:\Tools\apache-maven-3.9.x

Then run:

configure-maven-windows.cmd
run-core-api-windows.cmd

Angular Deprecation or npm Audit Warnings

Dependency deprecation and audit messages do not necessarily prevent the development server from running.

Review the npm audit output before changing dependencies.

Do not automatically run:

npm audit fix --force

Forced upgrades can introduce breaking Angular changes. Apply dependency upgrades through a separate branch and validate the complete build.

Terminate batch job (Y/N)?

When stopping Angular:

Press Ctrl+C

Type Y only while the Terminate batch job (Y/N)? prompt is visible

Press Enter

When the normal command prompt has already returned, typing Y is treated as a command and produces:

'y' is not recognized

Port Already in Use

Find the process using the required port:

netstat -ano | findstr :4200
netstat -ano | findstr :8080
netstat -ano | findstr :8101
netstat -ano | findstr :8102

Stop the relevant process only after confirming its PID:

taskkill /PID /F

Sprint Boundaries

Implemented in Sprint 1 Fixed v2

Dashboard shell and visual analytics

Mock-first frontend data flow

Dashboard REST contract

Kotlin fixture-backed API

Deterministic forecast scaffold

Deterministic transfer-recommendation scaffold

Data, Intelligence, and Action MCP foundations

Synthetic-data generation and validation

Windows developer launchers

Deferred to Sprint 2

PostgreSQL schema

Flyway migrations

Tenant persistence

Warehouse persistence

SKU persistence

Batch and sales persistence

CSV import pipeline

Dashboard aggregation from persisted data

Tenant-isolation enforcement

Deferred to Sprint 3

Model training and backtesting

Forecast-accuracy metrics

Stockout-risk models

Expiry-risk models

OR-Tools optimisation

FEFO rebalancing

Purchase-versus-transfer comparison

Financial-impact engine

Deferred to Sprint 4

Secured MCP host

Copilot REST API

LLM integration

Tool-call trace and evidence display

Prompt-injection controls

Output controls

Deferred to Sprint 5

Persistent transfer proposals

Persistent purchase proposals

Approval inbox

Approve and reject workflow

Audit and outcome measurement

Controlled ERP execution requests

See docs/SPRINT_PLAN.md for the implementation sequence.

Git Workflow Recommendation

Use the Fixed v2 package as the Sprint 1 baseline.

main
└── protected release-ready code

 develop or feature branches
├── feat/sprint2-data-foundation
├── feat/postgresql-persistence
├── feat/csv-import
└── chore/dependency-updates

Create the Sprint 1 Baseline Tag

git tag -a v0.1.0-sprint1 -m "StockFlow AI Sprint 1 Fixed v2"
git push origin v0.1.0-sprint1

Use pull requests for:

Dependency upgrades

Sprint 2 development

Feature development

Configuration changes

Security changes

Do not modify the Fixed v2 baseline directly after tagging it.

Security and Governance

The Sprint 1 foundation follows these mandatory controls:

Action MCP is disabled by default

High-value actions require human approval

The AI layer must not receive unrestricted database access

MCP tools must not directly alter inventory balances

Tenant scope must be enforced server-side when persistence is introduced

Secrets must never be committed to Git

Recommendations must retain evidence, assumptions, and financial impact

ERP transactions must not be executed directly by the LLM or MCP layer

Production actions must be auditable and approval-controlled

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

Current Prototype Limitations

Sprint 1 is a foundation package.

The dashboard and service contracts are operational, but the following limitations remain deliberate:

The core API serves a controlled fixture rather than PostgreSQL data

Forecasting uses a deterministic scaffold rather than a trained production model

Optimisation uses deterministic rules rather than a production optimisation engine

The copilot response is scripted

Action MCP does not create a commercial transaction

Authentication and tenant isolation are not yet implemented

Recommendations are not yet persisted

Approval workflows are not yet persistent

ERP execution is not enabled

These boundaries allow StockFlow AI to establish a stable, testable, end-to-end foundation before adding persistence, production intelligence, secured AI orchestration, approval workflows, and controlled execution.

Release Tag

v0.1.0-sprint1

Item

Value

Package

StockFlow AI — Sprint 1 Foundation

Release label

Fixed v2

Status

Prototype foundation
