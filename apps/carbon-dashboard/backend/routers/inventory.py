from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.inventory import Inventory

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


class InventoryIn(BaseModel):
    warehouse: str
    sku: str
    product_name: str
    available_quantity: float = 0
    safety_stock: float = 0
    forecast_7_days: float = 0
    expiry_date: Optional[str] = None


def _compute_risk_and_cover(available_quantity: float, safety_stock: float, forecast_7_days: float):
    if safety_stock and available_quantity <= safety_stock:
        risk = "High"
    elif safety_stock and available_quantity <= safety_stock * 1.5:
        risk = "Medium"
    else:
        risk = "Low"

    daily_demand = (forecast_7_days / 7) if forecast_7_days else 0
    days_cover = round(available_quantity / daily_demand, 1) if daily_demand else 0

    return risk, days_cover


@router.get("/")
def get_inventory(db: Session = Depends(get_db)):
    return db.query(Inventory).all()


@router.get("/{item_id}")
def get_inventory_item(item_id: int, db: Session = Depends(get_db)):
    return db.query(Inventory).filter(Inventory.id == item_id).first()


@router.post("/")
def create_inventory(item: InventoryIn, db: Session = Depends(get_db)):
    risk, days_cover = _compute_risk_and_cover(
        item.available_quantity, item.safety_stock, item.forecast_7_days
    )

    db_item = Inventory(
        warehouse=item.warehouse,
        sku=item.sku,
        product_name=item.product_name,
        available_quantity=item.available_quantity,
        safety_stock=item.safety_stock,
        forecast_7_days=item.forecast_7_days,
        expiry_date=item.expiry_date,
        risk=risk,
        days_cover=days_cover,
    )

    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    return db_item


@router.put("/{item_id}")
def update_inventory(item_id: int, item: InventoryIn, db: Session = Depends(get_db)):
    db_item = db.query(Inventory).filter(Inventory.id == item_id).first()

    if db_item is None:
        return {"message": "Inventory item not found"}

    risk, days_cover = _compute_risk_and_cover(
        item.available_quantity, item.safety_stock, item.forecast_7_days
    )

    for field, value in item.model_dump().items():
        setattr(db_item, field, value)

    db_item.risk = risk
    db_item.days_cover = days_cover

    db.commit()
    db.refresh(db_item)

    return db_item


@router.delete("/{item_id}")
def delete_inventory(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Inventory).filter(Inventory.id == item_id).first()

    if item is None:
        return {"message": "Inventory item not found"}

    db.delete(item)
    db.commit()

    return {"message": "Inventory deleted successfully"}
