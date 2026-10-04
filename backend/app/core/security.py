"""
Cryptographic Security & Authentication Primitives.
Provides password hashing via Argon2id, JWT token signing with JTI tracking, verification, and decoding.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple, Union
import uuid
import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context prioritizing Argon2id
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto",
    argon2__time_cost=settings.ARGON2_TIME_COST,
    argon2__memory_cost=settings.ARGON2_MEMORY_COST_KIB,
    argon2__parallelism=settings.ARGON2_PARALLELISM,
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an Argon2/bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Computes a secure hash using Argon2id with random salt."""
    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, Any],
    role: str,
    clearance_level: int,
    unit_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> Tuple[str, str, datetime]:
    """
    Constructs and signs a short-lived JSON Web Token (JWT) with user claims.
    Returns: (encoded_jwt, jti, expire_datetime)
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    token_jti = str(uuid.uuid4())

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "clearance_level": clearance_level,
        "unit_id": str(unit_id) if unit_id else None,
        "jti": token_jti,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt, token_jti, expire


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> Tuple[str, str, datetime]:
    """
    Constructs and signs a long-lived JWT refresh token with unique JTI.
    Returns: (encoded_jwt, jti, expire_datetime)
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    token_jti = str(uuid.uuid4())

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "jti": token_jti,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "refresh",
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt, token_jti, expire


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates token signature, expiration, and payload structure.
    Raises jwt.PyJWTError subclasses on invalid tokens.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["sub", "exp", "iat", "jti"]},
    )
