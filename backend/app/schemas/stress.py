"""
Pydantic Schemas for Stress Monitoring.
Validates Sleep Hours, HRV, Resting Heart Rate, Duty Hours, Mood Score, and Stress Score.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator


class StressLogBase(BaseModel):
    sleep_hours: Decimal = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Total sleep duration in hours (0.0 to 24.0)",
        examples=[6.5],
    )
    hrv: Decimal = Field(
        ...,
        ge=5.0,
        le=300.0,
        description="Heart Rate Variability RMSSD in milliseconds (5.0 to 300.0 ms)",
        examples=[42.8],
    )
    resting_heart_rate: int = Field(
        ...,
        ge=30,
        le=220,
        description="Resting heart rate in Beats Per Minute (30 to 220 BPM)",
        examples=[62],
    )
    duty_hours: Decimal = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Active duty shift duration in hours (0.0 to 24.0)",
        examples=[8.0],
    )
    mood_score: int = Field(
        ...,
        ge=1,
        le=10,
        description="Subjective psychological mood rating (1: Extremely Depleted, 10: Optimal)",
        examples=[7],
    )
    stress_score: Decimal = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Overall stress index rating (0.00: Minimal Stress, 100.00: Critical Overload)",
        examples=[38.5],
    )
    sensor_source: Optional[str] = Field(
        default="MANUAL_INPUT",
        description="Origin of readings: WEARABLE_SENSOR, FIELD_TABLET, MANUAL_INPUT",
    )
    clinical_notes: Optional[str] = Field(
        None,
        max_length=1000,
        description="Optional field notes, observed fatigue symptoms, or context",
    )


class StressLogCreate(StressLogBase):
    personnel_id: uuid.UUID = Field(
        ...,
        description="UUID of the service member",
    )
    recorded_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Observation timestamp (defaults to current UTC time)",
    )


class StressLogBatchCreate(BaseModel):
    personnel_id: uuid.UUID
    records: List[StressLogBase] = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Batch collection of telemetry readings from wearable synchronization",
    )


class StressLogUpdate(BaseModel):
    sleep_hours: Optional[Decimal] = Field(None, ge=0.0, le=24.0)
    hrv: Optional[Decimal] = Field(None, ge=5.0, le=300.0)
    resting_heart_rate: Optional[int] = Field(None, ge=30, le=220)
    duty_hours: Optional[Decimal] = Field(None, ge=0.0, le=24.0)
    mood_score: Optional[int] = Field(None, ge=1, le=10)
    stress_score: Optional[Decimal] = Field(None, ge=0.0, le=100.0)
    clinical_notes: Optional[str] = Field(None, max_length=1000)


class StressLogRead(StressLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    personnel_id: uuid.UUID
    recorded_at: datetime
    created_at: datetime
    risk_category: str = Field(
        description="Categorization derived from stress_score: LOW, MODERATE, HIGH, SEVERE",
    )


class StressAnalyticsSummary(BaseModel):
    personnel_id: uuid.UUID
    total_logs_analyzed: int
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None

    # Vitals Aggregations
    avg_sleep_hours: Optional[float] = None
    avg_hrv: Optional[float] = None
    avg_resting_heart_rate: Optional[float] = None
    total_duty_hours: Optional[float] = None
    avg_mood_score: Optional[float] = None
    avg_stress_score: Optional[float] = None

    # Trend Indicators
    current_risk_category: str
    sleep_debt_hours: float
    hrv_baseline_deviation_percent: Optional[float] = None


class StressPaginatedResponse(BaseModel):
    items: List[StressLogRead]
    total: int
    page: int
    page_size: int
    total_pages: int
