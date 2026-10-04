"""
Stress Monitoring API Routes.
Exposes endpoints to record and analyze Sleep Hours, HRV, Resting Heart Rate,
Duty Hours, Mood Score, and Stress Score.
"""

from datetime import datetime
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import (
    get_current_user,
    require_any_officer,
    require_personnel,
)
from app.core.database import get_db
from app.models.user import User
from app.schemas.stress import (
    StressAnalyticsSummary,
    StressLogBatchCreate,
    StressLogCreate,
    StressLogRead,
    StressPaginatedResponse,
)
from app.services.stress_service import StressService

router = APIRouter(prefix="/stress", tags=["Stress Monitoring & Telemetry"])


@router.post(
    "/logs",
    response_model=StressLogRead,
    status_code=status.HTTP_201_CREATED,
    summary="Record a stress log entry (Sleep, HRV, RHR, Duty, Mood, Stress Score)",
)
async def record_stress_log(
    payload: StressLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StressLogRead:
    """
    Ingests an individual stress monitoring record containing:
    - Sleep Hours (0.0 to 24.0)
    - HRV RMSSD (5.0 to 300.0 ms)
    - Resting Heart Rate (30 to 220 BPM)
    - Duty Hours (0.0 to 24.0)
    - Mood Score (1 to 10)
    - Stress Score (0.00 to 100.00)
    """
    # If standard personnel, ensure they are submitting for themselves
    user_role = current_user.role.role_code if current_user.role else ""
    if user_role == "PERSONNEL":
        if not current_user.personnel_id or current_user.personnel_id != payload.personnel_id:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Personnel may only submit telemetry logs for their own profile.",
            )

    service = StressService(db)
    return await service.create_stress_log(payload)


@router.post(
    "/logs/batch",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Batch upload telemetry readings from wearable device synchronization",
)
async def record_stress_batch(
    payload: StressLogBatchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingests multiple timestamped telemetry readings synchronized from field wearables or sleep monitors.
    """
    user_role = current_user.role.role_code if current_user.role else ""
    if user_role == "PERSONNEL":
        if not current_user.personnel_id or current_user.personnel_id != payload.personnel_id:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Personnel may only synchronize wearable data for their own profile.",
            )

    service = StressService(db)
    count = await service.create_stress_batch(payload)
    return {
        "status": "ACCEPTED",
        "records_ingested": count,
        "personnel_id": str(payload.personnel_id),
    }


@router.get(
    "/logs/{log_id}",
    response_model=StressLogRead,
    summary="Retrieve details of a specific stress log by UUID",
)
async def get_stress_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StressLogRead:
    """
    Retrieves a single stress telemetry entry.
    """
    service = StressService(db)
    log = await service.get_stress_log_by_id(log_id)

    user_role = current_user.role.role_code if current_user.role else ""
    if user_role == "PERSONNEL":
        if not current_user.personnel_id or current_user.personnel_id != log.personnel_id:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Personnel may only view their own stress records.",
            )

    return log


@router.get(
    "/personnel/{personnel_id}",
    response_model=StressPaginatedResponse,
    summary="Get historical stress logs for a specific service member",
)
async def get_personnel_stress_history(
    personnel_id: uuid.UUID,
    start_date: Optional[datetime] = Query(None, description="Filter records from date (ISO-8601)"),
    end_date: Optional[datetime] = Query(None, description="Filter records to date (ISO-8601)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StressPaginatedResponse:
    """
    Retrieves chronological stress logs, vitals, and mood scores for a service member.
    """
    user_role = current_user.role.role_code if current_user.role else ""
    if user_role == "PERSONNEL":
        if not current_user.personnel_id or current_user.personnel_id != personnel_id:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Personnel may only view their own stress history.",
            )

    service = StressService(db)
    return await service.get_personnel_stress_history(
        personnel_id=personnel_id,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/personnel/{personnel_id}/analytics",
    response_model=StressAnalyticsSummary,
    summary="Get aggregated vitals, average sleep, sleep debt, and stress trends",
)
async def get_personnel_stress_analytics(
    personnel_id: uuid.UUID,
    days: int = Query(7, ge=1, le=90, description="Rolling timeframe window in days (default: 7)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StressAnalyticsSummary:
    """
    Calculates operational health indicators:
    - Average Sleep Hours & Accumulated Sleep Debt
    - Average Heart Rate Variability (HRV) and % deviation from baseline
    - Average Resting Heart Rate
    - Total Shift Duty Hours
    - Mean Mood & Mean Stress Scores
    """
    user_role = current_user.role.role_code if current_user.role else ""
    if user_role == "PERSONNEL":
        if not current_user.personnel_id or current_user.personnel_id != personnel_id:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Personnel may only view their own analytics summary.",
            )

    service = StressService(db)
    return await service.get_personnel_analytics(personnel_id=personnel_id, days=days)
