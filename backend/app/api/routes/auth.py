"""
Complete Authentication & Authorization Routes.
Endpoints for Registration, Login, Token Refresh, Logout, Profile Inspection,
and Role-Based Access Control verification.
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import (
    get_current_user,
    oauth2_scheme,
    require_admin,
    require_command_officer,
    require_personnel,
    require_welfare_officer,
)
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthenticatedUserSummary,
    AuthStatusMessage,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserRegisterRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])


@router.post(
    "/register",
    response_model=AuthenticatedUserSummary,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account with assigned role",
)
async def register(
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedUserSummary:
    """
    Enrolls a new user into the SentinelMind platform.
    Hashes password via Argon2id and binds the account to an operational role
    (Admin, Personnel, Welfare Officer, Command Officer).
    """
    auth_service = AuthService(db)
    user = await auth_service.register_user(payload)
    return AuthenticatedUserSummary(
        id=user.id,
        username=user.username,
        role_code=user.role.role_code if user.role else "PERSONNEL",
        clearance_level=user.role.clearance_level if user.role else 1,
        unit_id=user.personnel.unit_id if user.personnel else None,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate with username & password to receive JWT tokens",
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Standard OAuth2 password bearer login endpoint.
    Returns short-lived Access Token (15 mins) and long-lived Refresh Token (7 days) with JTI tracking.
    """
    auth_service = AuthService(db)
    return await auth_service.authenticate(form_data.username, form_data.password)


@router.post(
    "/login/json",
    response_model=TokenResponse,
    summary="JSON-based login endpoint for web and mobile clients",
)
async def login_json(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Convenience JSON-based login alternative to OAuth2 form."""
    auth_service = AuthService(db)
    return await auth_service.authenticate(payload.username, payload.password)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and receive a new access token",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Exchanges an active refresh token for a newly signed access token.
    Automatically invalidates the used refresh token (zero-replay protection).
    """
    auth_service = AuthService(db)
    return await auth_service.refresh_access_token(payload.refresh_token)


@router.post(
    "/logout",
    response_model=AuthStatusMessage,
    summary="Revoke active tokens and terminate session",
)
async def logout(
    logout_payload: LogoutRequest = LogoutRequest(),
    access_token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> AuthStatusMessage:
    """
    Revokes the current JWT access token and optional refresh token by persisting
    their JTIs into the cryptographic revocation ledger.
    """
    auth_service = AuthService(db)
    await auth_service.revoke_tokens(
        access_token_str=access_token,
        refresh_token_str=logout_payload.refresh_token,
    )
    return AuthStatusMessage(
        status="SUCCESS",
        message="Session revoked. Active tokens added to security blacklist.",
    )


@router.get(
    "/me",
    response_model=AuthenticatedUserSummary,
    summary="Retrieve authenticated user profile and permissions",
)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> AuthenticatedUserSummary:
    """Returns the caller's identity, active role, clearance level, and unit."""
    return AuthenticatedUserSummary(
        id=current_user.id,
        username=current_user.username,
        role_code=current_user.role.role_code if current_user.role else "PERSONNEL",
        clearance_level=current_user.role.clearance_level if current_user.role else 1,
        unit_id=current_user.personnel.unit_id if current_user.personnel else None,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at,
    )


# ==============================================================================
# Role-Based Access Control (RBAC) Demonstration Routes
# ==============================================================================

@router.get("/roles/admin-only", summary="Admin only route")
async def verify_admin_access(
    current_user: User = Depends(require_admin),
):
    return {
        "access": "GRANTED",
        "role_verified": "ADMIN",
        "user": current_user.username,
        "message": "Authorized for system configuration, user provisioning, and full audit logs.",
    }


@router.get("/roles/welfare-officer-only", summary="Welfare Officer route")
async def verify_welfare_officer_access(
    current_user: User = Depends(require_welfare_officer),
):
    return {
        "access": "GRANTED",
        "role_verified": "WELFARE_OFFICER",
        "user": current_user.username,
        "message": "Authorized for individual clinical stress evaluations, SHAP explanations, and medical interventions.",
    }


@router.get("/roles/command-officer-only", summary="Command Officer route")
async def verify_command_officer_access(
    current_user: User = Depends(require_command_officer),
):
    return {
        "access": "GRANTED",
        "role_verified": "COMMAND_OFFICER",
        "user": current_user.username,
        "message": "Authorized for aggregate unit readiness scores, combat fatigue trends, and deployment schedules.",
    }


@router.get("/roles/personnel-only", summary="Personnel welfare portal route")
async def verify_personnel_access(
    current_user: User = Depends(require_personnel),
):
    return {
        "access": "GRANTED",
        "role_verified": "PERSONNEL",
        "user": current_user.username,
        "message": "Authorized for personal recovery score, sleep metrics, and self-reported mood submissions.",
    }
