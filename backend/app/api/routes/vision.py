"""
SentinelMind Vision API Routes.
Exposes endpoints for facial analysis ingestion, self-assessment,
duty monitoring, multi-horizon risk predictions, and interventions.
"""

from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import (
    get_current_user,
    require_any_officer,
    require_welfare_officer,
)
from app.core.database import get_db
from app.models.user import User
from app.schemas.vision import (
    ComprehensiveAssessmentRequest,
    ComprehensiveAssessmentResponse,
)
from app.services.vision_service import VisionService

router = APIRouter(prefix="/vision", tags=["SentinelMind Vision Facial Analysis"])


@router.post(
    "/comprehensive-assessment",
    response_model=ComprehensiveAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Process multi-modal facial scan, self-assessment, and duty hours",
)
async def process_comprehensive_assessment(
    payload: ComprehensiveAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ComprehensiveAssessmentResponse:
    """
    Ingests live computer vision facial stress indicators, self-reported mood/sleep,
    and duty hours. Executes:
    - XGBoost multi-horizon risk forecasting (Current, 7-Day, 30-Day)
    - Isolation Forest anomaly detection (Fatigue spikes, Sleep collapse, Emotional changes)
    - SHAP feature importance decomposition (e.g. Poor Sleep +35%, Low Mood +25%)
    - Automatic PostgreSQL Alert creation (Green 0-30, Amber 31-60, Red 61-100)
    - Automated clinical & welfare intervention generation
    """
    service = VisionService(db)
    return await service.process_comprehensive_assessment(
        payload=payload,
        acting_user_id=current_user.id,
    )
