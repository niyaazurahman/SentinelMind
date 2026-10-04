"""
Pydantic Schemas for Authentication and Tokens.
"""

from typing import Optional
import uuid
from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int


class TokenResponse(Token):
    refresh_token: str
    user_id: uuid.UUID
    username: str
    role: str
    clearance_level: int
    unit_id: Optional[uuid.UUID] = None


class TokenPayload(BaseModel):
    sub: str
    role: str
    clearance_level: int
    unit_id: Optional[str] = None
    exp: int
    iat: int
    type: str


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8)


class MFARequest(BaseModel):
    session_ticket: str = Field(..., min_length=16, max_length=128)
    totp_code: str = Field(..., pattern=r"^\d{6}$")


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=32)
