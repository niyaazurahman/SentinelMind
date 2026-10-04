"""
Pydantic Schemas for SHAP Explainability.
Defines input payloads and clinical factor contribution representations:
e.g. "Poor Sleep +32%", "High Duty Hours +24%", "Low HRV +18%".
"""

from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field


class ShapExplanationRequest(BaseModel):
    sleep_hours: Decimal = Field(..., ge=0.0, le=24.0, description="Sleep duration in hours", examples=[4.2])
    hrv: Decimal = Field(..., ge=5.0, le=300.0, description="HRV RMSSD in milliseconds", examples=[26.0])
    resting_hr: int = Field(..., ge=30, le=220, description="Resting heart rate in BPM", examples=[84])
    duty_hours: Decimal = Field(..., ge=0.0, le=24.0, description="Shift duty hours", examples=[14.0])
    mood_score: int = Field(..., ge=1, le=10, description="Self-reported mood score (1-10)", examples=[3])
    deployment_intensity: int = Field(default=3, ge=1, le=5, description="Deployment intensity (1-5)", examples=[4])
    incident_exposure: int = Field(default=0, ge=0, le=10, description="Incident exposure count", examples=[2])


class FactorDetail(BaseModel):
    feature: str = Field(description="Raw column name")
    label: str = Field(description="Clinical descriptor (e.g. Poor Sleep, Low HRV, High Duty Hours)")
    raw_value: float = Field(description="Recorded physiological or operational value")
    shap_value: float = Field(description="Raw marginal attribution value")
    contribution_percentage: int = Field(description="Percentage impact on prediction (e.g. 32)")
    formatted_factor: str = Field(description="User-facing formatted string (e.g. 'Poor Sleep +32%')")
    is_risk_driver: bool = Field(description="True if elevates stress; False if acts as protective buffer")


class ShapExplanationResponse(BaseModel):
    predicted_risk_score: float = Field(description="Model evaluated risk score (0.00 to 100.00)")
    risk_category: str = Field(description="Risk categorization: LOW, MODERATE, HIGH, SEVERE")
    base_value: float = Field(description="Expected population baseline stress rating")
    top_factors_formatted: List[str] = Field(
        description="Ranked list of top contributing factors (e.g. ['Poor Sleep +32%', 'High Duty Hours +24%', 'Low HRV +18%'])"
    )
    top_risk_drivers: List[FactorDetail] = Field(description="Detailed breakdown of aggravating risk factors")
    protective_factors: List[FactorDetail] = Field(description="Detailed breakdown of mitigating protective buffers")
    clinical_narrative: str = Field(description="Executive clinical summary of stress etiology")


class PersonnelShapExplanation(BaseModel):
    personnel_id: uuid.UUID
    full_name: str
    rank_grade: str
    unit_code: Optional[str] = None
    explanation: ShapExplanationResponse
