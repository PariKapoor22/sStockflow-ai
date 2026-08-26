import json
import requests


# ============================================================
# STOCKFLOW AI - NORTH-EAST INDIA LOGISTICS
# ============================================================

OLLAMA_URL = "http://localhost:11434/api/chat"
CARBON_URL = "http://127.0.0.1:8005"
TENANT_ID = "demo"


# ============================================================
# ROUTE OPTIMIZATION
# ============================================================

def optimize_route():

    payload = {
        "objective": "Safest route",
        "vehicleType": "cold-chain-electric",

        "routes": [

            # ------------------------------------------------
            # ROUTE 1: GUWAHATI -> JOWAI -> IMPHAL
            # ------------------------------------------------
            {
                "id": "NER-GHY-JOWAI-IMPHAL",

                "lane": "Guwahati-Imphal",

                "stops": [
                    "Guwahati",
                    "Jowai",
                    "Imphal"
                ],

                "vehicle": "cold-chain-electric",

                "loadKg": 800,
                "capacityKg": 1200,

                "baselineKm": 540,

                "priority": "High",

                "status": "Draft",

                "pickupNode": "Guwahati",
                "deliveryNode": "Imphal",

                "vehicleAvailable": True,

                "coldChainRequired": True,
                "coldChainAvailable": True,

                "warehouseStockKg": 1200,

                # 08:00 departure
                # Delivery promised by 20:00
                "promisedDeliveryMinutes": 1200,
                "departureMinutes": 480
            },


            # ------------------------------------------------
            # ROUTE 2: GUWAHATI -> DIMAPUR -> IMPHAL
            # ------------------------------------------------
            {
                "id": "NER-GHY-DIMAPUR-IMPHAL",

                "lane": "Guwahati-Imphal",

                "stops": [
                    "Guwahati",
                    "Dimapur",
                    "Imphal"
                ],

                "vehicle": "cold-chain-electric",

                "loadKg": 800,
                "capacityKg": 1200,

                "baselineKm": 500,

                "priority": "High",

                "status": "Draft",

                "pickupNode": "Guwahati",
                "deliveryNode": "Imphal",

                "vehicleAvailable": True,

                "coldChainRequired": True,
                "coldChainAvailable": True,

                "warehouseStockKg": 1200,

                "promisedDeliveryMinutes": 1200,
                "departureMinutes": 480
            }
        ],


        # ====================================================
        # NORTH-EAST ROAD NETWORK
        #
        # Prototype hazard values.
        # These can later be replaced by live hazard data.
        # ====================================================

        "roadNetwork": [

            # ------------------------------------------------
            # GUWAHATI -> JOWAI
            # ------------------------------------------------
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


            # ------------------------------------------------
            # JOWAI -> IMPHAL
            # ------------------------------------------------
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


            # ------------------------------------------------
            # GUWAHATI -> DIMAPUR
            # ------------------------------------------------
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


            # ------------------------------------------------
            # DIMAPUR -> IMPHAL
            # ------------------------------------------------
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


    # ========================================================
    # CALL STOCKFLOW OPTIMIZER
    # ========================================================

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
# QWEN3 EXPLANATION
# ============================================================

def ask_qwen(route_result):

    prompt = f"""
You are StockFlow AI, a logistics optimization assistant
for supply-chain movement in India's North-East Region.

The deterministic StockFlow route optimizer produced this
result:

{json.dumps(route_result, indent=2)}

Explain the result to a logistics manager.

Cover these points:

1. Recommended North-East route
2. Pickup location
3. Delivery location
4. Distance
5. Travel duration
6. ETA
7. Delivery-window feasibility
8. Vehicle payload capacity
9. Vehicle availability
10. Cold-chain requirement and compatibility
11. Warehouse stock availability
12. Flood risk
13. Landslide risk
14. Road-block risk
15. Transport cost
16. CO2 emissions
17. Green Score
18. Route Score
19. Why the route was selected

Compare rejected routes if they exist.

Explain how the optimizer balances safety,
delivery feasibility, cost and sustainability.

IMPORTANT:

- Use ONLY values present in the optimizer result.
- Do NOT invent missing values.
- If a value is missing, say "Not provided".
- If bestRoute is null, clearly state that no feasible
  route was selected.
- Mention that the route requires human approval
  before dispatch.

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
                        "a professional North-East India "
                        "logistics optimization assistant."
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

    return "Qwen3 did not return an explanation."


# ============================================================
# MAIN PROGRAM
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 70)
    print("       STOCKFLOW AI - NORTH-EAST INDIA LOGISTICS")
    print("=" * 70)

    print()
    print("Origin      : Guwahati, Assam")
    print("Destination : Imphal, Manipur")
    print("Cargo       : 800 kg")
    print("Priority    : High")
    print("Vehicle     : Cold-chain electric")
    print("Departure   : 08:00")
    print("Deadline    : 20:00")
    print()

    # --------------------------------------------------------
    # RUN OPTIMIZER
    # --------------------------------------------------------

    try:

        result = optimize_route()

    except requests.exceptions.ConnectionError:

        print()
        print("ERROR: StockFlow Carbon Service is not running.")
        print()
        print("Start it using:")
        print()
        print(
            "python -m uvicorn "
            "stockflow_carbon.main:app "
            "--host 127.0.0.1 --port 8005"
        )

        raise SystemExit(1)

    except requests.exceptions.RequestException as error:

        print()
        print("ERROR communicating with StockFlow:")
        print(error)

        raise SystemExit(1)


    # --------------------------------------------------------
    # DISPLAY OPTIMIZER RESULT
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("                    OPTIMIZER RESULT")
    print("=" * 70)
    print()

    print(
        json.dumps(
            result,
            indent=2
        )
    )


    # --------------------------------------------------------
    # DISPLAY BEST ROUTE
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("                     ROUTE SUMMARY")
    print("=" * 70)

    best_route_id = result.get("bestRoute")

    if best_route_id:

        print()
        print(f"Best Route : {best_route_id}")

        routes = result.get("routes", [])

        for route in routes:

            if route.get("id") == best_route_id:

                print(
                    f"Route      : "
                    f"{' -> '.join(route.get('routeNodes', []))}"
                )

                print(
                    f"Distance   : "
                    f"{route.get('optimizedKm', 'Not provided')} km"
                )

                print(
                    f"Duration   : "
                    f"{route.get('duration', 'Not provided')}"
                )

                print(
                    f"ETA        : "
                    f"{route.get('eta', 'Not provided')}"
                )

                print(
                    f"Cost       : "
                    f"₹{route.get('costInr', 'Not provided')}"
                )

                print(
                    f"CO2        : "
                    f"{route.get('co2Kg', 'Not provided')} kg"
                )

                print(
                    f"Risk       : "
                    f"{route.get('riskPenalty', 'Not provided')}"
                )

                print(
                    f"Green Score: "
                    f"{route.get('greenScore', 'Not provided')}"
                )

                print(
                    f"Route Score: "
                    f"{route.get('routeScore', 'Not provided')}"
                )

                break

    else:

        print()
        print("No feasible route was selected.")


    # --------------------------------------------------------
    # QWEN3 EXPLANATION
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("                    QWEN3 EXPLANATION")
    print("=" * 70)
    print()

    try:

        explanation = ask_qwen(result)

        print(explanation)

    except requests.exceptions.ConnectionError:

        print("ERROR: Ollama is not running.")
        print()
        print("Start Ollama and make sure Qwen3 is installed:")
        print()
        print("ollama list")

        raise SystemExit(1)

    except requests.exceptions.RequestException as error:

        print()
        print("ERROR communicating with Qwen3:")
        print(error)

        raise SystemExit(1)


    # --------------------------------------------------------
    # COMPLETE
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("                         COMPLETE")
    print("=" * 70)