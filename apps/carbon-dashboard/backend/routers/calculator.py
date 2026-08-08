from fastapi import APIRouter
from pydantic import BaseModel

from services.carbon_engine import calculate_emissions

router = APIRouter(
    tags=["Carbon Calculator"]
)


class CalculateRequest(BaseModel):
    electricity: float = 0
    fuel: float = 0
    transport: float = 0
    waste: float = 0


@router.post("/calculate")
def calculate(request: CalculateRequest):
    return calculate_emissions(
        request.electricity,
        request.fuel,
        request.transport,
        request.waste,
    )
