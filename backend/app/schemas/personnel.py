"""
Pydantic Schemas for Personnel Management.
Enforces validation rules for Add, Edit, View, and Search operations.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator


class PersonnelBase(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=128,
        description="Full legal name of the service member",
        examples=["Captain Alex Vance"],
    )
    rank_grade: str = Field(
        ...,
        min_length=2,
        max_length=32,
        description="Military rank (e.g., CAPTAIN, SERGEANT, LIEUTENANT, SPECIALIST)",
        examples=["CAPTAIN"],
    )
    unit_id: uuid.UUID = Field(
        ...,
        description="UUID of the assigned operational unit",
    )
    age: int = Field(
        ...,
        ge=18,
        le=65,
        description="Age of service member (Must be between 18 and 65)",
        examples=[32],
    )
    department: str = Field(
        ...,
        min_length=2,
        max_length=64,
        description="Operational division or department (e.g., Tactical Recon, Communications, Logistics, Medical)",
        examples=["Tactical Reconnaissance"],
    )
    contact_number: str = Field(
        ...,
        min_length=5,
        max_length=32,
        description="Official contact phone number or encrypted comms identifier",
        examples=["+1-555-019-8821"],
    )
    duty_status: str = Field(
        default="BASE_DUTY",
        description="Status: ACTIVE_COMBAT, BASE_DUTY, STANDBY, MEDICAL_LEAVE, REST_AND_RECUPERATION",
    )

    @field_validator("duty_status")
    @classmethod
    def validate_duty_status(cls, v: str) -> str:
        valid_statuses = {
            "ACTIVE_COMBAT",
            "BASE_DUTY",
            "STANDBY",
            "MEDICAL_LEAVE",
            "REST_AND_RECUPERATION",
        }
        upper_v = v.upper().strip()
        if upper_v not in valid_statuses:
            raise ValueError(f"Invalid duty status. Must be one of: {valid_statuses}")
        return upper_v


class PersonnelCreate(PersonnelBase):
    service_number: Optional[str] = Field(
        None,
        description="Official military service number. Auto-generated if omitted.",
        examples=["SN-9821450"],
    )
    date_of_enlistment: Optional[date] = Field(
        default_factory=date.today,
        description="Enlistment date",
    )
    baseline_hrv_rmssd: Optional[Decimal] = Field(
        None,
        ge=10.0,
        le=250.0,
        description="Initial baseline RMSSD (ms)",
    )
    baseline_resting_hr: Optional[int] = Field(
        None,
        ge=35,
        le=120,
        description="Initial resting heart rate (bpm)",
    )
    baseline_sleep_hours: Optional[Decimal] = Field(
        None,
        ge=4.0,
        le=12.0,
        description="Target nightly sleep hours",
    )


class PersonnelUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=128)
    rank_grade: Optional[str] = Field(None, min_length=2, max_length=32)
    unit_id: Optional[uuid.UUID] = None
    age: Optional[int] = Field(None, ge=18, le=65)
    department: Optional[str] = Field(None, min_length=2, max_length=64)
    contact_number: Optional[str] = Field(None, min_length=5, max_length=32)
    duty_status: Optional[str] = None
    is_active: Optional[bool] = None
    baseline_hrv_rmssd: Optional[Decimal] = None
    baseline_resting_hr: Optional[int] = None
    baseline_sleep_hours: Optional[Decimal] = None

    @field_validator("duty_status")
    @classmethod
    def validate_duty_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        valid_statuses = {
            "ACTIVE_COMBAT",
            "BASE_DUTY",
            "STANDBY",
            "MEDICAL_LEAVE",
            "REST_AND_RECUPERATION",
        }
        upper_v = v.upper().strip()
        if upper_v not in valid_statuses:
            raise ValueError(f"Invalid duty status. Must be one of: {valid_statuses}")
        return upper_v


class UnitSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    unit_code: str
    echelon: str
    theater_of_operations: str


class PersonnelRead(PersonnelBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    service_number_hash: str
    date_of_enlistment: date
    baseline_hrv_rmssd: Optional[Decimal] = None
    baseline_resting_hr: Optional[int] = None
    baseline_sleep_hours: Optional[Decimal] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    unit: Optional[UnitSummary] = None


class PersonnelListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    rank_grade: str
    unit_id: uuid.UUID
    unit_code: Optional[str] = None
    age: int
    department: str
    contact_number: str
    duty_status: str
    is_active: bool
    created_at: datetime


class PersonnelPaginatedResponse(BaseModel):
    items: List[PersonnelListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
