"""
Anomaly Detection Business Logic Service.
Connects FastAPI persistence and personnel baselines with the Isolation Forest engine
to evaluate Sleep Drop, HRV Collapse, Mood Crash, and Extreme Duty Hours.
"""

from typing import Dict, List, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ai.anomaly_detection.isolation_forest.anomaly_detector import SentinelMindAnomalyDetector
from app.models.personnel import Personnel
from app.models.stress_log import StressLog
from app.schemas.anomaly import (
    AnomalyEvaluationRequest,
    AnomalyEvaluationResponse,
    PersonnelAnomalyRecord,
)

# Global singleton instance of the detector
_detector_instance: Optional[SentinelMindAnomalyDetector] = None


def get_detector() -> SentinelMindAnomalyDetector:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = SentinelMindAnomalyDetector()
    return _detector_instance


class AnomalyService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.detector = get_detector()

    async def evaluate_reading(
        self,
        payload: AnomalyEvaluationRequest,
    ) -> AnomalyEvaluationResponse:
        """
        Directly evaluates a telemetry vector for multi-variate anomalies.
        """
        res = self.detector.detect(
            sleep_hours=float(payload.sleep_hours),
            hrv=float(payload.hrv),
            mood_score=int(payload.mood_score),
            duty_hours=float(payload.duty_hours),
            baseline_hrv=float(payload.baseline_hrv) if payload.baseline_hrv else None,
            baseline_sleep=float(payload.baseline_sleep) if payload.baseline_sleep else None,
        )
        return AnomalyEvaluationResponse(**res)

    async def evaluate_personnel_latest(
        self,
        personnel_id: uuid.UUID,
    ) -> PersonnelAnomalyRecord:
        """
        Retrieves the latest stress log and individual baseline thresholds
        for a service member, executing anomaly evaluation.
        """
        stmt_p = (
            select(Personnel)
            .options(selectinload(Personnel.unit))
            .where(Personnel.id == personnel_id)
        )
        personnel = (await self.db.execute(stmt_p)).scalar_one_or_none()
        if not personnel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Personnel record '{personnel_id}' not found.",
            )

        # Get latest stress log
        stmt_log = (
            select(StressLog)
            .where(StressLog.personnel_id == personnel_id)
            .order_by(StressLog.recorded_at.desc())
            .limit(1)
        )
        latest_log = (await self.db.execute(stmt_log)).scalar_one_or_none()

        if not latest_log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No telemetry logs available for personnel '{personnel_id}'.",
            )

        res = self.detector.detect(
            sleep_hours=float(latest_log.sleep_hours),
            hrv=float(latest_log.hrv),
            mood_score=int(latest_log.mood_score),
            duty_hours=float(latest_log.duty_hours),
            baseline_hrv=float(personnel.baseline_hrv_rmssd) if personnel.baseline_hrv_rmssd else None,
            baseline_sleep=float(personnel.baseline_sleep_hours) if personnel.baseline_sleep_hours else None,
        )

        return PersonnelAnomalyRecord(
            personnel_id=personnel.id,
            full_name=personnel.full_name,
            rank_grade=personnel.rank_grade,
            unit_code=personnel.unit.unit_code if personnel.unit else None,
            evaluation=AnomalyEvaluationResponse(**res),
        )

    async def scan_unit_anomalies(
        self,
        unit_id: uuid.UUID,
    ) -> List[PersonnelAnomalyRecord]:
        """
        Scans all personnel in an operational unit and flags individuals
        exhibiting acute physiological or behavioral deviations.
        """
        stmt = (
            select(Personnel)
            .options(selectinload(Personnel.unit))
            .where(Personnel.unit_id == unit_id, Personnel.is_active == True)
        )
        members = (await self.db.execute(stmt)).scalars().all()

        flagged = []
        for m in members:
            try:
                record = await self.evaluate_personnel_latest(m.id)
                if record.evaluation.is_anomaly:
                    flagged.append(record)
            except HTTPException:
                continue

        return flagged
