"""
RoadWatch ML Service - Detector Service (Singleton)
The YOLO model is loaded once at startup and reused for every request.
"""
from __future__ import annotations
import logging
from detector import PotholeDetector
from config import MODEL_PATH, CONFIDENCE

logger = logging.getLogger(__name__)

_detector_instance: PotholeDetector | None = None


def get_detector() -> PotholeDetector:
    """
    Return the singleton PotholeDetector, creating it on first call.
    Raises RuntimeError if the model fails to load.
    """
    global _detector_instance
    if _detector_instance is None:
        logger.info("Initialising detector singleton …")
        _detector_instance = PotholeDetector(
            model_path=MODEL_PATH,
            confidence=CONFIDENCE,
        )
    return _detector_instance


def is_model_loaded() -> bool:
    """Check whether the singleton detector has been initialised."""
    return _detector_instance is not None and _detector_instance.is_loaded
