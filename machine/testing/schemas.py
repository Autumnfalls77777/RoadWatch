"""
RoadWatch ML Service - Pydantic Schemas
Strict types → clean OpenAPI docs automatically.
"""
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


# ─── Per-detection ─────────────────────────────────────────────────────────────

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float
    area: float


class DetectionResult(BaseModel):
    confidence: float = Field(..., ge=0.0, le=1.0, description="YOLO confidence score")
    severity: str     = Field(..., description="LOW | MEDIUM | HIGH | CRITICAL")
    bounding_box: BoundingBox


# ─── Image analysis ───────────────────────────────────────────────────────────

class AnalysisResult(BaseModel):
    pothole_count: int
    average_confidence: float = Field(..., ge=0.0, le=1.0)
    highest_severity: str
    road_health: int          = Field(..., ge=0, le=100, description="0 = destroyed, 100 = perfect")
    risk_score: int           = Field(..., ge=0, le=100, description="0 = safe, 100 = extreme risk")
    severity_distribution: dict[str, int]
    detections: List[DetectionResult]


class ImageAnalysisResponse(BaseModel):
    success: bool
    analysis: AnalysisResult


# ─── Video analysis ───────────────────────────────────────────────────────────

class VideoAnalysisResult(BaseModel):
    frames_processed: int
    total_potholes_detected: int
    average_confidence: float = Field(..., ge=0.0, le=1.0)
    dominant_severity: str
    road_health: int          = Field(..., ge=0, le=100)
    risk_score: int           = Field(..., ge=0, le=100)
    severity_distribution: dict[str, int]


class VideoAnalysisResponse(BaseModel):
    success: bool
    analysis: VideoAnalysisResult


# ─── Health check ─────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_path: Optional[str] = None
    version: str = "1.0.0"


# ─── Error ────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
