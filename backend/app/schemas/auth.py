"""
Authentication & Authorization Pydantic Schemas.
Enforces strict input validation for Registration, Login, Logout, and Token exchanges.
"""

from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.role import SystemRole


class UserRegisterRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=64,
        description="Alphanumeric username with optional underscores",
    )
    password: str = Field(
        ...,
        min_length=12,
        description="Strong password containing at least 12 characters",
    )
    role: SystemRole = Field(
        default=SystemRole.PERSONNEL,
        description="Assigned role: ADMIN, PERSONNEL, WELFARE_OFFICER, COMMAND_OFFICER",
    )
    service_number: Optional[str] = Field(
        None,
        description="Official military service identifier (e.g., SN-1234567)",
    )
    rank_grade: Optional[str] = Field(
        None,
        description="Military rank (e.g., CAPTAIN, SERGEANT, SPECIALIST)",
    )
    unit_id: Optional[uuid.UUID] = Field(
        None,
        description="UUID of the assigned operational unit",
    )

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v.replace("_", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, and underscores")
        return v.lower().strip()


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    refresh_token: str
    user_id: uuid.UUID
    username: str
    role: str
    clearance_level: int
    unit_id: Optional[uuid.UUID] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=32, description="Active JWT refresh token")


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = Field(
        None,
        description="Optional refresh token to revoke alongside the access token",
    )


class AuthStatusMessage(BaseModel):
    status: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AuthenticatedUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    role_code: str
    clearance_level: int
    unit_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None
