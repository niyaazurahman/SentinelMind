"""
Duty Log ORM Model.
Tracks operational workload parameters:
- Duty hours per shift
- Shift type (DAY, NIGHT, COMBAT_PATROL, CONTINUOUS_WATCH)
- Consecutive working days without stand-down
- Leave history (days since last mandatory leave/R&R)
"""

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING
import uuid
from sqlalchemy import Date, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.personnel import Personnel


class DutyLog(Base, TimestampMixin):
    __tablename__ = "duty_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    personnel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("personnel.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    duty_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    duty_hours: Mapped[Decimal] = mapped_column(
        Numeric(4, 2),
        nullable=False,
        comment="Total operational hours logged on shift",
    )
    shift_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        comment="DAY, NIGHT, EXTENDED_RECON, 24H_GUARD, ROTATING",
    )
    consecutive_working_days: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        comment="Unbroken consecutive shift days",
    )
    days_since_last_leave: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Days elapsed since last approved leave or 48h rest block",
    )

    personnel: Mapped["Personnel"] = relationship("Personnel", lazy="joined")

    __table_args__ = (
        Index("idx_duty_personnel_date", "personnel_id", "duty_date"),
    )
