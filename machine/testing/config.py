"""
RoadWatch ML Service - Central Configuration
All configurable values read from environment variables with sensible defaults.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.resolve()

MODEL_PATH: str = os.getenv("MODEL_PATH", str(BASE_DIR / "outputs" / "best.pt"))
OUTPUT_DIR: str = os.getenv("OUTPUT_DIR", str(BASE_DIR / "runs"))

# ─── Detection ────────────────────────────────────────────────────────────────
CONFIDENCE: float = float(os.getenv("CONFIDENCE", "0.25"))

# ─── Video processing ─────────────────────────────────────────────────────────
MAX_VIDEO_FRAMES: int = int(os.getenv("MAX_VIDEO_FRAMES", "300"))
FRAME_SKIP: int = int(os.getenv("FRAME_SKIP", "5"))   # analyse every Nth frame

# ─── Image dimensions used for normalising area to a percentage ───────────────
# If the model was trained on 640×640 the default max area is 640*640 = 409600
REFERENCE_IMAGE_AREA: int = int(os.getenv("REFERENCE_IMAGE_AREA", str(640 * 640)))

# ─── Severity thresholds (bounding-box area as % of reference area) ───────────
# Values are UPPER bounds:  area% <= LOW_MAX  → LOW, etc.
SEVERITY_LOW_MAX: float    = float(os.getenv("SEVERITY_LOW_MAX",    "1.5"))
SEVERITY_MEDIUM_MAX: float = float(os.getenv("SEVERITY_MEDIUM_MAX", "4.0"))
SEVERITY_HIGH_MAX: float   = float(os.getenv("SEVERITY_HIGH_MAX",  "10.0"))
# anything above HIGH_MAX → CRITICAL

# ─── Road-health weights ──────────────────────────────────────────────────────
# How much each severity level penalises the health score (per detection)
SEVERITY_WEIGHTS: dict = {
    "LOW":      float(os.getenv("WEIGHT_LOW",      "2")),
    "MEDIUM":   float(os.getenv("WEIGHT_MEDIUM",   "5")),
    "HIGH":     float(os.getenv("WEIGHT_HIGH",    "12")),
    "CRITICAL": float(os.getenv("WEIGHT_CRITICAL","25")),
}
# Maximum total penalty before health reaches 0
MAX_PENALTY: float = float(os.getenv("MAX_PENALTY", "100"))

# ─── FastAPI service ──────────────────────────────────────────────────────────
SERVICE_HOST: str = os.getenv("SERVICE_HOST", "0.0.0.0")
SERVICE_PORT: int = int(os.getenv("SERVICE_PORT", "8000"))
