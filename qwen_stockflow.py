import json
import requests


# ============================================================
# CONFIGURATION
# ============================================================

OLLAMA_URL = "http://localhost:11434/api/chat"
CARBON_URL = "http://127.0.0.1:8005"
TENANT_ID = "demo"


# ============================================================
# STOCKFLOW ROUTE OPTIMIZER
# ============================================================

def optimize_route():
    """
    Sends a logistics route request to the
    StockFlow deterministic route optimizer.
    """

    payload = {
        "objective": "Safest route",
        "vehicleType": "cold-chain-electric",

        "routes": [
            {
                "id": "QWEN-R1",
                "lane": "Chennai-Coimbatore",
                "stops": [
                    "A",
                    "C",
                    "D"
                ],

                "vehicle": "cold-chain-electric",

                # Vehicle payload
                "loadKg": 800,
                "capacityKg": 1200,

                # Distance
                "baselineKm": 520,

                # Priority
                "priority": "High",

                "status": "Draft",

                # Pickup / delivery
                "pickupNode": "A",
                "deliveryNode": "D",

                # Vehicle availability
                "vehicleAvailable": True,

                # Cold chain
                "coldChainRequired": True,
                "coldChainAvailable": True,

                # Warehouse stock
                "warehouseStockKg": 1200,

                # Delivery window
                "promisedDeliveryMinutes": 1080,
                "departureMinutes": 480
            }
        ],

        # Road network used by Dijkstra
        "roadNetwork": [
            {
                "fromNode": "A",
                "toNode": "C",
                "distanceKm": 230,
                "durationMin": 260,
                "closed": False,
                "floodRisk": 0.05,
                "landslideRisk": 0.05,
                "roadBlockRisk": 0.05
            },
            {
                "fromNode": "C",
                "toNode": "D",
                "distanceKm": 290,
                "durationMin": 280,
                "closed": False,
                "floodRisk": 0.05,
                "landslideRisk": 0.05,
                "roadBlockRisk": 0.05
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
# QWEN3 EXPLANATION
# ============================================================

def ask_qwen(route_result):
    """
    Sends the deterministic optimizer result
    to Qwen3 for a human-readable explanation.
    """

    prompt = f"""
You are StockFlow AI, a logistics optimization assistant.

The StockFlow deterministic route optimizer produced
the following result:

{json.dumps(route_result, indent=2)}

Explain the result to a logistics manager.

Include:

1. Recommended route
2. Pickup and delivery locations
3. Distance
4. Travel duration
5. ETA
6. Delivery window feasibility
7. Transport cost
8. CO2 emissions
9. Risk
10. Green Score
11. Capacity utilization
12. Vehicle availability
13. Cold-chain compatibility
14. Warehouse stock
15. Why this route was selected

Use ONLY values present in the optimizer result.

Do not invent values.

Keep the explanation concise and professional.
"""

    payload = {
        "model": "qwen3:4b",

        "messages": [
            {
                "role": "system",
                "content": (
                    "You are StockFlow AI. "
                    "Give concise, factual logistics explanations."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],

        "stream": False,

        # Disable Qwen thinking output so that
        # the final answer is returned directly.
        "think": False
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=120
    )

    response.raise_for_status()

    data = response.json()

    # Normal Ollama response
    message = data.get("message", {})

    content = message.get("content", "")

    if content:
        return content.strip()

    # Fallback in case content is returned elsewhere
    if "response" in data:
        return str(data["response"]).strip()

    return "Qwen did not return an explanation."


# ============================================================
# MAIN PROGRAM
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("        STOCKFLOW AI - ROUTE OPTIMIZATION")
    print("=" * 60)

    print()
    print("Running deterministic route optimizer...")
    print()

    try:
        result = optimize_route()

    except requests.exceptions.ConnectionError:
        print()
        print("ERROR: StockFlow Carbon Service is not running.")
        print()
        print("Start it with:")
        print(
            "python -m uvicorn "
            "stockflow_carbon.main:app "
            "--host 127.0.0.1 --port 8005"
        )
        raise SystemExit(1)

    except requests.exceptions.RequestException as e:
        print()
        print("ERROR communicating with StockFlow:")
        print(e)
        raise SystemExit(1)

    # --------------------------------------------------------
    # OPTIMIZER RESULT
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("             OPTIMIZER RESULT")
    print("=" * 60)

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
    print("=" * 60)
    print("             QWEN3 EXPLANATION")
    print("=" * 60)

    try:
        explanation = ask_qwen(result)

        print()
        print(explanation)

    except requests.exceptions.ConnectionError:
        print()
        print("ERROR: Ollama is not running.")
        print()
        print("Start Ollama and make sure Qwen3 is available:")
        print("ollama list")
        raise SystemExit(1)

    except requests.exceptions.RequestException as e:
        print()
        print("ERROR communicating with Qwen3:")
        print(e)
        raise SystemExit(1)

    print()
    print("=" * 60)
    print("                  COMPLETE")
    print("=" * 60)