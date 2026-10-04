"""
Anomaly Detection API Routes.
Exposes endpoints to detect acute Sleep Drop, HRV Collapse, Mood Crash,
and Extreme Duty Hours using Isolation Forest.
"""

from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import (
    get_current_user,
    require_any_officer,
    require_welfare_officer,
)
from app.core.database import get_db
from app.models.user import User
from app.schemas.anomaly import (
    AnomalyEvaluationRequest,
    AnomalyEvaluationResponse,
    PersonnelAnomalyRecord,
)
from app.services.anomaly_service import AnomalyService

router = APIRouter(prefix="/anomaly", tags=["Isolation Forest Anomaly Detection"])


@router.post(
    "/detect",
    response_model=AnomalyEvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate telemetry reading for Sleep Drop, HRV Collapse, Mood Crash, and Duty Overload",
)
async def detect_anomaly(
    payload: AnomalyEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnomalyEvaluationResponse:
    """
    Evaluates multi-variate metrics using an unsupervised Isolation Forest model.
    Flags acute breakdown signatures:
    - SLEEP_DROP: Critical deficit (< 3.8h)
    - HRV_COLLAPSE: Parasympathetic crash (< 22ms or > 35% baseline drop)
    - MOOD_CRASH: Psychological morale drop (<= 2)
    - EXTREME_DUTY_HOURS: Dangerous operational shift (>= 14.5h)
    """
    service = AnomalyService(db)
    return await service.evaluate_reading(payload)


@router.get(
    "/personnel/{personnel_id}/latest",
    response_model=PersonnelAnomalyRecord,
    summary="Evaluate latest telemetry of a service member against personal baselines",
)
async def evaluate_personnel_latest_anomaly(
    personnel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PersonnelAnomalyRecord:
    """
    Pulls the latest logged telemetry for a service member, compares against
    their personal 30-day baseline HRV and sleep target, and executes anomaly scoring.
    """
    user_role = current_user.role.role_code if current_user.role else ""
    if user_role == "PERSONNEL":
        if not current_user.personnel_id or current_user.personnel_id != personnel_id:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Personnel may only view their own anomaly evaluations.",
            )

    service = AnomalyService(db)
    return await service.evaluate_personnel_latest(personnel_id)


@router.get(
    "/unit/{unit_id}/triage",
    response_model=List[PersonnelAnomalyRecord],
    summary="Scan an entire unit and retrieve all personnel with active anomalies",
)
async def triage_unit_anomalies(
    unit_id: uuid.UUID,
    current_user: User = Depends(require_any_officer),
    db: AsyncSession = Depends(get_db),
) -> List[PersonnelAnomalyRecord]:
    """
    Performs high-priority triage scan over all active service members in an operational unit.
    Returns only personnel flagged with active anomalies for rapid medical or command intervention.
    """
    service = AnomalyService(db)
    return await service.scan_unit_anomalies(unit_id)
