def generate_recommendation(inventory, fleet, route):

    service_score = 100 - inventory["days_cover"] * 10

    cost_score = max(
        0,
        100 - route["distance"] / 5
    )

    carbon_score = max(
        0,
        100 - route["carbon_emission"]
    )

    utilization = min(
        100,
        inventory["available_quantity"] /
        fleet["capacity"] * 100
    )

    expiry_score = 90

    final_score = round(

        service_score * 0.40 +

        cost_score * 0.25 +

        carbon_score * 0.20 +

        utilization * 0.10 +

        expiry_score * 0.05,

        2

    )

    explanation = [

        "Destination warehouse is nearing stockout.",

        "Selected vehicle minimizes transport cost.",

        "Optimized route reduces carbon emissions.",

        "Source warehouse remains above safety stock.",

        "Vehicle capacity utilization is efficient."

    ]

    return {

        "score": final_score,

        "service_score": round(service_score, 2),

        "cost_score": round(cost_score, 2),

        "carbon_score": round(carbon_score, 2),

        "utilization": round(utilization, 2),

        "estimated_distance": route["distance"],

        "estimated_time": route["travel_time"],

        "estimated_carbon": route["carbon_emission"],

        "estimated_fuel": route["fuel_used"],

        "carbon_saved": round(route["carbon_emission"] * 0.30, 2),

        "fuel_saved": round(route["fuel_used"] * 0.20, 2),

        "recommendation": explanation

    }