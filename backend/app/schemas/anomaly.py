"""
Pydantic Schemas for Anomaly Detection.
Covers Sleep Drop, HRV Collapse, Mood Crash, and Extreme Duty Hours.
"""

from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field


class AnomalyEvaluationRequest(BaseModel):
    sleep_hours: Decimal = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Recorded sleep duration in hours (e.g., 3.2)",
        examples=[3.5],
    )
    hrv: Decimal = Field(
        ...,
        ge=5.0,
        le=300.0,
        description="Heart Rate Variability RMSSD in ms (e.g., 18.2)",
        examples=[21.0],
    )
    mood_score: int = Field(
        ...,
        ge=1,
        le=10,
        description="Subjective psychological mood rating (1 to 10)",
        examples=[2],
    )
    duty_hours: Decimal = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Continuous operational shift duration in hours (e.g., 15.5)",
        examples=[15.0],
    )
    baseline_hrv: Optional[Decimal] = Field(
        None,
        description="Service member's 30-day normative baseline HRV",
    )
    baseline_sleep: Optional[Decimal] = Field(
        None,
        description="Service member's typical baseline nightly sleep need",
    )


class AnomalySignatureDetail(BaseModel):
    type: str = Field(description="Anomaly trigger: SLEEP_DROP, HRV_COLLAPSE, MOOD_CRASH, EXTREME_DUTY_HOURS")
    severity: str = Field(description="Severity tier: WARNING, CRITICAL")
    trigger_value: str = Field(description="Actual recorded value causing the trigger")
    threshold: str = Field(description="Clinical violation threshold")
    message: str = Field(description="Human-readable clinical rationale")


class AnomalyEvaluationResponse(BaseModel):
    is_anomaly: bool = Field(description="Whether the multi-variate reading is flagged as an outlier")
    anomaly_score: float = Field(description="Isolation Forest decision score (< 0 indicates outlier)")
    normalized_anomaly_index: float = Field(description="Normalized anomaly scale from 0.00 (Normal) to 1.00 (Extreme)")
    severity: str = Field(description="Overall severity: NORMAL, MODERATE, HIGH, CRITICAL")
    detected_signatures: List[str] = Field(description="List of detected anomaly codes")
    signature_details: List[AnomalySignatureDetail] = Field(description="Detailed breakdown of each detected signature")
    clinical_recommendation: str = Field(description="Immediate actionable medical/command guidance")


class PersonnelAnomalyRecord(BaseModel):
    personnel_id: uuid.UUID
    full_name: str
    rank_grade: str
    unit_code: Optional[str] = None
    evaluation: AnomalyEvaluationResponse
