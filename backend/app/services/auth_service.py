"""
Authentication & Authorization Business Logic Service.
Handles registration, Argon2id credential verification, token lifecycle, and session revocation.
"""

from datetime import date, datetime, timezone
import hashlib
from typing import Optional, Tuple
import uuid
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.personnel import Personnel
from app.models.revoked_token import RevokedToken
from app.models.role import Role, ROLE_METADATA, SystemRole
from app.models.user import User
from app.schemas.auth import TokenResponse, UserRegisterRequest


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_role(self, system_role: SystemRole) -> Role:
        """Retrieves existing role or provisions it from default metadata."""
        stmt = select(Role).where(Role.role_code == system_role.value)
        result = await self.db.execute(stmt)
        role = result.scalar_one_or_none()

        if not role:
            meta = ROLE_METADATA.get(system_role)
            role = Role(
                role_code=system_role.value,
                display_name=meta["display_name"],
                clearance_level=meta["clearance_level"],
                description=meta["description"],
            )
            self.db.add(role)
            await self.db.flush()
        return role

    async def register_user(self, payload: UserRegisterRequest) -> User:
        """
        Registers a new user account, assigns operational role,
        and optionally binds to a service member personnel profile.
        """
        # 1. Check if username is already taken
        stmt = select(User).where(User.username == payload.username)
        res = await self.db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Username '{payload.username}' is already registered.",
            )

        # 2. Resolve Role
        role = await self.get_or_create_role(payload.role)

        # 3. Create or attach Personnel profile if service info provided
        personnel_id: Optional[uuid.UUID] = None
        if payload.service_number:
            # Deterministic SHA-256 HMAC hash of service number
            sn_hash = hashlib.sha256(payload.service_number.encode("utf-8")).hexdigest()

            # Check if personnel already exists
            p_stmt = select(Personnel).where(Personnel.service_number_hash == sn_hash)
            p_res = await self.db.execute(p_stmt)
            existing_personnel = p_res.scalar_one_or_none()

            if existing_personnel:
                personnel_id = existing_personnel.id
            elif payload.unit_id:
                # Provision new Personnel record
                new_personnel = Personnel(
                    service_number_hash=sn_hash,
                    unit_id=payload.unit_id,
                    rank_grade=payload.rank_grade or "OPERATOR",
                    date_of_enlistment=date.today(),
                    duty_status="BASE_DUTY",
                )
                self.db.add(new_personnel)
                await self.db.flush()
                personnel_id = new_personnel.id

        # 4. Hash password with Argon2id
        hashed_password = get_password_hash(payload.password)

        # 5. Create user record
        user = User(
            username=payload.username,
            password_hash=hashed_password,
            role_id=role.id,
            personnel_id=personnel_id,
            is_active=True,
            failed_login_attempts=0,
        )
        self.db.add(user)
        await self.db.commit()

        # Reload with joined relations
        stmt_reload = (
            select(User)
            .options(selectinload(User.role), selectinload(User.personnel))
            .where(User.id == user.id)
        )
        final_user = (await self.db.execute(stmt_reload)).scalar_one()
        return final_user

    async def authenticate(self, username: str, password: str) -> TokenResponse:
        """
        Authenticates credentials against Argon2 hash, tracks security lockouts,
        and constructs access and refresh JWT pairs with JTI tracking.
        """
        stmt = (
            select(User)
            .options(selectinload(User.role), selectinload(User.personnel))
            .where(User.username == username.lower().strip())
        )
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()

        unauthorized_exc = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

        if not user:
            raise unauthorized_exc

        now = datetime.now(timezone.utc)

        # Check account lockout
        if user.locked_until and user.locked_until > now:
            remaining_seconds = int((user.locked_until - now).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account temporarily locked due to failed attempts. Try again in {remaining_seconds} seconds.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Contact the Defense System Administrator.",
            )

        # Verify password hash
        if not verify_password(password, user.password_hash):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                from datetime import timedelta
                user.locked_until = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            await self.db.commit()
            raise unauthorized_exc

        # Reset failed attempts upon successful login
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = now
        await self.db.commit()

        role_code = user.role.role_code if user.role else SystemRole.PERSONNEL.value
        clearance = user.role.clearance_level if user.role else 1
        unit_id = user.personnel.unit_id if user.personnel else None

        # Issue token pair with JTIs
        access_token, _, _ = create_access_token(
            subject=str(user.id),
            role=role_code,
            clearance_level=clearance,
            unit_id=str(unit_id) if unit_id else None,
        )
        refresh_token, _, _ = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            refresh_token=refresh_token,
            user_id=user.id,
            username=user.username,
            role=role_code,
            clearance_level=clearance,
            unit_id=unit_id,
        )

    async def refresh_access_token(self, refresh_token_str: str) -> TokenResponse:
        """
        Validates refresh token, checks revocation ledger, revokes old refresh token (rotation),
        and issues a fresh token pair.
        """
        token_exc = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = decode_token(refresh_token_str)
            if payload.get("type") != "refresh":
                raise token_exc
            jti = payload.get("jti")
            user_id = uuid.UUID(payload.get("sub"))
            exp_ts = payload.get("exp")
        except Exception:
            raise token_exc

        # Check if JTI is revoked
        revoked_stmt = select(RevokedToken).where(RevokedToken.jti == jti)
        revoked_res = await self.db.execute(revoked_stmt)
        if revoked_res.scalar_one_or_none():
            raise token_exc

        # Retrieve user
        stmt = (
            select(User)
            .options(selectinload(User.role), selectinload(User.personnel))
            .where(User.id == user_id)
        )
        user = (await self.db.execute(stmt)).scalar_one_or_none()

        if not user or not user.is_active:
            raise token_exc

        # Token Rotation: Revoke old refresh token JTI
        exp_dt = datetime.fromtimestamp(exp_ts, tz=timezone.utc)
        old_revoked = RevokedToken(
            jti=jti,
            token_type="refresh",
            expires_at=exp_dt,
        )
        self.db.add(old_revoked)

        # Issue new token pair
        role_code = user.role.role_code if user.role else SystemRole.PERSONNEL.value
        clearance = user.role.clearance_level if user.role else 1
        unit_id = user.personnel.unit_id if user.personnel else None

        new_access_token, _, _ = create_access_token(
            subject=str(user.id),
            role=role_code,
            clearance_level=clearance,
            unit_id=str(unit_id) if unit_id else None,
        )
        new_refresh_token, _, _ = create_refresh_token(subject=str(user.id))

        await self.db.commit()

        return TokenResponse(
            access_token=new_access_token,
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            refresh_token=new_refresh_token,
            user_id=user.id,
            username=user.username,
            role=role_code,
            clearance_level=clearance,
            unit_id=unit_id,
        )

    async def revoke_tokens(
        self,
        access_token_str: str,
        refresh_token_str: Optional[str] = None,
    ) -> None:
        """
        Blacklists active token JTIs in PostgreSQL to guarantee immediate session invalidation.
        """
        # Revoke access token
        try:
            payload = decode_token(access_token_str)
            jti = payload.get("jti")
            exp_ts = payload.get("exp")
            if jti and exp_ts:
                exp_dt = datetime.fromtimestamp(exp_ts, tz=timezone.utc)
                revoked_acc = RevokedToken(jti=jti, token_type="access", expires_at=exp_dt)
                self.db.add(revoked_acc)
        except Exception:
            pass  # If access token was already expired, proceed

        # Revoke refresh token if provided
        if refresh_token_str:
            try:
                ref_payload = decode_token(refresh_token_str)
                ref_jti = ref_payload.get("jti")
                ref_exp_ts = ref_payload.get("exp")
                if ref_jti and ref_exp_ts:
                    ref_exp_dt = datetime.fromtimestamp(ref_exp_ts, tz=timezone.utc)
                    revoked_ref = RevokedToken(jti=ref_jti, token_type="refresh", expires_at=ref_exp_dt)
                    self.db.add(revoked_ref)
            except Exception:
                pass

        await self.db.commit()
