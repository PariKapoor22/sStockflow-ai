from geopy.distance import geodesic

EMISSION_FACTORS = {
    "Diesel": 2.68,
    "Petrol": 2.31,
    "Electric": 0.25,
    "CNG": 2.00,
}


def calculate_route(
    origin,
    destination,
    mileage,
    fuel_type,
):
    """
    origin = (lat, lon)
    destination = (lat, lon)
    mileage = km/l
    """

    distance = geodesic(origin, destination).km

    fuel_used = distance / mileage

    emission = fuel_used * EMISSION_FACTORS.get(
        fuel_type,
        2.5
    )

    average_speed = 50

    travel_time = distance / average_speed

    return {
        "distance": round(distance, 2),
        "fuel_used": round(fuel_used, 2),
        "carbon_emission": round(emission, 2),
        "travel_time": round(travel_time, 2),
    }