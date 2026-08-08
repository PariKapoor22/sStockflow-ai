from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import uuid

router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"]
)

shipments = []


class Shipment(BaseModel):
    company: str
    origin: str
    destination: str
    weight: float
    volume: float
    priority: str
    delivery_date: str
    vehicle_type: str


@router.get("/")
def get_shipments():
    return shipments


@router.post("/")
def create_shipment(shipment: Shipment):

    data = shipment.model_dump()

    data["id"] = str(uuid.uuid4())[:8]

    data["status"] = "Pending"

    shipments.append(data)

    return data


@router.delete("/{shipment_id}")
def delete_shipment(shipment_id: str):

    global shipments

    shipments = [
        s for s in shipments
        if s["id"] != shipment_id
    ]

    return {
        "message": "Shipment Deleted Successfully"
    }