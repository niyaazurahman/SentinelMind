"""
Stress Monitoring & Telemetry Business Logic Service.
Handles logging, batch ingestion, risk categorization, and time-series analytics for service members.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import math
from typing import List, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.personnel import Personnel
from app.models.stress_log import StressLog
from app.schemas.stress import (
    StressAnalyticsSummary,
    StressLogBatchCreate,
    StressLogCreate,
    StressLogRead,
    StressPaginatedResponse,
)


def calculate_risk_category(score: Decimal) -> str:
    """Classifies continuous stress index (0-100) into operational tiers."""
    val = float(score)
    if val < 35.0:
        return "LOW"
    elif val < 65.0:
        return "MODERATE"
    elif val < 85.0:
        return "HIGH"
    return "SEVERE"


class StressService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _verify_personnel(self, personnel_id: uuid.UUID) -> Personnel:
        stmt = select(Personnel).where(Personnel.id == personnel_id)
        res = await self.db.execute(stmt)
        personnel = res.scalar_one_or_none()
        if not personnel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Personnel record '{personnel_id}' not found.",
            )
        return personnel

    async def create_stress_log(self, payload: StressLogCreate) -> StressLogRead:
        """
        Stores an individual stress log record with all 6 required parameters:
        Sleep Hours, HRV, Resting Heart Rate, Duty Hours, Mood Score, and Stress Score.
        """
        personnel = await self._verify_personnel(payload.personnel_id)

        recorded_dt = payload.recorded_at or datetime.now(timezone.utc)

        log = StressLog(
            personnel_id=payload.personnel_id,
            recorded_at=recorded_dt,
            sleep_hours=payload.sleep_hours,
            hrv=payload.hrv,
            resting_heart_rate=payload.resting_heart_rate,
            duty_hours=payload.duty_hours,
            mood_score=payload.mood_score,
            stress_score=payload.stress_score,
            sensor_source=payload.sensor_source or "MANUAL_INPUT",
            clinical_notes=payload.clinical_notes,
        )

        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)

        # Trigger Automated Alert Engine (0-30 Green, 31-60 Amber, 61-100 Red)
        try:
            from app.services.alert_service import AlertService
            alert_service = AlertService(self.db)
            await alert_service.evaluate_and_create_alert(
                personnel_id=log.personnel_id,
                stress_score=log.stress_score,
                context_notes=log.clinical_notes,
            )
        except Exception as e:
            # Non-blocking log
            print(f"[AlertEngine Notice] Automatic alert trigger exception: {e}")

        return StressLogRead(
            id=log.id,
            personnel_id=log.personnel_id,
            recorded_at=log.recorded_at,
            created_at=log.created_at,
            sleep_hours=log.sleep_hours,
            hrv=log.hrv,
            resting_heart_rate=log.resting_heart_rate,
            duty_hours=log.duty_hours,
            mood_score=log.mood_score,
            stress_score=log.stress_score,
            sensor_source=log.sensor_source,
            clinical_notes=log.clinical_notes,
            risk_category=calculate_risk_category(log.stress_score),
        )

    async def create_stress_batch(self, payload: StressLogBatchCreate) -> int:
        """
        Bulk ingests a series of wearable or telemetry log entries.
        """
        await self._verify_personnel(payload.personnel_id)

        now = datetime.now(timezone.utc)
        entities = [
            StressLog(
                personnel_id=payload.personnel_id,
                recorded_at=now,
                sleep_hours=rec.sleep_hours,
                hrv=rec.hrv,
                resting_heart_rate=rec.resting_heart_rate,
                duty_hours=rec.duty_hours,
                mood_score=rec.mood_score,
                stress_score=rec.stress_score,
                sensor_source=rec.sensor_source or "WEARABLE_SENSOR",
                clinical_notes=rec.clinical_notes,
            )
            for rec in payload.records
        ]

        self.db.add_all(entities)
        await self.db.commit()
        return len(entities)

    async def get_stress_log_by_id(self, log_id: uuid.UUID) -> StressLogRead:
        """Retrieves single stress log by UUID."""
        stmt = select(StressLog).where(StressLog.id == log_id)
        res = await self.db.execute(stmt)
        log = res.scalar_one_or_none()

        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stress log '{log_id}' not found.",
            )

        return StressLogRead(
            id=log.id,
            personnel_id=log.personnel_id,
            recorded_at=log.recorded_at,
            created_at=log.created_at,
            sleep_hours=log.sleep_hours,
            hrv=log.hrv,
            resting_heart_rate=log.resting_heart_rate,
            duty_hours=log.duty_hours,
            mood_score=log.mood_score,
            stress_score=log.stress_score,
            sensor_source=log.sensor_source,
            clinical_notes=log.clinical_notes,
            risk_category=calculate_risk_category(log.stress_score),
        )

    async def get_personnel_stress_history(
        self,
        personnel_id: uuid.UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> StressPaginatedResponse:
        """
        Retrieves paginated historical telemetry and stress records for a service member.
        """
        await self._verify_personnel(personnel_id)

        base_query = select(StressLog).where(StressLog.personnel_id == personnel_id)

        if start_date:
            base_query = base_query.where(StressLog.recorded_at >= start_date)
        if end_date:
            base_query = base_query.where(StressLog.recorded_at <= end_date)

        # Count total
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        # Paginate ordered by most recent first
        offset = (page - 1) * page_size
        paged_stmt = (
            base_query.order_by(StressLog.recorded_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        records = (await self.db.execute(paged_stmt)).scalars().all()

        items = [
            StressLogRead(
                id=rec.id,
                personnel_id=rec.personnel_id,
                recorded_at=rec.recorded_at,
                created_at=rec.created_at,
                sleep_hours=rec.sleep_hours,
                hrv=rec.hrv,
                resting_heart_rate=rec.resting_heart_rate,
                duty_hours=rec.duty_hours,
                mood_score=rec.mood_score,
                stress_score=rec.stress_score,
                sensor_source=rec.sensor_source,
                clinical_notes=rec.clinical_notes,
                risk_category=calculate_risk_category(rec.stress_score),
            )
            for rec in records
        ]

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return StressPaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_personnel_analytics(
        self,
        personnel_id: uuid.UUID,
        days: int = 7,
    ) -> StressAnalyticsSummary:
        """
        Calculates longitudinal metrics, average sleep, cumulative duty hours,
        sleep debt, and baseline HRV deviations over an observation period.
        """
        personnel = await self._verify_personnel(personnel_id)

        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        stmt = select(
            func.count(StressLog.id),
            func.avg(StressLog.sleep_hours),
            func.avg(StressLog.hrv),
            func.avg(StressLog.resting_heart_rate),
            func.sum(StressLog.duty_hours),
            func.avg(StressLog.mood_score),
            func.avg(StressLog.stress_score),
            func.min(StressLog.recorded_at),
            func.max(StressLog.recorded_at),
        ).where(
            StressLog.personnel_id == personnel_id,
            StressLog.recorded_at >= cutoff,
        )

        res = (await self.db.execute(stmt)).one()
        (
            count,
            avg_sleep,
            avg_hrv,
            avg_rhr,
            sum_duty,
            avg_mood,
            avg_stress,
            p_start,
            p_end,
        ) = res

        # Calculate sleep debt: target (e.g. 7.5h) * days - actual total sleep
        target_sleep_per_day = float(personnel.baseline_sleep_hours or Decimal("7.5"))
        expected_total_sleep = target_sleep_per_day * days
        actual_total_sleep = float(avg_sleep or 0) * (count or 0)
        sleep_debt = max(0.0, round(expected_total_sleep - actual_total_sleep, 2))

        # Baseline HRV deviation
        hrv_dev_pct = None
        if avg_hrv and personnel.baseline_hrv_rmssd and personnel.baseline_hrv_rmssd > 0:
            b_hrv = float(personnel.baseline_hrv_rmssd)
            hrv_dev_pct = round(((float(avg_hrv) - b_hrv) / b_hrv) * 100.0, 2)

        current_risk = "LOW"
        if avg_stress:
            current_risk = calculate_risk_category(Decimal(str(round(avg_stress, 2))))

        return StressAnalyticsSummary(
            personnel_id=personnel_id,
            total_logs_analyzed=count or 0,
            period_start=p_start,
            period_end=p_end,
            avg_sleep_hours=round(float(avg_sleep), 2) if avg_sleep else None,
            avg_hrv=round(float(avg_hrv), 2) if avg_hrv else None,
            avg_resting_heart_rate=round(float(avg_rhr), 1) if avg_rhr else None,
            total_duty_hours=round(float(sum_duty), 2) if sum_duty else 0.0,
            avg_mood_score=round(float(avg_mood), 2) if avg_mood else None,
            avg_stress_score=round(float(avg_stress), 2) if avg_stress else None,
            current_risk_category=current_risk,
            sleep_debt_hours=sleep_debt,
            hrv_baseline_deviation_percent=hrv_dev_pct,
        )
