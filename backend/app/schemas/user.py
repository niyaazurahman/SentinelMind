"""
Pydantic Schemas for Users and Roles.
"""

from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_code: str
    display_name: str
    clearance_level: int
    description: Optional[str] = None


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    is_active: bool = True
    mfa_enabled: bool = False


class UserCreate(UserBase):
    password: str = Field(..., min_length=12)
    role_id: int
    personnel_id: Optional[uuid.UUID] = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    personnel_id: Optional[uuid.UUID] = None
    role: RoleRead
    last_login_at: Optional[datetime] = None
    created_at: datetime
