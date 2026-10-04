"""
Personnel Management API Routes.
Exposes endpoints for Add, Edit, Delete, Search, and View operations on military personnel.
"""

from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import (
    get_current_user,
    require_admin,
    require_any_officer,
)
from app.core.database import get_db
from app.models.user import User
from app.schemas.personnel import (
    PersonnelCreate,
    PersonnelPaginatedResponse,
    PersonnelRead,
    PersonnelUpdate,
)
from app.services.personnel_service import PersonnelService

router = APIRouter(prefix="/personnel", tags=["Personnel Management"])


@router.post(
    "",
    response_model=PersonnelRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new service member to the system",
)
async def add_personnel(
    payload: PersonnelCreate,
    current_user: User = Depends(require_any_officer),
    db: AsyncSession = Depends(get_db),
) -> PersonnelRead:
    """
    Creates a new personnel record with required attributes:
    Name, Rank, Unit, Age, Department, and Contact Number.
    Restricted to authorized officers (Admin, Command Officer, Welfare Officer).
    """
    service = PersonnelService(db)
    return await service.create_personnel(payload)


@router.get(
    "",
    response_model=PersonnelPaginatedResponse,
    summary="Search, filter, and paginate personnel records",
)
async def search_personnel(
    query: Optional[str] = Query(
        None,
        description="Fuzzy search text matching Name, Department, Rank, or Contact",
    ),
    unit_id: Optional[uuid.UUID] = Query(
        None,
        description="Filter by operational unit UUID",
    ),
    department: Optional[str] = Query(
        None,
        description="Filter by specific department or division",
    ),
    rank_grade: Optional[str] = Query(
        None,
        description="Filter by military rank (e.g., CAPTAIN, SERGEANT)",
    ),
    duty_status: Optional[str] = Query(
        None,
        description="Filter by duty status (e.g., ACTIVE_COMBAT, BASE_DUTY)",
    ),
    is_active: Optional[bool] = Query(
        None,
        description="Filter by active status (True/False)",
    ),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page"),
    current_user: User = Depends(require_any_officer),
    db: AsyncSession = Depends(get_db),
) -> PersonnelPaginatedResponse:
    """
    Search personnel records with multi-attribute filtering and pagination.
    """
    service = PersonnelService(db)
    return await service.search_and_filter_personnel(
        query=query,
        unit_id=unit_id,
        department=department,
        rank_grade=rank_grade,
        duty_status=duty_status,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{personnel_id}",
    response_model=PersonnelRead,
    summary="View complete details of a specific service member",
)
async def view_personnel(
    personnel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PersonnelRead:
    """
    Retrieves complete personnel profile including demographic data,
    attached operational unit, and baseline thresholds.
    """
    service = PersonnelService(db)
    # If standard personnel, allow only viewing own profile
    user_role = current_user.role.role_code if current_user.role else ""
    if user_role == "PERSONNEL":
        if not current_user.personnel_id or current_user.personnel_id != personnel_id:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Personnel may only view their own confidential profile.",
            )

    return await service.get_personnel_by_id(personnel_id)


@router.patch(
    "/{personnel_id}",
    response_model=PersonnelRead,
    summary="Edit an existing personnel record",
)
async def edit_personnel(
    personnel_id: uuid.UUID,
    payload: PersonnelUpdate,
    current_user: User = Depends(require_any_officer),
    db: AsyncSession = Depends(get_db),
) -> PersonnelRead:
    """
    Updates one or more fields of an existing service member record.
    Supported fields: Name, Rank, Unit, Age, Department, Contact, Duty Status, Baselines.
    """
    service = PersonnelService(db)
    return await service.update_personnel(personnel_id, payload)


@router.delete(
    "/{personnel_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete or deactivate a personnel record",
)
async def delete_personnel(
    personnel_id: uuid.UUID,
    hard_delete: bool = Query(
        False,
        description="If True, permanently deletes from database (Admin only). Otherwise soft deactivates.",
    ),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Deactivates (soft delete) or permanently removes a personnel record.
    Requires ADMIN privileges.
    """
    service = PersonnelService(db)
    await service.delete_personnel(personnel_id, hard_delete=hard_delete)
    action_type = "permanently purged" if hard_delete else "deactivated"
    return {
        "status": "SUCCESS",
        "personnel_id": str(personnel_id),
        "message": f"Personnel record successfully {action_type}.",
    }
