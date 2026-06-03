"""
RoadWatch ML Service - Utility helpers
"""
from __future__ import annotations
import logging
import tempfile
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)

# Allowed MIME types / extensions
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/avi", "video/quicktime", "video/x-matroska", "video/webm"}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

# 50 MB default limit
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024


def validate_image_file(filename: str, content_type: str | None) -> None:
    """Raise ValueError if the file doesn't look like a valid image."""
    ext = Path(filename).suffix.lower()
    if ext not in IMAGE_EXTENSIONS:
        raise ValueError(
            f"Unsupported image extension '{ext}'. Allowed: {IMAGE_EXTENSIONS}"
        )


def validate_video_file(filename: str, content_type: str | None) -> None:
    """Raise ValueError if the file doesn't look like a valid video."""
    ext = Path(filename).suffix.lower()
    if ext not in VIDEO_EXTENSIONS:
        raise ValueError(
            f"Unsupported video extension '{ext}'. Allowed: {VIDEO_EXTENSIONS}"
        )


def save_upload_to_temp(file_bytes: bytes, suffix: str) -> Path:
    """
    Write upload bytes to a temporary file and return its Path.
    The caller is responsible for deleting the file when done.
    """
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        tmp.write(file_bytes)
        tmp.flush()
    finally:
        tmp.close()
    return Path(tmp.name)
