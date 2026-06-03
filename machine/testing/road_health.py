"""
RoadWatch ML Service - Road Health Engine
Converts raw detections into a 0-100 road health score and 0-100 risk score.

Health formula
--------------
    penalty  = Σ (weight[severity_i] * confidence_i)
    health   = clamp(100 - (penalty / MAX_PENALTY * 100), 0, 100)

Risk score
----------
    risk = 100 - health   (simple complement; kept separate for future tuning)
"""
from __future__ import annotations
import math
from config import SEVERITY_WEIGHTS, MAX_PENALTY
from severity import SEVERITY_ORDER


def calculate_road_health(
    pothole_count: int,
    severity_distribution: dict[str, int],
    average_confidence: float,
) -> dict[str, int]:
    """
    Calculate road health and risk scores.

    Args:
        pothole_count:          Total number of potholes detected.
        severity_distribution:  {severity_label: count} mapping.
        average_confidence:     Mean YOLO confidence across all detections (0-1).

    Returns:
        {"health": 0-100, "risk_score": 0-100}
    """
    if pothole_count == 0:
        return {"health": 100, "risk_score": 0}

    # Confidence boosts the penalty – uncertain detections have less impact
    conf_factor = max(0.5, min(1.0, average_confidence))

    penalty = 0.0
    for severity, count in severity_distribution.items():
        weight = SEVERITY_WEIGHTS.get(severity, 0)
        penalty += weight * count * conf_factor

    # Normalise to 0-100 range
    health_raw = 100.0 - (penalty / MAX_PENALTY * 100.0)
    health = int(round(max(0.0, min(100.0, health_raw))))
    risk   = 100 - health

    return {"health": health, "risk_score": risk}


def get_dominant_severity(severity_distribution: dict[str, int]) -> str:
    """
    Return the most-frequent severity level, breaking ties by severity order.
    """
    if not severity_distribution or sum(severity_distribution.values()) == 0:
        return "LOW"

    max_count = max(severity_distribution.values())
    # Among severities that share the max count, pick the most severe
    candidates = [s for s, c in severity_distribution.items() if c == max_count]
    candidates.sort(key=lambda s: SEVERITY_ORDER.index(s), reverse=True)
    return candidates[0]
