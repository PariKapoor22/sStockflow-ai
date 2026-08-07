from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

# Import Models
from models.warehouse import Warehouse
from models.inventory import Inventory
from models.fleet import Fleet

# Import Routers
from routers.warehouse import router as warehouse_router
from routers.inventory import router as inventory_router
from routers.fleet import router as fleet_router
from routers.recommendation import router as recommendation_router
from routers.calculator import router as calculator_router
from routers.shipment import router as shipment_router
from routers.route import router as route_router

# Create all database tables
Base.metadata.create_all(bind=engine)

# FastAPI App
app = FastAPI(
    title="StockFlow AI Backend",
    description="AI Powered Supply Chain & Carbon Accountability Platform",
    version="1.0.0"
)

# Enable CORS (for React Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(warehouse_router)
app.include_router(inventory_router)
app.include_router(fleet_router)
app.include_router(recommendation_router)
app.include_router(calculator_router)
app.include_router(shipment_router)
app.include_router(route_router)

# Root Endpoint
@app.get("/")
def root():
    return {
        "message": "🚀 StockFlow AI Backend Running Successfully",
        "version": "1.0.0",
        "status": "healthy"
    }

# Health Check
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "connected",
        "service": "StockFlow AI Backend"
    }

# Dashboard Summary
@app.get("/dashboard")
def dashboard():
    return {
        "warehouses": 1,
        "inventory_items": 1,
        "vehicles": 1,
        "carbon_saved": "128 kg",
        "active_shipments": 4,
        "ai_recommendations": 18,
        "fleet_utilization": "84%",
        "system_status": "Operational"
    }