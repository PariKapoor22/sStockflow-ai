from __future__ import annotations

import math
from typing import Any
from .schemas import PositionPromotionResult


# Minimum WAPE improvement required before promoting River online model over StatsForecast.
# NOTE: 0.02 (2.0% WAPE margin) is an undocumented starting placeholder chosen to prevent
# model flapping when errors are statistically indistinguishable, not an empirically tuned optimum.
PROMOTION_WAPE_IMPROVEMENT_THRESHOLD: float = 0.02

# Drift alert threshold: if online error exceeds 2.5x the running RMSE, flag drift
DRIFT_ALERT_SIGMA_MULTIPLIER: float = 2.5


def evaluate_promotion(
    warehouse_id: str,
    sku_id: str,
    river_actuals: list[float],
    river_predictions: list[float],
    statsforecast_wape: float,
    threshold: float = PROMOTION_WAPE_IMPROVEMENT_THRESHOLD,
) -> PositionPromotionResult:
    """
    Compares River online challenger against StatsForecast validated candidate
    using WAPE. Promotes River only if its WAPE is lower than StatsForecast by at least threshold.
    """
    if len(river_actuals) != len(river_predictions) or not river_actuals:
        return PositionPromotionResult(
            warehouseId=warehouse_id,
            skuId=sku_id,
            riverWape=100.0,
            statsforecastWape=round(float(statsforecast_wape), 4),
            wapeDifference=0.0,
            promoted=False,
            reason="Insufficient backtest observations for River",
        )

    abs_errors = [abs(p - a) for p, a in zip(river_predictions, river_actuals)]
    total_actual = sum(abs(a) for a in river_actuals)
    total_error = sum(abs_errors)

    river_wape = (total_error / total_actual * 100.0) if total_actual > 0 else (total_error * 10.0)
    river_wape = round(float(river_wape), 4)
    sf_wape = round(float(statsforecast_wape), 4)

    # Difference: positive means River is better (lower WAPE)
    wape_improvement = sf_wape - river_wape
    threshold_pct = threshold * 100.0

    if wape_improvement >= threshold_pct:
        promoted = True
        reason = (
            f"River promoted: WAPE {river_wape:.2f}% is better than StatsForecast {sf_wape:.2f}% "
            f"by {wape_improvement:.2f}% (>= {threshold_pct:.2f}% threshold)"
        )
    else:
        promoted = False
        reason = (
            f"River not promoted: WAPE improvement {wape_improvement:.2f}% did not satisfy "
            f"the required {threshold_pct:.2f}% margin over StatsForecast {sf_wape:.2f}%"
        )

    return PositionPromotionResult(
        warehouseId=warehouse_id,
        skuId=sku_id,
        riverWape=river_wape,
        statsforecastWape=sf_wape,
        wapeDifference=round(wape_improvement, 4),
        promoted=promoted,
        reason=reason,
    )


def check_drift_alert(latest_error: float, running_rmse: float) -> tuple[bool, str | None]:
    """
    Detects sudden prediction error spikes indicating distribution drift.
    """
    limit = running_rmse * DRIFT_ALERT_SIGMA_MULTIPLIER
    if abs(latest_error) > limit and running_rmse > 0:
        return True, f"Drift Alert: latest error ({latest_error:.2f}) exceeds {DRIFT_ALERT_SIGMA_MULTIPLIER}x RMSE ({limit:.2f})"
    return False, None
