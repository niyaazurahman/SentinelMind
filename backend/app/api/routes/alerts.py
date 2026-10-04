"""
Alert Engine API Routes.
Exposes endpoints to view, triage, acknowledge, and resolve alerts stored in PostgreSQL.

Rules:
- 0-30:   GREEN
- 31-60:  AMBER
- 61-100: RED
"""

from decimal import Decimal
from typing import Optional
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
from app.schemas.alert import (
    AlertAcknowledgeRequest,
    AlertPaginatedResponse,
    AlertRead,
    AlertResolveRequest,
    AlertSummaryStats,
)
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Automated Alert Engine"])


@router.get(
    "",
    response_model=AlertPaginatedResponse,
    summary="List and filter alerts stored in PostgreSQL (GREEN, AMBER, RED)",
)
async def list_alerts(
    tier: Optional[str] = Query(None, description="Filter by tier: GREEN, AMBER, RED"),
    status_filter: Optional[str] = Query(None, description="Filter by status: NEW, ACKNOWLEDGED, RESOLVED"),
    unit_id: Optional[uuid.UUID] = Query(None, description="Filter by operational unit UUID"),
    personnel_id: Optional[uuid.UUID] = Query(None, description="Filter by service member UUID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page"),
    current_user: User = Depends(require_any_officer),
    db: AsyncSession = Depends(get_db),
) -> AlertPaginatedResponse:
    """
    Retrieves chronological alerts stored in PostgreSQL with filtering by risk tier,
    operational status, and echelon unit.
    """
    service = AlertService(db)
    return await service.get_alerts(
        tier=tier,
        status_filter=status_filter,
        unit_id=unit_id,
        personnel_id=personnel_id,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/statistics/summary",
    response_model=AlertSummaryStats,
    summary="Get aggregated counts of active Red, Amber, and Unacknowledged alerts",
)
async def get_alert_statistics(
    unit_id: Optional[uuid.UUID] = Query(None, description="Optional unit scope filter"),
    current_user: User = Depends(require_any_officer),
    db: AsyncSession = Depends(get_db),
) -> AlertSummaryStats:
    """
    Computes dashboard tally of active alerts requiring immediate intervention.
    """
    service = AlertService(db)
    return await service.get_summary_statistics(unit_id=unit_id)


@router.post(
    "/{alert_id}/acknowledge",
    response_model=AlertRead,
    summary="Acknowledge an active Amber or Red alert",
)
async def acknowledge_alert(
    alert_id: uuid.UUID,
    payload: AlertAcknowledgeRequest = AlertAcknowledgeRequest(),
    current_user: User = Depends(require_any_officer),
    db: AsyncSession = Depends(get_db),
) -> AlertRead:
    """
    Updates alert status to ACKNOWLEDGED, recording officer identity and timestamp.
    """
    service = AlertService(db)
    return await service.acknowledge_alert(
        alert_id=alert_id,
        user_id=current_user.id,
        notes=payload.notes,
    )


@router.post(
    "/{alert_id}/resolve",
    response_model=AlertRead,
    summary="Resolve an alert with clinical or operational action notes",
)
async def resolve_alert(
    alert_id: uuid.UUID,
    payload: AlertResolveRequest,
    current_user: User = Depends(require_any_officer),
    db: AsyncSession = Depends(get_db),
) -> AlertRead:
    """
    Marks an alert as RESOLVED and records mandatory clinical/command remediation notes.
    """
    service = AlertService(db)
    return await service.resolve_alert(
        alert_id=alert_id,
        resolution_notes=payload.resolution_notes,
    )


@router.post(
    "/evaluate-direct",
    response_model=Optional[AlertRead],
    summary="Directly trigger alert rule evaluation for a service member",
)
async def evaluate_and_trigger_alert(
    personnel_id: uuid.UUID,
    stress_score: Decimal = Query(..., ge=0.0, le=100.0, description="Stress rating (0.0 to 100.0)"),
    notes: Optional[str] = Query(None, description="Optional context notes"),
    current_user: User = Depends(require_any_officer),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually invokes the 0-30 Green / 31-60 Amber / 61-100 Red evaluation engine
    and stores any generated alert in PostgreSQL.
    """
    service = AlertService(db)
    alert = await service.evaluate_and_create_alert(
        personnel_id=personnel_id,
        stress_score=stress_score,
        context_notes=notes,
    )
    if alert:
        return AlertRead.model_validate(alert)
    return None
