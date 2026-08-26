import json
import requests


# ============================================================
# NORTH-EAST INDIA STOCKFLOW AI
# ============================================================

OLLAMA_URL = "http://localhost:11434/api/chat"
CARBON_URL = "http://127.0.0.1:8005"
TENANT_ID = "demo"


# ============================================================
# NORTH-EAST REGION ROUTE
# ============================================================

def optimize_route():
    """
    North-East India logistics scenario.

    Guwahati, Assam -> Imphal, Manipur

    The optimizer evaluates alternative road corridors
    using distance, duration, hazards, vehicle constraints,
    carbon and cost.
    """

    payload = {
        "objective": "Safest route",
        "vehicleType": "cold-chain-electric",

        "routes": [
            {
                "id": "NER-GHY-IMPHAL",
                "lane": "Guwahati-Imphal",

                "stops": [
                    "Guwahati",
                    "Jowai",
                    "Imphal"
                ],

                "vehicle": "cold-chain-electric",

                # Cargo
                "loadKg": 800,
                "capacityKg": 1200,

                # Baseline distance
                "baselineKm": 520,

                # Priority
                "priority": "High",

                "status": "Draft",

                # Pickup / delivery
                "pickupNode": "Guwahati",
                "deliveryNode": "Imphal",

                # Vehicle
                "vehicleAvailable": True,

                # Cold chain
                "coldChainRequired": True,
                "coldChainAvailable": True,

                # Warehouse
                "warehouseStockKg": 1200,

                # Delivery window
                "promisedDeliveryMinutes": 1080,
                "departureMinutes": 480
            }
        ],

        # ----------------------------------------------------
        # NORTH-EAST ROAD NETWORK
        #
        # These are prototype/demo hazard values.
        # Replace them with live hazard-service data later.
        # ----------------------------------------------------

        "roadNetwork": [

            # Corridor 1
            {
                "fromNode": "Guwahati",
                "toNode": "Jowai",

                "distanceKm": 180,
                "durationMin": 240,

                "closed": False,

                "floodRisk": 0.10,
                "landslideRisk": 0.08,
                "roadBlockRisk": 0.05
            },

            {
                "fromNode": "Jowai",
                "toNode": "Imphal",

                "distanceKm": 360,
                "durationMin": 420,

                "closed": False,

                "floodRisk": 0.08,
                "landslideRisk": 0.10,
                "roadBlockRisk": 0.06
            },

            # Alternative corridor
            {
                "fromNode": "Guwahati",
                "toNode": "Dimapur",

                "distanceKm": 270,
                "durationMin": 330,

                "closed": False,

                "floodRisk": 0.12,
                "landslideRisk": 0.20,
                "roadBlockRisk": 0.15
            },

            {
                "fromNode": "Dimapur",
                "toNode": "Imphal",

                "distanceKm": 210,
                "durationMin": 300,

                "closed": False,

                "floodRisk": 0.10,
                "landslideRisk": 0.25,
                "roadBlockRisk": 0.20
            }
        ]
    }

    response = requests.post(
        f"{CARBON_URL}/api/v1/routes/optimise",
        json=payload,
        headers={
            "X-Tenant-ID": TENANT_ID
        },
        timeout=30
    )

    response.raise_for_status()

    return response.json()


# ============================================================
# QWEN3
# ============================================================

def ask_qwen(route_result):

    prompt = f"""
You are StockFlow AI, a logistics optimization assistant
specialized in supply-chain movement across India's
North-East Region.

The deterministic StockFlow route optimizer produced
the following result:

{json.dumps(route_result, indent=2)}

Explain the recommendation to a logistics manager.

Focus on:

1. Recommended North-East route
2. Pickup and delivery locations
3. Distance
4. Travel duration
5. ETA
6. Delivery-window feasibility
7. Vehicle capacity
8. Vehicle availability
9. Cold-chain compatibility
10. Warehouse stock
11. Flood risk
12. Landslide risk
13. Road-block risk
14. Transport cost
15. CO2 emissions
16. Green Score
17. Route Score
18. Why this route was selected

Explain why the selected route is preferable
for North-East logistics.

Use ONLY values present in the optimizer result.

Do not invent values.

Keep the explanation professional and concise.
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": "qwen3:4b",

            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are StockFlow AI, "
                        "a North-East India logistics "
                        "optimization assistant."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            "stream": False,
            "think": False
        },

        timeout=120
    )

    response.raise_for_status()

    data = response.json()

    message = data.get("message", {})

    content = message.get("content", "")

    if content:
        return content.strip()

    if "response" in data:
        return str(data["response"]).strip()

    return "Qwen did not return an explanation."


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 65)
    print("       STOCKFLOW AI - NORTH-EAST INDIA LOGISTICS")
    print("=" * 65)

    print()
    print("Route: Guwahati, Assam -> Imphal, Manipur")
    print("Cargo: 800 kg cold-chain shipment")
    print()

    try:
        result = optimize_route()

    except requests.exceptions.ConnectionError:

        print("ERROR: StockFlow Carbon Service is not running.")
        print()
        print(
            "Start it with:"
        )
        print(
            "python -m uvicorn "
            "stockflow_carbon.main:app "
            "--host 127.0.0.1 --port 8005"
        )

        raise SystemExit(1)

    except requests.exceptions.RequestException as e:

        print("ERROR communicating with StockFlow:")
        print(e)

        raise SystemExit(1)

    # --------------------------------------------------------
    # OPTIMIZER RESULT
    # --------------------------------------------------------

    print()
    print("=" * 65)
    print("                  OPTIMIZER RESULT")
    print("=" * 65)

    print(
        json.dumps(
            result,
            indent=2
        )
    )

    # --------------------------------------------------------
    # QWEN EXPLANATION
    # --------------------------------------------------------

    print()
    print("=" * 65)
    print("                  QWEN3 EXPLANATION")
    print("=" * 65)

    try:

        explanation = ask_qwen(result)

        print()
        print(explanation)

    except requests.exceptions.ConnectionError:

        print("ERROR: Ollama is not running.")
        raise SystemExit(1)

    except requests.exceptions.RequestException as e:

        print("ERROR communicating with Qwen3:")
        print(e)

        raise SystemExit(1)

    print()
    print("=" * 65)
    print("                       COMPLETE")
    print("=" * 65)