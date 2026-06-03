"""
RoadWatch ML Service - Video Processor
Samples frames from a video file, runs detection on each,
and aggregates results across the whole clip.
"""
from __future__ import annotations
import logging
import tempfile
from pathlib import Path

import cv2
import numpy as np

from config import MAX_VIDEO_FRAMES, FRAME_SKIP
from schemas import VideoAnalysisResult
from severity import build_severity_distribution, SEVERITY_ORDER
from road_health import calculate_road_health, get_dominant_severity

logger = logging.getLogger(__name__)


def process_video(video_path: str, detector) -> VideoAnalysisResult:
    """
    Analyse a video file by sampling every FRAME_SKIP-th frame up to
    MAX_VIDEO_FRAMES frames.

    Args:
        video_path: Absolute path to the video file.
        detector:   A loaded PotholeDetector instance.

    Returns:
        VideoAnalysisResult with aggregated statistics.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    total_frames  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps           = cap.get(cv2.CAP_PROP_FPS) or 30
    logger.info(
        "Video: %s  |  total_frames=%d  fps=%.1f",
        Path(video_path).name, total_frames, fps
    )

    frames_processed   = 0
    all_confidences: list[float] = []
    all_severities: list[str]   = []
    frame_idx = 0

    try:
        while cap.isOpened() and frames_processed < MAX_VIDEO_FRAMES:
            ret, frame = cap.read()
            if not ret:
                break

            # Only process every FRAME_SKIP-th frame
            if frame_idx % FRAME_SKIP == 0:
                try:
                    analysis = detector.analyse_array(frame)
                    frames_processed += 1

                    all_confidences.extend(
                        d.confidence for d in analysis.detections
                    )
                    all_severities.extend(
                        d.severity for d in analysis.detections
                    )
                except Exception as exc:
                    logger.warning("Frame %d skipped due to error: %s", frame_idx, exc)

            frame_idx += 1
    finally:
        cap.release()

    logger.info(
        "Processed %d frames, detected %d total potholes.",
        frames_processed, len(all_severities),
    )

    # ─── Aggregate ────────────────────────────────────────────────────────────
    total_potholes = len(all_severities)
    avg_conf       = round(sum(all_confidences) / total_potholes, 4) if total_potholes > 0 else 0.0
    sev_dist       = build_severity_distribution(all_severities)
    dominant_sev   = get_dominant_severity(sev_dist)
    health_data    = calculate_road_health(total_potholes, sev_dist, avg_conf)

    return VideoAnalysisResult(
        frames_processed=frames_processed,
        total_potholes_detected=total_potholes,
        average_confidence=avg_conf,
        dominant_severity=dominant_sev,
        road_health=health_data["health"],
        risk_score=health_data["risk_score"],
        severity_distribution=sev_dist,
    )
