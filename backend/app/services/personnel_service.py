"""
Personnel Management Service.
Business logic layer managing Add, Edit, Delete, Search, and View operations for military personnel.
"""

import hashlib
import math
from typing import Optional, Tuple
import uuid
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.personnel import Personnel
from app.models.unit import Unit
from app.schemas.personnel import (
    PersonnelCreate,
    PersonnelListItem,
    PersonnelPaginatedResponse,
    PersonnelUpdate,
)


class PersonnelService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _verify_unit_exists(self, unit_id: uuid.UUID) -> Unit:
        """Ensures the referenced unit ID is valid."""
        stmt = select(Unit).where(Unit.id == unit_id)
        res = await self.db.execute(stmt)
        unit = res.scalar_one_or_none()
        if not unit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Operational Unit '{unit_id}' not found.",
            )
        return unit

    async def create_personnel(self, payload: PersonnelCreate) -> Personnel:
        """
        Creates a new service member record with all required operational and demographic fields.
        """
        # 1. Verify Unit exists
        await self._verify_unit_exists(payload.unit_id)

        # 2. Generate or hash service number
        raw_service_num = payload.service_number or f"SN-{uuid.uuid4().hex[:8].upper()}"
        sn_hash = hashlib.sha256(raw_service_num.encode("utf-8")).hexdigest()

        # Check for collision
        existing_stmt = select(Personnel).where(Personnel.service_number_hash == sn_hash)
        existing = (await self.db.execute(existing_stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A service member with this service number already exists.",
            )

        # 3. Instantiate Personnel
        personnel = Personnel(
            full_name=payload.full_name.strip(),
            rank_grade=payload.rank_grade.upper().strip(),
            unit_id=payload.unit_id,
            age=payload.age,
            department=payload.department.strip(),
            contact_number=payload.contact_number.strip(),
            service_number_hash=sn_hash,
            duty_status=payload.duty_status,
            date_of_enlistment=payload.date_of_enlistment,
            baseline_hrv_rmssd=payload.baseline_hrv_rmssd,
            baseline_resting_hr=payload.baseline_resting_hr,
            baseline_sleep_hours=payload.baseline_sleep_hours,
            is_active=True,
        )

        self.db.add(personnel)
        await self.db.commit()

        # Reload with joined unit relationship
        stmt_reload = (
            select(Personnel)
            .options(selectinload(Personnel.unit))
            .where(Personnel.id == personnel.id)
        )
        return (await self.db.execute(stmt_reload)).scalar_one()

    async def get_personnel_by_id(self, personnel_id: uuid.UUID) -> Personnel:
        """
        Retrieves full detailed personnel profile by UUID.
        """
        stmt = (
            select(Personnel)
            .options(selectinload(Personnel.unit))
            .where(Personnel.id == personnel_id)
        )
        res = await self.db.execute(stmt)
        personnel = res.scalar_one_or_none()

        if not personnel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Personnel record '{personnel_id}' not found.",
            )
        return personnel

    async def update_personnel(
        self,
        personnel_id: uuid.UUID,
        payload: PersonnelUpdate,
    ) -> Personnel:
        """
        Edits mutable fields on an existing personnel record.
        """
        personnel = await self.get_personnel_by_id(personnel_id)

        # Check unit validity if unit_id is being updated
        if payload.unit_id and payload.unit_id != personnel.unit_id:
            await self._verify_unit_exists(payload.unit_id)
            personnel.unit_id = payload.unit_id

        if payload.full_name is not None:
            personnel.full_name = payload.full_name.strip()
        if payload.rank_grade is not None:
            personnel.rank_grade = payload.rank_grade.upper().strip()
        if payload.age is not None:
            personnel.age = payload.age
        if payload.department is not None:
            personnel.department = payload.department.strip()
        if payload.contact_number is not None:
            personnel.contact_number = payload.contact_number.strip()
        if payload.duty_status is not None:
            personnel.duty_status = payload.duty_status
        if payload.is_active is not None:
            personnel.is_active = payload.is_active
        if payload.baseline_hrv_rmssd is not None:
            personnel.baseline_hrv_rmssd = payload.baseline_hrv_rmssd
        if payload.baseline_resting_hr is not None:
            personnel.baseline_resting_hr = payload.baseline_resting_hr
        if payload.baseline_sleep_hours is not None:
            personnel.baseline_sleep_hours = payload.baseline_sleep_hours

        await self.db.commit()

        # Reload
        stmt_reload = (
            select(Personnel)
            .options(selectinload(Personnel.unit))
            .where(Personnel.id == personnel_id)
        )
        return (await self.db.execute(stmt_reload)).scalar_one()

    async def delete_personnel(
        self,
        personnel_id: uuid.UUID,
        hard_delete: bool = False,
    ) -> None:
        """
        Deletes a personnel record. By default performs a soft delete (is_active=False)
        to maintain clinical and operational audit integrity.
        """
        personnel = await self.get_personnel_by_id(personnel_id)

        if hard_delete:
            await self.db.delete(personnel)
        else:
            personnel.is_active = False

        await self.db.commit()

    async def search_and_filter_personnel(
        self,
        query: Optional[str] = None,
        unit_id: Optional[uuid.UUID] = None,
        department: Optional[str] = None,
        rank_grade: Optional[str] = None,
        duty_status: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PersonnelPaginatedResponse:
        """
        Searches personnel using ILIKE across Name, Department, Rank, and Contact.
        Applies structured filters and returns paginated results.
        """
        base_query = select(Personnel).options(selectinload(Personnel.unit))

        filters = []

        # Text search across multiple fields
        if query:
            clean_q = f"%{query.strip()}%"
            filters.append(
                or_(
                    Personnel.full_name.ilike(clean_q),
                    Personnel.department.ilike(clean_q),
                    Personnel.rank_grade.ilike(clean_q),
                    Personnel.contact_number.ilike(clean_q),
                )
            )

        if unit_id:
            filters.append(Personnel.unit_id == unit_id)
        if department:
            filters.append(Personnel.department.ilike(f"%{department.strip()}%"))
        if rank_grade:
            filters.append(Personnel.rank_grade == rank_grade.upper().strip())
        if duty_status:
            filters.append(Personnel.duty_status == duty_status.upper().strip())
        if is_active is not None:
            filters.append(Personnel.is_active == is_active)

        if filters:
            base_query = base_query.where(*filters)

        # Compute total count
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total_records = (await self.db.execute(count_stmt)).scalar() or 0

        # Apply ordering and pagination
        offset = (page - 1) * page_size
        paged_query = base_query.order_by(Personnel.full_name.asc()).offset(offset).limit(page_size)
        results = (await self.db.execute(paged_query)).scalars().all()

        items = [
            PersonnelListItem(
                id=p.id,
                full_name=p.full_name,
                rank_grade=p.rank_grade,
                unit_id=p.unit_id,
                unit_code=p.unit.unit_code if p.unit else None,
                age=p.age,
                department=p.department,
                contact_number=p.contact_number,
                duty_status=p.duty_status,
                is_active=p.is_active,
                created_at=p.created_at,
            )
            for p in results
        ]

        total_pages = math.ceil(total_records / page_size) if total_records > 0 else 1

        return PersonnelPaginatedResponse(
            items=items,
            total=total_records,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
