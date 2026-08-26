from __future__ import annotations

import hashlib
import os
from datetime import UTC, datetime
from typing import Any

import httpx


PROVIDERS = {
    "LHASA": {"url_env": "LHASA_GEOJSON_URL", "hazard": "LANDSLIDE", "model": "NASA_LHASA",
              "homepage": "https://github.com/nasa/lhasa"},
    "GLOFAS": {"url_env": "GLOFAS_GEOJSON_URL", "hazard": "FLOOD", "model": "COPERNICUS_GLOFAS_LISFLOOD",
               "homepage": "https://global-flood.emergency.copernicus.eu/"},
}


def normalize_feature(provider: str, feature: dict[str, Any], *, live: bool) -> dict[str, Any] | None:
    config = PROVIDERS[provider]
    geometry = feature.get("geometry")
    if not isinstance(geometry, dict) or geometry.get("type") not in {
        "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"
    }:
        return None
    properties = feature.get("properties") if isinstance(feature.get("properties"), dict) else {}
    observed = properties.get("observed_at") or properties.get("timestamp")
    digest = hashlib.sha256(repr((provider, geometry, properties.get("id"))).encode()).hexdigest()[:16]
    return {
        "id": str(properties.get("id") or f"{provider.lower()}-{digest}"),
        "title": str(properties.get("title") or f"{provider} {config['hazard'].lower()} outlook"),
        "eventType": config["hazard"], "hazardType": config["hazard"],
        "areaName": str(properties.get("area_name") or properties.get("name") or "Model coverage area"),
        "geometry": geometry,
        "severity": str(properties.get("severity") or properties.get("risk_level") or "UNKNOWN").upper(),
        "confidence": properties.get("confidence"), "probability": properties.get("probability"),
        "observedAt": observed, "validFrom": properties.get("valid_from") or observed,
        "validUntil": properties.get("valid_until"),
        "phase": str(properties.get("phase") or "FORECAST").upper(),
        "source": provider, "model": config["model"], "sourceUri": config["homepage"], "live": live,
    }


async def load_hazards(providers: list[str]) -> dict[str, Any]:
    alerts, sources = [], []
    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        for provider in providers:
            config = PROVIDERS[provider]
            url = os.getenv(config["url_env"], "").strip()
            if not url:
                sources.append({"provider": provider, "configured": False, "live": False, "count": 0})
                continue
            response = await client.get(url)
            response.raise_for_status()
            payload = response.json()
            features = payload.get("features", []) if isinstance(payload, dict) else []
            usable = [item for feature in features
                      if (item := normalize_feature(provider, feature, live=True)) is not None]
            alerts.extend(usable)
            sources.append({"provider": provider, "configured": True, "live": True, "count": len(usable)})
    return {"alerts": alerts, "count": len(alerts), "sources": sources,
            "generatedAt": datetime.now(UTC).isoformat(),
            "disclaimer": "Model outlooks support decisions but do not replace official civil-authority warnings."}
