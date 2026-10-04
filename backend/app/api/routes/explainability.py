"""
Explainability API Routes.
Exposes endpoints to compute SHAP factor contributions for stress predictions:
e.g. "Poor Sleep +32%", "High Duty Hours +24%", "Low HRV +18%".
"""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import (
    get_current_user,
    require_any_officer,
    require_welfare_officer,
)
from app.core.database import get_db
from app.models.user import User
from app.schemas.shap import (
    PersonnelShapExplanation,
    ShapExplanationRequest,
    ShapExplanationResponse,
)
from app.services.shap_service import ShapService

router = APIRouter(prefix="/explain", tags=["SHAP Model Explainability"])


@router.post(
    "/prediction",
    response_model=ShapExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Explain an arbitrary stress prediction via SHAP values",
)
async def explain_stress_prediction(
    payload: ShapExplanationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShapExplanationResponse:
    """
    Deconstructs a stress prediction into exact feature contributions:
    Returns the top driving factors (e.g., 'Poor Sleep +32%', 'High Duty Hours +24%', 'Low HRV +18%')
    alongside protective mitigating buffers and clinical diagnostic summaries.
    """
    service = ShapService(db)
    return await service.explain_reading(payload)


@router.get(
    "/personnel/{personnel_id}/latest",
    response_model=PersonnelShapExplanation,
    summary="Explain why a service member's current stress score is elevated",
)
async def explain_personnel_latest_stress(
    personnel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PersonnelShapExplanation:
    """
    Retrieves the latest stress score of a service member and generates a full SHAP
    diagnostic explanation detailing the primary catalysts for their stress rating.
    """
    user_role = current_user.role.role_code if current_user.role else ""
    if user_role == "PERSONNEL":
        if not current_user.personnel_id or current_user.personnel_id != personnel_id:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Personnel may only access explanations for their own health records.",
            )

    service = ShapService(db)
    return await service.explain_personnel_latest(personnel_id)
