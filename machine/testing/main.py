"""
RoadWatch ML Service - FastAPI Application Entry Point
"""
from __future__ import annotations
import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import MODEL_PATH, SERVICE_HOST, SERVICE_PORT
from schemas import HealthResponse, ErrorResponse
from services.detector_service import get_detector, is_model_loaded
from routes.detect import router as detect_router

# ─── Logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# ─── Lifespan: load model once at startup ────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("═══════════════════════════════════════════")
    logger.info("  RoadWatch ML Service starting up …")
    logger.info("  Model path: %s", MODEL_PATH)
    logger.info("═══════════════════════════════════════════")
    try:
        get_detector()  # Eagerly initialise singleton
        logger.info("✓ YOLO model loaded and ready.")
    except Exception as exc:
        logger.error("✗ Model failed to load: %s", exc)
        # Service continues but /health will report model_loaded=False
    yield
    logger.info("RoadWatch ML Service shutting down.")


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="RoadWatch ML Service",
    description=(
        "Production-ready pothole detection and road-health analysis microservice. "
        "Powered by YOLOv8. Designed to be called by the RoadWatch Node.js backend."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow Node.js backend (and local dev) to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global error handler ─────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(error="Internal server error", detail=str(exc)).model_dump(),
    )


# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(detect_router, tags=["Detection"])


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
    tags=["Health"],
)
def health_check():
    """
    Returns service status and whether the YOLO model is loaded.
    Use this for Docker health checks or Node.js readiness probes.
    """
    loaded = is_model_loaded()
    return HealthResponse(
        status="healthy" if loaded else "degraded",
        model_loaded=loaded,
        model_path=MODEL_PATH if loaded else None,
    )


@app.get("/", include_in_schema=False)
def root():
    return {"message": "RoadWatch ML Service is running. Visit /docs for the API."}


# ─── Dev entrypoint ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=SERVICE_HOST,
        port=SERVICE_PORT,
        reload=False,
        log_level="info",
    )
