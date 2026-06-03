"""
RoadWatch ML Service - Detection Routes
Handles POST /detect-image and POST /detect-video
"""
from __future__ import annotations
import logging
import os
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from services.detector_service import get_detector
from schemas import ImageAnalysisResponse, VideoAnalysisResponse, ErrorResponse
from video_processor import process_video
from utils.file_utils import (
    validate_image_file,
    validate_video_file,
    save_upload_to_temp,
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ─── POST /detect-image ───────────────────────────────────────────────────────

@router.post(
    "/detect-image",
    response_model=ImageAnalysisResponse,
    summary="Analyse a road image for potholes",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def detect_image(file: UploadFile = File(..., description="Road image (JPEG/PNG/WEBP)")):
    """
    Upload a road image and receive a full road-health analysis including:
    - Pothole count & individual detection details
    - Severity classification per detection (LOW / MEDIUM / HIGH / CRITICAL)
    - Overall road health score (0-100)
    - Risk score (0-100)
    """
    logger.info("POST /detect-image  filename=%s  content_type=%s", file.filename, file.content_type)

    # ─ Validate ──────────────────────────────────────────────────────────────
    try:
        validate_image_file(file.filename or "", file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # ─ Read & write to temp ──────────────────────────────────────────────────
    raw = await file.read()
    suffix = Path(file.filename or "image.jpg").suffix or ".jpg"
    tmp_path = save_upload_to_temp(raw, suffix)

    try:
        detector = get_detector()
        analysis = detector.analyse_image(str(tmp_path))
    except Exception as exc:
        logger.error("Detection failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Detection error: {exc}")
    finally:
        tmp_path.unlink(missing_ok=True)

    logger.info(
        "Image result: potholes=%d  health=%d  risk=%d",
        analysis.pothole_count, analysis.road_health, analysis.risk_score,
    )
    return ImageAnalysisResponse(success=True, analysis=analysis)


# ─── POST /detect-video ───────────────────────────────────────────────────────

@router.post(
    "/detect-video",
    response_model=VideoAnalysisResponse,
    summary="Analyse a road video for potholes",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def detect_video(file: UploadFile = File(..., description="Road video (MP4/AVI/MOV)")):
    """
    Upload a road video and receive aggregated road-health analysis across
    sampled frames:
    - Total potholes detected
    - Average confidence
    - Dominant severity
    - Road health & risk scores
    """
    logger.info("POST /detect-video  filename=%s  content_type=%s", file.filename, file.content_type)

    # ─ Validate ──────────────────────────────────────────────────────────────
    try:
        validate_video_file(file.filename or "", file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # ─ Read & write to temp ──────────────────────────────────────────────────
    raw = await file.read()
    suffix = Path(file.filename or "video.mp4").suffix or ".mp4"
    tmp_path = save_upload_to_temp(raw, suffix)

    try:
        detector = get_detector()
        result   = process_video(str(tmp_path), detector)
    except Exception as exc:
        logger.error("Video processing failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Video processing error: {exc}")
    finally:
        tmp_path.unlink(missing_ok=True)

    logger.info(
        "Video result: frames=%d  potholes=%d  health=%d  risk=%d",
        result.frames_processed, result.total_potholes_detected,
        result.road_health, result.risk_score,
    )
    return VideoAnalysisResponse(success=True, analysis=result)
