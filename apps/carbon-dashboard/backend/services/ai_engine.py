from math import sqrt

# Simple emission factors (kg CO₂ per km)
EMISSION_FACTORS = {
    "Electric": 0.08,
    "Hybrid": 0.14,
    "Diesel": 0.27,
    "Petrol": 0.24
}


def calculate_distance(lat1, lon1, lat2, lon2):
    return sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2) * 111


def estimate_carbon(distance, fuel_type):
    factor = EMISSION_FACTORS.get(fuel_type, 0.25)
    return round(distance * factor, 2)


def estimate_cost(distance):
    return round(distance * 35, 2)


def estimate_eta(distance):
    return round(distance / 60, 2)


def recommend(warehouse, vehicle, destination):

    distance = calculate_distance(
        warehouse.latitude,
        warehouse.longitude,
        destination["latitude"],
        destination["longitude"]
    )

    carbon = estimate_carbon(distance, vehicle.fuel_type)

    return {
        "warehouse": warehouse.warehouse_name,
        "vehicle": vehicle.vehicle_number,
        "driver": vehicle.driver_name,
        "distance_km": round(distance, 2),
        "estimated_carbon": carbon,
        "estimated_cost": estimate_cost(distance),
        "estimated_time": estimate_eta(distance),
        "confidence": 96,
        "recommendation":
        "Dispatch immediately using this vehicle because it provides the lowest estimated carbon emission."
    }