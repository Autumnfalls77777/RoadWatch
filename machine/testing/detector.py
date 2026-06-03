"""
RoadWatch ML Service - Refactored Detector
Preserves the original PotholeDetector interface while extending it
with full image-level analysis. Model is loaded ONCE per instance.
"""
from __future__ import annotations
import logging
from pathlib import Path

import numpy as np
from ultralytics import YOLO

from config import MODEL_PATH, OUTPUT_DIR, CONFIDENCE
from schemas import AnalysisResult, BoundingBox, DetectionResult
from severity import classify_severity, get_highest_severity, build_severity_distribution
from road_health import calculate_road_health

logger = logging.getLogger(__name__)


class PotholeDetector:
    """
    Loads the YOLO model ONCE on construction.
    Exposes:
        detect(image_path)          → legacy dict (backward compat)
        analyse_image(image_path)   → AnalysisResult (rich schema)
        analyse_array(np_array)     → AnalysisResult (for video frames)
    """

    def __init__(
        self,
        model_path: str | None = None,
        output_dir: str | None = None,
        confidence: float | None = None,
    ):
        self.model_path  = model_path  or MODEL_PATH
        self.output_dir  = output_dir  or OUTPUT_DIR
        self.confidence  = confidence  if confidence is not None else CONFIDENCE
        self._model_loaded = False

        logger.info("Loading YOLO model from: %s", self.model_path)
        try:
            self.model = YOLO(self.model_path)
            self._model_loaded = True
            logger.info("Model loaded successfully.")
        except Exception as exc:
            logger.error("Failed to load model: %s", exc)
            raise

    # ─── Internal helpers ─────────────────────────────────────────────────────

    def _run_inference(self, source, save: bool = False):
        """Low-level YOLO predict call.  Always returns a list of Results."""
        return self.model.predict(
            source=source,
            conf=self.confidence,
            save=save,
            project=self.output_dir if save else None,
            name="detect" if save else None,
            verbose=False,
        )

    def _build_analysis(self, results) -> AnalysisResult:
        """Convert raw YOLO Results into a structured AnalysisResult."""
        result = results[0]
        boxes  = result.boxes

        # Image dimensions for normalising bbox area
        img_h, img_w = result.orig_shape[:2]
        image_area = img_h * img_w

        detections: list[DetectionResult] = []

        if boxes is not None and len(boxes) > 0:
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                w    = x2 - x1
                h    = y2 - y1
                area = w * h

                sev = classify_severity(area, image_area)

                detections.append(DetectionResult(
                    confidence=round(conf, 4),
                    severity=sev,
                    bounding_box=BoundingBox(
                        x1=round(x1, 2), y1=round(y1, 2),
                        x2=round(x2, 2), y2=round(y2, 2),
                        width=round(w, 2), height=round(h, 2),
                        area=round(area, 2),
                    ),
                ))

        pothole_count     = len(detections)
        severities        = [d.severity for d in detections]
        sev_dist          = build_severity_distribution(severities)
        highest_sev       = get_highest_severity(severities)
        avg_conf          = (
            round(sum(d.confidence for d in detections) / pothole_count, 4)
            if pothole_count > 0 else 0.0
        )
        health_data       = calculate_road_health(pothole_count, sev_dist, avg_conf)

        return AnalysisResult(
            pothole_count=pothole_count,
            average_confidence=avg_conf,
            highest_severity=highest_sev,
            road_health=health_data["health"],
            risk_score=health_data["risk_score"],
            severity_distribution=sev_dist,
            detections=detections,
        )

    # ─── Public API ───────────────────────────────────────────────────────────

    def detect(self, image_path: str, save: bool = True, project_name: str | None = None) -> dict:
        """
        Legacy interface – kept for backward compatibility with test.py.
        Returns a simple dict similar to the original detector.
        """
        results = self._run_inference(image_path, save=save)
        analysis = self._build_analysis(results)
        return {
            "success":   True,
            "detections": analysis.pothole_count,
            "output_path": self.output_dir,
            "boxes": [
                d.bounding_box.model_dump()
                for d in analysis.detections
            ],
        }

    def analyse_image(self, image_path: str) -> AnalysisResult:
        """Full road-analysis on a single image file or URL."""
        logger.debug("Analysing image: %s", image_path)
        results = self._run_inference(image_path, save=False)
        return self._build_analysis(results)

    def analyse_array(self, frame: np.ndarray) -> AnalysisResult:
        """Full road-analysis on an in-memory numpy frame (used by video processor)."""
        results = self._run_inference(frame, save=False)
        return self._build_analysis(results)

    @property
    def is_loaded(self) -> bool:
        return self._model_loaded


# ─── Convenience function (backward compat) ───────────────────────────────────

def detect_potholes(image_path: str, model_path=None, confidence=None, output_dir=None) -> dict:
    """Quick detection function – preserves original interface."""
    detector = PotholeDetector(model_path, output_dir, confidence)
    return detector.detect(image_path)
