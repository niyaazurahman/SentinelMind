"""
Alert Engine Business Logic Service.
Evaluates stress telemetry against operational thresholds and automatically persists alerts in PostgreSQL.

Rules:
- 0-30:   GREEN (Optimal / Normal)
- 31-60:  AMBER (Warning / Elevated Risk)
- 61-100: RED   (Critical / Urgent Action Required)
"""

from datetime import datetime, timezone
from decimal import Decimal
import math
from typing import List, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.alert import Alert
from app.models.personnel import Personnel
from app.schemas.alert import (
    AlertPaginatedResponse,
    AlertRead,
    AlertSummaryStats,
)


def evaluate_tier_rule(score: Decimal) -> str:
    """
    Enforces core triage rules:
    - 0-30   -> GREEN
    - 31-60  -> AMBER
    - 61-100 -> RED
    """
    val = float(score)
    if val <= 30.0:
        return "GREEN"
    elif val <= 60.0:
        return "AMBER"
    return "RED"


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def evaluate_and_create_alert(
        self,
        personnel_id: uuid.UUID,
        stress_score: Decimal,
        context_notes: Optional[str] = None,
    ) -> Optional[Alert]:
        """
        Automatically evaluates a stress score against the 0-30 / 31-60 / 61-100 rule
        and creates or updates an alert in PostgreSQL.
        """
        # 1. Fetch Personnel & Unit
        stmt_p = (
            select(Personnel)
            .options(selectinload(Personnel.unit))
            .where(Personnel.id == personnel_id)
        )
        personnel = (await self.db.execute(stmt_p)).scalar_one_or_none()
        if not personnel:
            return None

        tier = evaluate_tier_rule(stress_score)
        val = float(stress_score)

        # 2. Check for existing active (unresolved) alert
        stmt_active = (
            select(Alert)
            .where(
                Alert.personnel_id == personnel_id,
                Alert.status.in_(["NEW", "ACKNOWLEDGED", "IN_PROGRESS"]),
            )
            .order_by(Alert.created_at.desc())
            .limit(1)
        )
        active_alert = (await self.db.execute(stmt_active)).scalar_one_or_none()

        now = datetime.now(timezone.utc)

        # 3. Handling GREEN (0-30)
        if tier == "GREEN":
            # If an active alert existed and vitals normalized, auto-resolve it
            if active_alert and active_alert.alert_tier in ["AMBER", "RED"]:
                active_alert.status = "RESOLVED"
                active_alert.resolved_at = now
                active_alert.resolution_notes = (
                    f"Auto-resolved: Stress score normalized to GREEN ({val:.1f}/100)."
                )
                await self.db.commit()
                return active_alert
            # Green logs do not require actionable active alerts
            return None

        # 4. Construct Title and Description
        if tier == "RED":
            title = f"CRITICAL: High Stress Overload ({val:.1f}/100) - {personnel.rank_grade} {personnel.full_name}"
            desc = (
                f"Service member registered a critical stress rating of {val:.1f}/100 (Threshold: 61-100). "
                f"Immediate clinical welfare triage and duty stand-down evaluation required."
            )
        else:  # AMBER
            title = f"WARNING: Elevated Stress Fatigue ({val:.1f}/100) - {personnel.rank_grade} {personnel.full_name}"
            desc = (
                f"Service member registered an elevated warning stress rating of {val:.1f}/100 (Threshold: 31-60). "
                f"Pre-emptive recovery observation recommended."
            )

        if context_notes:
            desc += f" Context: {context_notes}"

        # 5. Debounce / Escalation Logic
        if active_alert:
            # If escalating from AMBER to RED
            if active_alert.alert_tier == "AMBER" and tier == "RED":
                active_alert.alert_tier = "RED"
                active_alert.stress_score = stress_score
                active_alert.title = title
                active_alert.description = desc
                active_alert.status = "NEW"  # Re-escalate to NEW for command visibility
                await self.db.commit()
                await self.db.refresh(active_alert)
                return active_alert
            else:
                # Update existing active alert to latest telemetry reading
                active_alert.stress_score = stress_score
                active_alert.description = desc
                await self.db.commit()
                await self.db.refresh(active_alert)
                return active_alert

        # 6. Create Fresh Alert in PostgreSQL
        alert = Alert(
            personnel_id=personnel.id,
            unit_id=personnel.unit_id,
            alert_tier=tier,
            stress_score=stress_score,
            title=title,
            description=desc,
            status="NEW",
        )

        self.db.add(alert)
        await self.db.commit()
        await self.db.refresh(alert)
        return alert

    async def get_alerts(
        self,
        tier: Optional[str] = None,
        status_filter: Optional[str] = None,
        unit_id: Optional[uuid.UUID] = None,
        personnel_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> AlertPaginatedResponse:
        """
        Lists alerts stored in PostgreSQL with filtering and pagination.
        """
        base_query = (
            select(Alert)
            .options(selectinload(Alert.personnel))
            .order_by(Alert.created_at.desc())
        )

        filters = []
        if tier:
            filters.append(Alert.alert_tier == tier.upper().strip())
        if status_filter:
            filters.append(Alert.status == status_filter.upper().strip())
        if unit_id:
            filters.append(Alert.unit_id == unit_id)
        if personnel_id:
            filters.append(Alert.personnel_id == personnel_id)

        if filters:
            base_query = base_query.where(*filters)

        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        offset = (page - 1) * page_size
        paged_stmt = base_query.offset(offset).limit(page_size)
        results = (await self.db.execute(paged_stmt)).scalars().all()

        items = [AlertRead.model_validate(r) for r in results]
        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return AlertPaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def acknowledge_alert(
        self,
        alert_id: uuid.UUID,
        user_id: uuid.UUID,
        notes: Optional[str] = None,
    ) -> AlertRead:
        """Marks an alert as acknowledged by a commanding or medical officer."""
        stmt = (
            select(Alert)
            .options(selectinload(Alert.personnel))
            .where(Alert.id == alert_id)
        )
        alert = (await self.db.execute(stmt)).scalar_one_or_none()
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert '{alert_id}' not found.",
            )

        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_by_id = user_id
        alert.acknowledged_at = datetime.now(timezone.utc)
        if notes:
            alert.description += f" [Ack Note: {notes}]"

        await self.db.commit()
        await self.db.refresh(alert)
        return AlertRead.model_validate(alert)

    async def resolve_alert(
        self,
        alert_id: uuid.UUID,
        resolution_notes: str,
    ) -> AlertRead:
        """Resolves an alert with clinical or administrative notes."""
        stmt = (
            select(Alert)
            .options(selectinload(Alert.personnel))
            .where(Alert.id == alert_id)
        )
        alert = (await self.db.execute(stmt)).scalar_one_or_none()
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert '{alert_id}' not found.",
            )

        alert.status = "RESOLVED"
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolution_notes = resolution_notes

        await self.db.commit()
        await self.db.refresh(alert)
        return AlertRead.model_validate(alert)

    async def get_summary_statistics(
        self,
        unit_id: Optional[uuid.UUID] = None,
    ) -> AlertSummaryStats:
        """Computes counts of active alerts, split by Green, Amber, Red."""
        base_query = select(Alert).where(Alert.status.in_(["NEW", "ACKNOWLEDGED", "IN_PROGRESS"]))
        if unit_id:
            base_query = base_query.where(Alert.unit_id == unit_id)

        # Total active
        total_active_stmt = select(func.count()).select_from(base_query.subquery())
        total_active = (await self.db.execute(total_active_stmt)).scalar() or 0

        # Red active
        red_stmt = select(func.count()).select_from(
            base_query.where(Alert.alert_tier == "RED").subquery()
        )
        red_count = (await self.db.execute(red_stmt)).scalar() or 0

        # Amber active
        amber_stmt = select(func.count()).select_from(
            base_query.where(Alert.alert_tier == "AMBER").subquery()
        )
        amber_count = (await self.db.execute(amber_stmt)).scalar() or 0

        # Unacknowledged active
        unack_stmt = select(func.count()).select_from(
            base_query.where(Alert.status == "NEW").subquery()
        )
        unack_count = (await self.db.execute(unack_stmt)).scalar() or 0

        return AlertSummaryStats(
            total_active_alerts=total_active,
            red_alerts=red_count,
            amber_alerts=amber_count,
            green_alerts=0,  # Green records resolve automatically
            unacknowledged_alerts=unack_count,
        )
