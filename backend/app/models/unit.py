"""
Unit ORM Model.
Models the organizational tree structure of military echelons and operational units.
"""

import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.personnel import Personnel


class Unit(Base, TimestampMixin):
    __tablename__ = "units"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    unit_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    echelon: Mapped[str] = mapped_column(String(32), nullable=False)  # SQUAD, PLATOON, COMPANY, etc.
    parent_unit_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("units.id", ondelete="RESTRICT"),
        nullable=True,
    )
    theater_of_operations: Mapped[str] = mapped_column(String(64), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Hierarchical Self-Referential Relationships
    sub_units: Mapped[List["Unit"]] = relationship(
        "Unit",
        back_populates="parent_unit",
        cascade="all",
    )
    parent_unit: Mapped[Optional["Unit"]] = relationship(
        "Unit",
        back_populates="sub_units",
        remote_side=[id],
    )

    # Personnel attached to unit
    personnel: Mapped[List["Personnel"]] = relationship("Personnel", back_populates="unit")

    def __repr__(self) -> str:
        return f"<Unit(code={self.unit_code}, echelon={self.echelon})>"
