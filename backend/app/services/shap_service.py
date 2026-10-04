"""
SHAP Explainability Business Logic Service.
Connects FastAPI persistence and telemetry with the Tree SHAP explainer
to decompose personnel predictions into clear factor attributions.
"""

from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ai.explainability.shap_engine import SentinelMindShapExplainer
from app.models.personnel import Personnel
from app.models.stress_log import StressLog
from app.schemas.shap import (
    PersonnelShapExplanation,
    ShapExplanationRequest,
    ShapExplanationResponse,
)

_explainer_instance: Optional[SentinelMindShapExplainer] = None


def get_explainer() -> SentinelMindShapExplainer:
    global _explainer_instance
    if _explainer_instance is None:
        _explainer_instance = SentinelMindShapExplainer()
    return _explainer_instance


class ShapService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.explainer = get_explainer()

    async def explain_reading(
        self,
        payload: ShapExplanationRequest,
    ) -> ShapExplanationResponse:
        """
        Decomposes an arbitrary telemetry reading into top clinical risk drivers.
        """
        data = {
            "Sleep_Hours": float(payload.sleep_hours),
            "HRV": float(payload.hrv),
            "Resting_HR": int(payload.resting_hr),
            "Duty_Hours": float(payload.duty_hours),
            "Mood_Score": int(payload.mood_score),
            "Deployment_Intensity": int(payload.deployment_intensity),
            "Incident_Exposure": int(payload.incident_exposure),
        }
        res = self.explainer.explain(data)
        return ShapExplanationResponse(**res)

    async def explain_personnel_latest(
        self,
        personnel_id: uuid.UUID,
    ) -> PersonnelShapExplanation:
        """
        Retrieves the latest stress log and unit profile of a service member,
        executing SHAP factor decomposition to show why their stress score is elevated.
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

        # Map duty status or unit theater to deployment intensity (1-5)
        intensity_map = {
            "ACTIVE_COMBAT": 5,
            "BORDER_PATROL": 4,
            "HIGH_TEMPO": 3,
            "STANDBY": 2,
            "BASE_DUTY": 1,
            "REST_AND_RECUPERATION": 1,
        }
        dep_intensity = intensity_map.get(personnel.duty_status, 2)

        data = {
            "Sleep_Hours": float(latest_log.sleep_hours),
            "HRV": float(latest_log.hrv),
            "Resting_HR": int(latest_log.resting_heart_rate),
            "Duty_Hours": float(latest_log.duty_hours),
            "Mood_Score": int(latest_log.mood_score),
            "Deployment_Intensity": dep_intensity,
            "Incident_Exposure": 1 if dep_intensity >= 4 else 0,
        }

        res = self.explainer.explain(data)

        return PersonnelShapExplanation(
            personnel_id=personnel.id,
            full_name=personnel.full_name,
            rank_grade=personnel.rank_grade,
            unit_code=personnel.unit.unit_code if personnel.unit else None,
            explanation=ShapExplanationResponse(**res),
        )
