"""
Real-Time Facial Analysis Service Layer.
Executes computer vision inference, maps to DeepFace emotions, computes fatigue and stress,
and manages persistent analysis history in PostgreSQL.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ai.computer_vision.realtime_face_analyzer import RealTimeFaceAnalyzer
from app.models.facial_analysis_record import FacialAnalysisRecord
from app.models.personnel import Personnel
from app.schemas.realtime_analysis import (
    FacialAnalysisHistoryItem,
    HeadTiltModel,
    RealTimeFrameAnalysisRequest,
    RealTimeFrameAnalysisResponse,
)

_analyzer = RealTimeFaceAnalyzer()


class RealTimeAnalysisService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.analyzer = _analyzer

    async def analyze_frame(
        self,
        payload: RealTimeFrameAnalysisRequest,
        acting_user_id: Optional[uuid.UUID] = None,
    ) -> RealTimeFrameAnalysisResponse:
        now = datetime.now(timezone.utc)

        # Run Face Analyzer
        cv_result = self.analyzer.analyze_face(
            face_present=payload.face_detected,
            eye_aspect_ratio=payload.eye_aspect_ratio,
            blink_rate_bpm=payload.blink_rate_bpm,
            mouth_aspect_ratio=payload.mouth_aspect_ratio,
            brow_tension_raw=payload.brow_tension_raw,
            head_pitch=payload.head_pitch,
            head_yaw=payload.head_yaw,
            head_roll=payload.head_roll,
            image_base64=payload.image_base64,
            override_emotion=payload.override_emotion,
            override_confidence=payload.override_confidence,
        )

        record_id = None

        # If a face was detected and we have a target personnel, persist in PostgreSQL
        if cv_result.face_detected and payload.personnel_id:
            try:
                record = FacialAnalysisRecord(
                    personnel_id=payload.personnel_id,
                    session_id=f"RT-{uuid.uuid4().hex[:8].upper()}",
                    recorded_at=now,
                    eye_closure_ratio=Decimal(str(payload.eye_aspect_ratio or 0.28)),
                    blink_frequency_bpm=Decimal(str(cv_result.blink_rate)),
                    facial_tension_score=Decimal(str(cv_result.facial_tension_score)),
                    yawn_count=1 if cv_result.is_yawning else 0,
                    head_pitch=Decimal(str(cv_result.head_tilt["pitch"])),
                    head_yaw=Decimal(str(cv_result.head_tilt["yaw"])),
                    head_roll=Decimal(str(cv_result.head_tilt["roll"])),
                    attention_level=Decimal(str(cv_result.attention_score)),
                    current_stress_score=Decimal(str(cv_result.estimated_stress_score)),
                    fatigue_score=Decimal(str(cv_result.fatigue_score)),
                    landmarks_summary={
                        "emotion": cv_result.emotion,
                        "emotion_confidence": cv_result.emotion_confidence,
                        "stress_level": cv_result.stress_level,
                        "fatigue_level": cv_result.fatigue_level,
                        "attention_level": cv_result.attention_level,
                    },
                )
                self.db.add(record)
                await self.db.commit()
                record_id = record.id
            except Exception as e:
                # Log non-fatal DB write error to maintain low-latency live streaming
                print(f"[RealTimeAnalysisService] Warning: Failed to persist record: {e}")

        return RealTimeFrameAnalysisResponse(
            face_detected=cv_result.face_detected,
            message=cv_result.message,
            emotion=cv_result.emotion,
            emotion_confidence=cv_result.emotion_confidence,
            emotion_distribution=cv_result.emotion_distribution,
            eye_closure_percentage=cv_result.eye_closure_percentage,
            blink_rate=cv_result.blink_rate,
            is_yawning=cv_result.is_yawning,
            head_tilt=HeadTiltModel(**cv_result.head_tilt),
            fatigue_score=cv_result.fatigue_score,
            fatigue_level=cv_result.fatigue_level,
            facial_tension_score=cv_result.facial_tension_score,
            attention_score=cv_result.attention_score,
            attention_level=cv_result.attention_level,
            estimated_stress_score=cv_result.estimated_stress_score,
            stress_level=cv_result.stress_level,
            risk_category=cv_result.risk_category,
            summary_text=cv_result.summary_text,
            recorded_at=now,
            record_id=record_id,
        )

    async def get_history(
        self,
        personnel_id: Optional[uuid.UUID] = None,
        limit: int = 50,
    ) -> List[FacialAnalysisHistoryItem]:
        """
        Retrieves historical facial analysis logs from PostgreSQL.
        """
        stmt = (
            select(FacialAnalysisRecord)
            .options(selectinload(FacialAnalysisRecord.personnel))
            .order_by(desc(FacialAnalysisRecord.recorded_at))
            .limit(limit)
        )
        if personnel_id:
            stmt = stmt.where(FacialAnalysisRecord.personnel_id == personnel_id)

        records = (await self.db.execute(stmt)).scalars().all()

        history_items = []
        for r in records:
            meta = r.landmarks_summary or {}
            stress = float(r.current_stress_score)
            stress_level = "Low" if stress <= 30 else ("Medium" if stress <= 60 else "High")
            fatigue = float(r.fatigue_score)
            fatigue_level = "Low" if fatigue < 35 else ("Medium" if fatigue < 65 else "High")
            att = float(r.attention_level)
            att_level = "High" if att >= 75 else ("Medium" if att >= 50 else "Low")

            history_items.append(
                FacialAnalysisHistoryItem(
                    id=r.id,
                    recorded_at=r.recorded_at,
                    personnel_name=r.personnel.full_name if r.personnel else "Operator",
                    rank=r.personnel.rank_grade.value if r.personnel else "CPT",
                    emotion=meta.get("emotion", "Neutral"),
                    emotion_confidence=meta.get("emotion_confidence", 82.0),
                    stress_score=stress,
                    stress_level=meta.get("stress_level", stress_level),
                    fatigue_score=fatigue,
                    fatigue_level=meta.get("fatigue_level", fatigue_level),
                    attention_level=meta.get("attention_level", att_level),
                    eye_closure_percentage=round(float((0.30 - float(r.eye_closure_ratio)) / 0.30 * 100), 1),
                    blink_rate=float(r.blink_frequency_bpm),
                    is_yawning=r.yawn_count > 0,
                    head_pitch=float(r.head_pitch),
                    head_yaw=float(r.head_yaw),
                    head_roll=float(r.head_roll),
                    risk_category="GREEN" if stress <= 30 else ("AMBER" if stress <= 60 else "RED"),
                )
            )

        return history_items
