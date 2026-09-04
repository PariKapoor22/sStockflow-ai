from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


ALLOWED_TRANSITIONS = {
    "DRAFT": {"OPTIMIZED", "APPROVED"},
    "READY_FOR_APPROVAL": {"APPROVED"},
    "OPTIMIZED": {"APPROVED"},
    "APPROVED": {"IN_TRANSIT"},
    "IN_TRANSIT": {"DELIVERED"},
    "DELIVERED": set(),
}


def _database_path() -> Path:
    configured = os.getenv("STOCKFLOW_ROUTE_DB", "").strip()
    return Path(configured) if configured else Path(__file__).resolve().parents[2] / "route-optimisation.db"


def _connection() -> sqlite3.Connection:
    connection = sqlite3.connect(_database_path())
    connection.execute("""
        CREATE TABLE IF NOT EXISTS route_optimisation_run (
            run_id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            objective TEXT NOT NULL,
            request_json TEXT NOT NULL,
            response_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    return connection


def save_route_run(tenant_id: str, objective: str, request: dict, response: dict) -> str:
    run_id = str(uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    with _connection() as connection:
        connection.execute(
            "INSERT INTO route_optimisation_run VALUES (?,?,?,?,?,?,?)",
            (run_id, tenant_id, objective, json.dumps(request), json.dumps(response), timestamp, timestamp),
        )
    return run_id


def route_run(tenant_id: str, run_id: str) -> dict | None:
    with _connection() as connection:
        row = connection.execute(
            "SELECT response_json,created_at,updated_at FROM route_optimisation_run WHERE tenant_id=? AND run_id=?",
            (tenant_id, run_id),
        ).fetchone()
    if row is None:
        return None
    return {"runId": run_id, "createdAt": row[1], "updatedAt": row[2], **json.loads(row[0])}


def update_route_status(tenant_id: str, run_id: str, route_id: str, requested_status: str, actor_id: str) -> dict:
    run = route_run(tenant_id, run_id)
    if run is None:
        raise KeyError("Route optimisation run was not found")
    route = next((item for item in run.get("routes", []) if item.get("id") == route_id), None)
    if route is None:
        raise KeyError("Optimized route was not found")
    current = str(route.get("status", "OPTIMIZED")).upper().replace(" ", "_")
    target = requested_status.upper().replace(" ", "_")
    if target not in ALLOWED_TRANSITIONS.get(current, set()):
        raise ValueError(f"Route cannot move from {current} to {target}")
    route["status"] = target.replace("_", " ").title()
    route["statusChangedBy"] = actor_id
    route["statusChangedAt"] = datetime.now(timezone.utc).isoformat()
    response = {key: value for key, value in run.items() if key not in {"runId", "createdAt", "updatedAt"}}
    timestamp = datetime.now(timezone.utc).isoformat()
    with _connection() as connection:
        connection.execute(
            "UPDATE route_optimisation_run SET response_json=?,updated_at=? WHERE tenant_id=? AND run_id=?",
            (json.dumps(response), timestamp, tenant_id, run_id),
        )
    return route
