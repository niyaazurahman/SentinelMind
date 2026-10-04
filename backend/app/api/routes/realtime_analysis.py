"""
Real-Time Facial Analysis API Routes.
Exposes endpoints for high-throughput live frame evaluation and persistent historical auditing.
"""

from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.realtime_analysis import (
    FacialAnalysisHistoryItem,
    RealTimeFrameAnalysisRequest,
    RealTimeFrameAnalysisResponse,
)
from app.services.realtime_analysis_service import RealTimeAnalysisService

router = APIRouter(prefix="/realtime-analysis", tags=["Real-Time Facial Analysis"])


@router.post(
    "/frame",
    response_model=RealTimeFrameAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate live webcam frame for emotion, fatigue, tension, and stress",
)
async def analyze_frame(
    payload: RealTimeFrameAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
) -> RealTimeFrameAnalysisResponse:
    """
    Real-time vision analysis pipeline integrating MediaPipe Face Mesh, DeepFace emotions, and OpenCV geometry:
    - Expression: Happy, Sad, Angry, Neutral, Fear, Surprise with confidence
    - Fatigue: Eye Closure %, Blink Rate, Yawning, Head Tilt
    - Stress: Facial Tension, Fatigue Score, Attention Score, Estimated Stress Score
    - Validates face presence: Returns 'No face detected. Please look at the camera.' if absent.
    """
    service = RealTimeAnalysisService(db)
    return await service.analyze_frame(
        payload=payload,
        acting_user_id=current_user.id if current_user else None,
    )


@router.get(
    "/history",
    response_model=List[FacialAnalysisHistoryItem],
    status_code=status.HTTP_200_OK,
    summary="Retrieve chronological facial analysis history records",
)
async def get_analysis_history(
    personnel_id: Optional[uuid.UUID] = Query(None, description="Filter by specific personnel ID"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
) -> List[FacialAnalysisHistoryItem]:
    """
    Returns stored history of previous facial stress and emotion analysis results.
    """
    service = RealTimeAnalysisService(db)
    return await service.get_history(personnel_id=personnel_id, limit=limit)
