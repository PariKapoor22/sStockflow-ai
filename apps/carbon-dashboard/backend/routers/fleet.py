from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(
    prefix="/fleet",
    tags=["Fleet Management"]
)

vehicles = []


class Vehicle(BaseModel):
    vehicle_name: str
    vehicle_number: str
    vehicle_type: str
    fuel_type: str
    capacity: float
    mileage: float
    emission_factor: float
    driver_name: str
    status: Optional[str] = "Available"


@router.get("/")
def get_all_vehicles():
    return vehicles


@router.post("/")
def add_vehicle(vehicle: Vehicle):

    new_vehicle = vehicle.model_dump()

    new_vehicle["id"] = str(uuid.uuid4())[:8]

    vehicles.append(new_vehicle)

    return {
        "message": "Vehicle Added Successfully",
        "vehicle": new_vehicle
    }


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: str):

    for vehicle in vehicles:

        if vehicle["id"] == vehicle_id:

            return vehicle

    return {
        "message": "Vehicle Not Found"
    }


@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: str, vehicle: Vehicle):

    for index, item in enumerate(vehicles):

        if item["id"] == vehicle_id:

            updated = vehicle.model_dump()

            updated["id"] = vehicle_id

            vehicles[index] = updated

            return {
                "message": "Vehicle Updated Successfully",
                "vehicle": updated
            }

    return {
        "message": "Vehicle Not Found"
    }


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: str):

    global vehicles

    vehicles = [
        v for v in vehicles
        if v["id"] != vehicle_id
    ]

    return {
        "message": "Vehicle Deleted Successfully"
    }