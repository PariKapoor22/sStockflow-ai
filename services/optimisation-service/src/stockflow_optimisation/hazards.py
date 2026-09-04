from __future__ import annotations

import hashlib
import os
from datetime import UTC, datetime
from typing import Any

import httpx


PROVIDERS = {
    "LHASA": {
        "url_env": "LHASA_GEOJSON_URL",
        "hazard": "LANDSLIDE",
        "model": "NASA_LHASA",
        "homepage": "https://github.com/nasa/lhasa",
    },
    "GLOFAS": {
        "url_env": "GLOFAS_GEOJSON_URL",
        "hazard": "FLOOD",
        "model": "COPERNICUS_GLOFAS_LISFLOOD",
        "homepage": "https://global-flood.emergency.copernicus.eu/",
    },
    "STOCKFLOW_HAZARD": {
        "url_env": "HAZARD_SERVICE_URL",
        "hazard": "MULTI_HAZARD",
        "model": "STOCKFLOW_HAZARD_SCORER",
        "homepage": "http://127.0.0.1:8000/docs",
    },
}


def normalize_feature(provider: str, feature: dict[str, Any], *, live: bool) -> dict[str, Any] | None:
    config = PROVIDERS.get(provider, {
        "hazard": "MULTI_HAZARD",
        "model": provider,
        "homepage": "https://stockflow.ai",
    })
    geometry = feature.get("geometry")
    if not isinstance(geometry, dict) or geometry.get("type") not in {
        "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"
    }:
        return None
    properties = feature.get("properties") if isinstance(feature.get("properties"), dict) else feature
    observed = properties.get("observed_at") or properties.get("timestamp")
    hazard_type = str(
        properties.get("hazardType")
        or properties.get("hazard_type")
        or config.get("hazard")
        or "MULTI_HAZARD"
    ).upper()

    item_id = str(properties.get("id") or properties.get("risk_id") or "")
    if not item_id:
        digest = hashlib.sha256(repr((provider, geometry, properties.get("id"))).encode()).hexdigest()[:16]
        item_id = f"{provider.lower()}-{digest}"

    severity = str(
        properties.get("severity")
        or properties.get("risk_level")
        or "UNKNOWN"
    ).upper()

    probability = properties.get("probability")
    if probability is None:
        probability = properties.get("risk_score")

    area_name = str(
        properties.get("area_name")
        or properties.get("name")
        or properties.get("district_id")
        or "Model coverage area"
    )

    return {
        "id": item_id,
        "title": str(properties.get("title") or f"{provider} {hazard_type.lower()} outlook"),
        "eventType": hazard_type,
        "hazardType": hazard_type,
        "areaName": area_name,
        "geometry": geometry,
        "severity": severity,
        "confidence": properties.get("confidence"),
        "probability": probability,
        "observedAt": observed,
        "validFrom": properties.get("valid_from") or observed,
        "validUntil": properties.get("valid_until"),
        "phase": str(properties.get("phase") or "FORECAST").upper(),
        "source": provider,
        "model": config.get("model", provider),
        "sourceUri": config.get("homepage", "https://stockflow.ai"),
        "live": live,
    }


async def load_hazards(providers: list[str]) -> dict[str, Any]:
    alerts, sources = [], []
    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        for provider in providers:
            config = PROVIDERS.get(provider)
            if not config:
                continue
            url = os.getenv(config["url_env"], "").strip()
            if not url:
                sources.append({"provider": provider, "configured": False, "live": False, "count": 0})
                continue
            response = await client.get(url)
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                features = payload.get("features") or payload.get("items") or []
            elif isinstance(payload, list):
                features = payload
            else:
                features = []
            usable = [item for feature in features
                      if (item := normalize_feature(provider, feature, live=True)) is not None]
            alerts.extend(usable)
            sources.append({"provider": provider, "configured": True, "live": True, "count": len(usable)})
    return {"alerts": alerts, "count": len(alerts), "sources": sources,
            "generatedAt": datetime.now(UTC).isoformat(),
            "disclaimer": "Model outlooks support decisions but do not replace official civil-authority warnings."}
