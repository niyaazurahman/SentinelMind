"""
Personnel ORM Model.
Stores service member profiles, operational unit attachments, demographic details,
and physiological baseline references.
"""

from datetime import date
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
import uuid
from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, SmallInteger, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.unit import Unit
    from app.models.user import User


class Personnel(Base, TimestampMixin):
    __tablename__ = "personnel"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    # Core Identity & Requested Fields
    full_name: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    rank_grade: Mapped[str] = mapped_column(String(32), index=True, nullable=False)  # Rank
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("units.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    age: Mapped[int] = mapped_column(Integer, nullable=False)  # Age
    department: Mapped[str] = mapped_column(String(64), index=True, nullable=False)  # Department
    contact_number: Mapped[str] = mapped_column(String(32), nullable=False)  # Contact Phone / Comms ID

    # Military & Security Fields
    service_number_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    date_of_enlistment: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    duty_status: Mapped[str] = mapped_column(
        String(32),
        default="BASE_DUTY",
        nullable=False,
    )  # ACTIVE_COMBAT, BASE_DUTY, STANDBY, MEDICAL_LEAVE, REST_AND_RECUPERATION

    # Biometric Baseline Thresholds
    baseline_hrv_rmssd: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    baseline_resting_hr: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    baseline_sleep_hours: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 1), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    unit: Mapped["Unit"] = relationship("Unit", back_populates="personnel", lazy="joined")
    user_account: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="personnel",
        uselist=False,
    )

    def __repr__(self) -> str:
        return f"<Personnel(name={self.full_name}, rank={self.rank_grade}, unit={self.unit_id})>"
