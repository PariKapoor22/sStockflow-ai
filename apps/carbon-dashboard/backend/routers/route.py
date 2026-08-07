from fastapi import APIRouter
from pydantic import BaseModel

from services.route_optimizer import calculate_route

router = APIRouter(
    prefix="/route",
    tags=["Route Planner"]
)


class RouteRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    mileage: float
    fuel_type: str


@router.post("/calculate")
def calculate(request: RouteRequest):

    result = calculate_route(
        (
            request.origin_lat,
            request.origin_lon,
        ),
        (
            request.destination_lat,
            request.destination_lon,
        ),
        request.mileage,
        request.fuel_type,
    )

    return result