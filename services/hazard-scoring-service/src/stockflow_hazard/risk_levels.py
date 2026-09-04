def get_risk_level(score: float) -> str:
    if score < 0.34:
        return "LOW"
    elif score <= 0.66:
        return "MEDIUM"
    return "HIGH"
