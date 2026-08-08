# Emission factors (kg CO2e per unit), consistent with the frontend's
# src/data/emissionFactors.js so client and server never disagree.
EMISSION_FACTORS = {
    "electricity": 0.82,   # kg CO2e per kWh
    "fuel": 2.68,           # kg CO2e per litre (diesel)
    "transport": 0.12,      # kg CO2e per km
    "waste": 0.45,           # kg CO2e per kg
}

# Rough reference ceiling used only to scale the 0-100 "carbon score".
# Not a scientific benchmark - just gives the UI something meaningful to show.
SCORE_REFERENCE_TOTAL = 2000.0


def calculate_emissions(electricity: float, fuel: float, transport: float, waste: float) -> dict:
    electricity_emission = round(electricity * EMISSION_FACTORS["electricity"], 2)
    fuel_emission = round(fuel * EMISSION_FACTORS["fuel"], 2)
    transport_emission = round(transport * EMISSION_FACTORS["transport"], 2)
    waste_emission = round(waste * EMISSION_FACTORS["waste"], 2)

    total = round(
        electricity_emission + fuel_emission + transport_emission + waste_emission,
        2,
    )

    carbon_score = max(0, min(100, round(100 - (total / SCORE_REFERENCE_TOTAL) * 100)))

    return {
        "electricityEmission": electricity_emission,
        "fuelEmission": fuel_emission,
        "transportEmission": transport_emission,
        "wasteEmission": waste_emission,
        "total": total,
        "carbonScore": carbon_score,
    }
