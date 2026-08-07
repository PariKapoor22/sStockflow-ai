from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.warehouse import Warehouse

router = APIRouter(
    prefix="/warehouse",
    tags=["Warehouse"]
)


@router.get("/")
def get_all_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()


@router.post("/demo")
def create_demo_warehouse(db: Session = Depends(get_db)):

    warehouse = Warehouse(
        warehouse_name="Chennai Central Warehouse",
        city="Chennai",
        state="Tamil Nadu",
        country="India",
        latitude=13.0827,
        longitude=80.2707,
        capacity=100000,
        current_utilization=72,
        electricity_usage=4500,
        renewable_energy_percent=38,
        carbon_score=91,
        manager="Rahul Sharma",
        status="Active",
    )

    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    return warehouse


@router.get("/{warehouse_id}")
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    return db.query(Warehouse).filter(
        Warehouse.id == warehouse_id
    ).first()


@router.delete("/{warehouse_id}")
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db)):

    warehouse = db.query(Warehouse).filter(
        Warehouse.id == warehouse_id
    ).first()

    if warehouse is None:
        return {"message": "Warehouse not found"}

    db.delete(warehouse)
    db.commit()

    return {"message": "Warehouse deleted successfully"}