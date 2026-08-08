def generate_recommendation(
    inventory,
    fleet,
    route,
):
    """
    AI Recommendation Engine
    """

    days_cover = inventory["days_cover"]

    service_score = max(
        0,
        min(
            100,
            100 - (days_cover * 10)
        )
    )

    cost_score = max(
        0,
        100 - int(route["distance"] / 5)
    )

    carbon_score = max(
        0,
        100 - int(route["carbon_emission"])
    )

    utilization = min(
        100,
        int(
            (
                inventory["available_quantity"] /
                max(fleet["capacity"], 1)
            ) * 100
        )
    )

    expiry_score = 90

    final_score = round(
        (
            service_score * 0.40 +
            cost_score * 0.25 +
            carbon_score * 0.20 +
            utilization * 0.10 +
            expiry_score * 0.05
        ),
        2
    )

    explanation = []

    if inventory["risk"] == "High":
        explanation.append(
            "Destination warehouse is at high stockout risk."
        )

    if route["carbon_emission"] < 50:
        explanation.append(
            "Selected route has comparatively low carbon emissions."
        )

    if utilization > 80:
        explanation.append(
            "Vehicle capacity is efficiently utilized."
        )

    explanation.append(
        "Source warehouse remains above safety stock after transfer."
    )

    return {

        "final_score": final_score,

        "service_score": service_score,

        "cost_score": cost_score,

        "carbon_score": carbon_score,

        "vehicle_utilization": utilization,

        "expiry_score": expiry_score,

        "estimated_distance": route["distance"],

        "estimated_carbon": route["carbon_emission"],

        "estimated_time": route["travel_time"],

        "estimated_fuel": route["fuel_used"],

        "recommendation": explanation,

        "approval_required": True

    }