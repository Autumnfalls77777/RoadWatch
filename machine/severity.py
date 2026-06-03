"""
RoadWatch ML Service - Severity Engine
Classifies individual pothole detections based on bounding-box area.
"""
from __future__ import annotations
from config import (
    REFERENCE_IMAGE_AREA,
    SEVERITY_LOW_MAX,
    SEVERITY_MEDIUM_MAX,
    SEVERITY_HIGH_MAX,
)

# Severity level constants (exported for other modules)
SEVERITY_LOW      = "LOW"
SEVERITY_MEDIUM   = "MEDIUM"
SEVERITY_HIGH     = "HIGH"
SEVERITY_CRITICAL = "CRITICAL"

SEVERITY_ORDER = [SEVERITY_LOW, SEVERITY_MEDIUM, SEVERITY_HIGH, SEVERITY_CRITICAL]


def classify_severity(bbox_area: float, image_area: float | None = None) -> str:
    """
    Classify a pothole detection's severity from its bounding-box area.

    Args:
        bbox_area:  width × height of the bounding box in pixels.
        image_area: total image area in pixels.  Falls back to the configured
                    REFERENCE_IMAGE_AREA when not provided.

    Returns:
        One of "LOW", "MEDIUM", "HIGH", "CRITICAL".
    """
    ref = image_area if image_area and image_area > 0 else REFERENCE_IMAGE_AREA
    area_pct = (bbox_area / ref) * 100.0

    if area_pct <= SEVERITY_LOW_MAX:
        return SEVERITY_LOW
    if area_pct <= SEVERITY_MEDIUM_MAX:
        return SEVERITY_MEDIUM
    if area_pct <= SEVERITY_HIGH_MAX:
        return SEVERITY_HIGH
    return SEVERITY_CRITICAL


def get_highest_severity(severities: list[str]) -> str:
    """
    Return the most severe level found in a list of severity strings.
    Returns "LOW" for an empty list.
    """
    if not severities:
        return SEVERITY_LOW
    max_idx = max(SEVERITY_ORDER.index(s) for s in severities)
    return SEVERITY_ORDER[max_idx]


def build_severity_distribution(severities: list[str]) -> dict[str, int]:
    """
    Count occurrences of each severity level.
    Always returns all four keys (counts default to 0).
    """
    dist: dict[str, int] = {s: 0 for s in SEVERITY_ORDER}
    for s in severities:
        if s in dist:
            dist[s] += 1
    return dist
