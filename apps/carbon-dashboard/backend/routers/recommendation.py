from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db

from models.warehouse import Warehouse
from models.fleet import Fleet

from services.ai_engine import recommend

router = APIRouter(
    prefix="/recommendation",
    tags=["AI Recommendation"]
)


@router.get("/")
def get_recommendation(db: Session = Depends(get_db)):

    warehouse = db.query(Warehouse).first()
    vehicle = db.query(Fleet).first()

    if warehouse is None:
        return {"message": "No warehouse found"}

    if vehicle is None:
        return {"message": "No vehicle found"}

    destination = {
        "city": "Bangalore",
        "latitude": 12.9716,
        "longitude": 77.5946
    }

    return recommend(
        warehouse,
        vehicle,
        destination
    )