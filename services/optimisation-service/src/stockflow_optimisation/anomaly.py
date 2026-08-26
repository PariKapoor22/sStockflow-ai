from __future__ import annotations

import numpy as np
from pyod.models.ecod import ECOD


def score_anomalies(rows: list[dict], contamination: float) -> dict:
    feature_names = list(rows[0]["features"])
    if any(set(row["features"]) != set(feature_names) for row in rows):
        raise ValueError("Every observation must contain the same feature names")
    matrix = np.asarray([[float(row["features"][name]) for name in feature_names] for row in rows], dtype=float)
    if not np.isfinite(matrix).all():
        raise ValueError("Anomaly features must contain only finite numbers")
    detector = ECOD(contamination=contamination)
    labels = detector.fit_predict(matrix)
    scores = detector.decision_scores_
    minimum, maximum = float(scores.min()), float(scores.max())
    spread = maximum - minimum
    normalized = np.zeros_like(scores) if spread == 0 else (scores - minimum) / spread
    observations = [{"observationId": row["observationId"], "isAnomaly": bool(labels[index]),
                     "anomalyScore": round(float(normalized[index]), 6),
                     "rawScore": round(float(scores[index]), 6)} for index, row in enumerate(rows)]
    return {"model": "PYOD_ECOD", "featureNames": feature_names, "observations": observations,
            "anomalyCount": sum(item["isAnomaly"] for item in observations), "sourceType": "MODEL"}
