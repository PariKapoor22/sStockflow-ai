import os
import httpx

CORE_API = os.getenv("STOCKFLOW_CORE_API_URL", "http://127.0.0.1:8080")
FORECAST_API = os.getenv("STOCKFLOW_FORECAST_API_URL", "http://127.0.0.1:8101")
OPTIMISATION_API = os.getenv("STOCKFLOW_OPTIMISATION_API_URL", "http://127.0.0.1:8102")

def get_json(url: str) -> dict:
    with httpx.Client(timeout=10) as client:
        response = client.get(url)
        response.raise_for_status()
        return response.json()

def post_json(url: str, payload: dict) -> dict:
    with httpx.Client(timeout=20) as client:
        response = client.post(url, json=payload)
        response.raise_for_status()
        return response.json()
