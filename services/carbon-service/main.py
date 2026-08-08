from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Carbon Accountability Platform API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Carbon Accountability Backend Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/dashboard")
def dashboard():
    return {
        "warehouses": 5,
        "inventory_items": 2847,
        "vehicles": 42,
        "carbon_saved": 128.6,
        "active_shipments": 31,
        "ai_recommendations": 18,
        "fleet_utilization": 84,
        "monthly_emissions": [
            540,
            520,
            505,
            470,
            445,
            410,
            395
        ],
        "months": [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul"
        ],
        "sustainability_score": 91,
        "recent_activity": [
            "Warehouse A optimized",
            "AI suggested alternate route",
            "Carbon reduced by 8%",
            "Vehicle TRK-103 serviced"
        ]
    }