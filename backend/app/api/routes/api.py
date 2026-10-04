"""
Master API Router for SentinelMind Vision.
Aggregates all sub-domain route controllers under versioned prefixes.
"""

from fastapi import APIRouter
from app.api.routes import (
    alerts,
    anomaly,
    auth,
    explainability,
    personnel,
    realtime_analysis,
    stress,
    vision,
)

api_router = APIRouter()

# Authentication & Session Management
api_router.include_router(auth.router)

# Personnel Management Subsystem
api_router.include_router(personnel.router)

# Stress Monitoring & Telemetry Subsystem
api_router.include_router(stress.router)

# Isolation Forest Anomaly Detection Subsystem
api_router.include_router(anomaly.router)

# SHAP Explainability Subsystem
api_router.include_router(explainability.router)

# Automated Alert Engine Subsystem
api_router.include_router(alerts.router)

# SentinelMind Vision Facial Stress & Multi-Horizon AI Subsystem
api_router.include_router(vision.router)

# Real-Time Facial Analysis Subsystem (MediaPipe, DeepFace, OpenCV)
api_router.include_router(realtime_analysis.router)
