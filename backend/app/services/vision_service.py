"""
SentinelMind Vision: Master Service Layer.
Connects Computer Vision biometrics, Self-Assessment, and Duty Monitoring with PostgreSQL persistence,
AI multi-horizon forecasting, SHAP explainability, and the automated alert engine.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ai.computer_vision.facial_stress_analyzer import FacialStressAnalyzer
from ai.predictions.vision_stress_predictor import VisionStressPredictor
from app.models.alert import Alert
from app.models.audit_log import AuditLog
from app.models.duty_log import DutyLog
from app.models.facial_analysis_record import FacialAnalysisRecord
from app.models.intervention import Intervention
from app.models.mood_report import MoodReport
from app.models.personnel import Personnel
from app.models.prediction import Prediction
from app.schemas.vision import (
    ComprehensiveAssessmentRequest,
    ComprehensiveAssessmentResponse,
)
from app.services.alert_service import AlertService

_vision_predictor = VisionStressPredictor()
_facial_analyzer = FacialStressAnalyzer()


class VisionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.predictor = _vision_predictor
        self.analyzer = _facial_analyzer

    async def process_comprehensive_assessment(
        self,
        payload: ComprehensiveAssessmentRequest,
        acting_user_id: Optional[uuid.UUID] = None,
    ) -> ComprehensiveAssessmentResponse:
        """
        1. Validates Personnel
        2. Persists FacialAnalysisRecord, MoodReport, and DutyLog to PostgreSQL
        3. Runs VisionStressPredictor (Multi-Horizon Forecasts, Isolation Forest, SHAP)
        4. Persists Prediction and Interventions
        5. Automatically creates/escalates PostgreSQL Alerts
        6. Writes AuditLog entry
        """
        # 1. Fetch Personnel
        stmt = (
            select(Personnel)
            .options(selectinload(Personnel.unit))
            .where(Personnel.id == payload.personnel_id)
        )
        personnel = (await self.db.execute(stmt)).scalar_one_or_none()
        if not personnel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Personnel '{payload.personnel_id}' not found.",
            )

        now = datetime.now(timezone.utc)

        # 2. Extract CV biometrics & analyze frame features
        f_in = payload.facial_scan
        cv_result = self.analyzer.analyze_frame_features(
            ear=float(f_in.eye_closure_ratio),
            blinks_per_min=float(f_in.blink_frequency_bpm),
            brow_furrow_distance=float(f_in.facial_tension_score) * 0.4,
            mar=0.70 if f_in.yawn_count > 0 else 0.20,
            head_pitch=float(f_in.head_pitch),
            head_yaw=float(f_in.head_yaw),
            head_roll=float(f_in.head_roll),
        )

        # Persist FacialAnalysisRecord
        facial_record = FacialAnalysisRecord(
            personnel_id=personnel.id,
            session_id=f_in.session_id,
            recorded_at=now,
            eye_closure_ratio=Decimal(str(cv_result.eye_closure_ratio)),
            blink_frequency_bpm=Decimal(str(cv_result.blink_frequency_bpm)),
            facial_tension_score=Decimal(str(cv_result.facial_tension_score)),
            yawn_count=f_in.yawn_count,
            head_pitch=f_in.head_pitch,
            head_yaw=f_in.head_yaw,
            head_roll=f_in.head_roll,
            attention_level=f_in.attention_level,
            current_stress_score=Decimal(str(cv_result.current_stress_score)),
            fatigue_score=Decimal(str(cv_result.fatigue_score)),
        )
        self.db.add(facial_record)

        # Persist MoodReport
        m_in = payload.self_assessment
        mood_record = MoodReport(
            personnel_id=personnel.id,
            reported_at=now,
            mood_score=m_in.mood_score,
            sleep_quality=m_in.sleep_quality,
            stress_rating=m_in.stress_rating,
            wellness_notes=m_in.wellness_notes,
        )
        self.db.add(mood_record)

        # Persist DutyLog
        d_in = payload.duty_log
        duty_record = DutyLog(
            personnel_id=personnel.id,
            duty_date=d_in.duty_date,
            duty_hours=d_in.duty_hours,
            shift_type=d_in.shift_type,
            consecutive_working_days=d_in.consecutive_working_days,
            days_since_last_leave=d_in.days_since_last_leave,
        )
        self.db.add(duty_record)

        # 3. AI Inference: Predictor (XGBoost multi-horizon + Isolation Forest + SHAP)
        pred_res = self.predictor.predict_and_evaluate(
            facial_stress_score=cv_result.current_stress_score,
            fatigue_score=cv_result.fatigue_score,
            eye_closure_ratio=cv_result.eye_closure_ratio,
            attention_level=float(f_in.attention_level),
            mood_score=m_in.mood_score,
            sleep_quality=m_in.sleep_quality,
            stress_rating=m_in.stress_rating,
            duty_hours=float(d_in.duty_hours),
            consecutive_days=d_in.consecutive_working_days,
            baseline_7d_stress=28.0,
            baseline_30d_stress=26.5,
        )

        # 4. Persist Prediction record
        prediction_record = Prediction(
            personnel_id=personnel.id,
            predicted_at=now,
            current_stress_score=Decimal(str(pred_res["current_stress_score"])),
            risk_forecast_7d=Decimal(str(pred_res["risk_forecast_7d"])),
            risk_forecast_30d=Decimal(str(pred_res["risk_forecast_30d"])),
            risk_category=pred_res["risk_category"],
            baseline_7d_delta=Decimal(str(pred_res["baseline_7d_delta"])),
            baseline_30d_delta=Decimal(str(pred_res["baseline_30d_delta"])),
            is_anomaly=pred_res["is_anomaly"],
            shap_factors=pred_res["shap_factors"],
        )
        self.db.add(prediction_record)

        # 5. Persist Interventions
        for item in pred_res["interventions"]:
            intervention_record = Intervention(
                personnel_id=personnel.id,
                officer_id=acting_user_id,
                intervention_type=item["type"],
                urgency_tier=item["urgency"],
                title=item["title"],
                recommendation_text=item["description"],
                status="RECOMMENDED",
            )
            self.db.add(intervention_record)

        # 6. Automated Alert Trigger via AlertService
        alert_service = AlertService(self.db)
        alert = await alert_service.evaluate_and_create_alert(
            personnel_id=personnel.id,
            stress_score=Decimal(str(pred_res["current_stress_score"])),
            context_notes=f"Facial Vision Assessment: {', '.join(pred_res['shap_formatted'][:2])}",
        )

        # 7. Audit Log
        audit = AuditLog(
            user_id=acting_user_id,
            action="COMPREHENSIVE_FACIAL_ASSESSMENT",
            resource_type="PREDICTION",
            resource_id=str(prediction_record.id),
            details={
                "stress_score": pred_res["current_stress_score"],
                "category": pred_res["risk_category"],
                "is_anomaly": pred_res["is_anomaly"],
            },
        )
        self.db.add(audit)

        await self.db.commit()

        return ComprehensiveAssessmentResponse(
            personnel_id=personnel.id,
            current_stress_score=pred_res["current_stress_score"],
            risk_forecast_7d=pred_res["risk_forecast_7d"],
            risk_forecast_30d=pred_res["risk_forecast_30d"],
            risk_category=pred_res["risk_category"],
            baseline_7d_delta=pred_res["baseline_7d_delta"],
            baseline_30d_delta=pred_res["baseline_30d_delta"],
            is_anomaly=pred_res["is_anomaly"],
            anomalies=pred_res["anomalies"],
            shap_factors=pred_res["shap_factors"],
            shap_formatted=pred_res["shap_formatted"],
            interventions=pred_res["interventions"],
            alert_created=alert is not None,
            alert_id=alert.id if alert else None,
        )
