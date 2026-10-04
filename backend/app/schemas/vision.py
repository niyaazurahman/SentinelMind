"""
Pydantic Schemas for SentinelMind Vision.
Covers Facial Analysis, Self-Assessment, Duty Monitoring, Multi-Horizon Predictions, and Interventions.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class FacialScanInput(BaseModel):
    personnel_id: uuid.UUID
    session_id: str = Field(default_factory=lambda: f"SES-{uuid.uuid4().hex[:8].upper()}")
    eye_closure_ratio: Decimal = Field(..., ge=0.0, le=1.0, description="Eye Aspect Ratio (EAR)")
    blink_frequency_bpm: Decimal = Field(..., ge=0.0, le=120.0, description="Blinks detected per minute")
    facial_tension_score: Decimal = Field(..., ge=0.0, le=100.0, description="Corrugator tension index")
    yawn_count: int = Field(default=0, ge=0)
    head_pitch: Decimal = Field(default=Decimal("0.0"))
    head_yaw: Decimal = Field(default=Decimal("0.0"))
    head_roll: Decimal = Field(default=Decimal("0.0"))
    attention_level: Decimal = Field(default=Decimal("85.0"), ge=0.0, le=100.0)


class SelfAssessmentInput(BaseModel):
    personnel_id: uuid.UUID
    mood_score: int = Field(..., ge=1, le=10, description="1 to 10 mood rating")
    sleep_quality: int = Field(..., ge=1, le=10, description="1 to 10 sleep rating")
    stress_rating: int = Field(..., ge=1, le=10, description="1 to 10 perceived stress rating")
    wellness_notes: Optional[str] = Field(None, max_length=1000)


class DutyLogInput(BaseModel):
    personnel_id: uuid.UUID
    duty_date: date = Field(default_factory=date.today)
    duty_hours: Decimal = Field(..., ge=0.0, le=24.0)
    shift_type: str = Field(default="DAY", description="DAY, NIGHT, EXTENDED_RECON, 24H_GUARD")
    consecutive_working_days: int = Field(default=1, ge=1)
    days_since_last_leave: int = Field(default=0, ge=0)


class ComprehensiveAssessmentRequest(BaseModel):
    personnel_id: uuid.UUID
    facial_scan: FacialScanInput
    self_assessment: SelfAssessmentInput
    duty_log: DutyLogInput


class AnomalySummary(BaseModel):
    type: str
    severity: str
    description: str


class InterventionItem(BaseModel):
    type: str
    urgency: str
    title: str
    description: str


class ComprehensiveAssessmentResponse(BaseModel):
    personnel_id: uuid.UUID
    current_stress_score: float
    risk_forecast_7d: float
    risk_forecast_30d: float
    risk_category: str
    baseline_7d_delta: float
    baseline_30d_delta: float
    is_anomaly: bool
    anomalies: List[AnomalySummary]
    shap_factors: Dict[str, int]
    shap_formatted: List[str]
    interventions: List[InterventionItem]
    alert_created: bool
    alert_id: Optional[uuid.UUID] = None
