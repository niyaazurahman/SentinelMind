"""
Pydantic Schemas for Alert Engine.
Rules:
- 0-30:   GREEN
- 31-60:  AMBER
- 61-100: RED
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class AlertBase(BaseModel):
    personnel_id: uuid.UUID
    unit_id: uuid.UUID
    alert_tier: str = Field(description="GREEN (0-30), AMBER (31-60), RED (61-100)")
    stress_score: Decimal = Field(ge=0.0, le=100.0)
    title: str = Field(max_length=128)
    description: str


class AlertCreate(AlertBase):
    pass


class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=500, description="Optional acknowledgement notes")


class AlertResolveRequest(BaseModel):
    resolution_notes: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Clinical or command action summary taken to resolve the alert",
        examples=["Administered 24h rest-and-recuperation order. Monitored vitals normalized to Green."],
    )


class PersonnelSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    rank_grade: str
    department: str
    contact_number: str


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    personnel_id: uuid.UUID
    unit_id: uuid.UUID
    alert_tier: str
    stress_score: Decimal
    title: str
    description: str
    status: str
    acknowledged_by_id: Optional[uuid.UUID] = None
    acknowledged_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    personnel: Optional[PersonnelSummary] = None


class AlertSummaryStats(BaseModel):
    total_active_alerts: int
    red_alerts: int
    amber_alerts: int
    green_alerts: int
    unacknowledged_alerts: int


class AlertPaginatedResponse(BaseModel):
    items: List[AlertRead]
    total: int
    page: int
    page_size: int
    total_pages: int
