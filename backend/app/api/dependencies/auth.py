"""
Authentication & Role-Based Access Control (RBAC) Dependencies.
Provides FastAPI dependency injection for user authentication, token decoding,
token revocation checks, and role/clearance verification.
"""

from datetime import datetime, timezone
from typing import Callable, List
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.revoked_token import RevokedToken
from app.models.role import SystemRole
from app.models.user import User

# OAuth2 password bearer scheme pointing to the login endpoint
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validates Bearer token signature, verifies the token JTI is not blacklisted/revoked,
    and returns the authenticated User entity with joined role and personnel profile.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    expired_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Access token has expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id_str: str = payload.get("sub")
        token_type: str = payload.get("type")
        jti: str = payload.get("jti")

        if not user_id_str or token_type != "access" or not jti:
            raise credentials_exception

        user_id = uuid.UUID(user_id_str)
    except jwt.ExpiredSignatureError:
        raise expired_exception
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    # 1. Check if token JTI has been revoked via logout
    revoked_stmt = select(RevokedToken).where(RevokedToken.jti == jti)
    revoked_res = await db.execute(revoked_stmt)
    if revoked_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked upon logout. Please authenticate again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Retrieve user with joined role and personnel
    stmt = (
        select(User)
        .options(selectinload(User.role), selectinload(User.personnel))
        .where(User.id == user_id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact Unit Security Officer.",
        )

    # 3. Check for temporary account lockout
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account is temporarily locked due to excessive failed attempts",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Convenience dependency returning authenticated active user."""
    return current_user


def require_roles(*allowed_roles: str) -> Callable:
    """
    Role-Based Access Control (RBAC) Dependency Factory.
    Enforces that the user belongs to one of the specified allowed system roles.
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        user_role_code = current_user.role.role_code if current_user.role else ""
        if user_role_code not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {list(allowed_roles)}. Your role is '{user_role_code}'.",
            )
        return current_user

    return role_checker


# Specific Pre-built RBAC Role Dependencies
require_admin = require_roles(SystemRole.ADMIN.value)
require_personnel = require_roles(SystemRole.PERSONNEL.value, SystemRole.ADMIN.value)
require_welfare_officer = require_roles(SystemRole.WELFARE_OFFICER.value, SystemRole.ADMIN.value)
require_command_officer = require_roles(SystemRole.COMMAND_OFFICER.value, SystemRole.ADMIN.value)
require_any_officer = require_roles(
    SystemRole.COMMAND_OFFICER.value,
    SystemRole.WELFARE_OFFICER.value,
    SystemRole.ADMIN.value,
)
