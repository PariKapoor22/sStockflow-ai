import os
import httpx

CORE_API = os.getenv("STOCKFLOW_CORE_API_URL", "http://127.0.0.1:8080")
FORECAST_API = os.getenv("STOCKFLOW_FORECAST_API_URL", "http://127.0.0.1:8101")
OPTIMISATION_API = os.getenv("STOCKFLOW_OPTIMISATION_API_URL", "http://127.0.0.1:8102")
TENANT_ID = os.getenv("STOCKFLOW_TENANT_ID", "TEN-ACME-PHARMA")
ACCESS_TOKEN = os.getenv("STOCKFLOW_ACCESS_TOKEN", "")

def auth_headers() -> dict[str, str]:
    headers = {"X-Tenant-ID": TENANT_ID}
    if ACCESS_TOKEN:
        headers["Authorization"] = f"Bearer {ACCESS_TOKEN}"
    return headers

def get_json(url: str, params: dict | None = None) -> dict | list:
    with httpx.Client(timeout=10) as client:
        response = client.get(url, headers=auth_headers(), params=params)
        response.raise_for_status()
        return response.json()

def post_json(url: str, payload: dict) -> dict | list:
    with httpx.Client(timeout=20) as client:
        response = client.post(url, headers=auth_headers(), json=payload)
        response.raise_for_status()
        return response.json()
