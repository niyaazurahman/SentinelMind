"""
Intervention ORM Model.
Tracks clinical, command, and psychological welfare interventions:
- REST_RECOMMENDATION
- WELLNESS_PROGRAM
- COUNSELLING
- MEDICAL_REVIEW
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
import uuid
from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.personnel import Personnel
    from app.models.user import User


class Intervention(Base, TimestampMixin):
    __tablename__ = "interventions"

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
    officer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Welfare or Medical Officer who initiated or oversees the intervention",
    )

    intervention_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
        comment="REST_RECOMMENDATION, WELLNESS_PROGRAM, COUNSELLING, MEDICAL_REVIEW",
    )
    urgency_tier: Mapped[str] = mapped_column(
        String(24),
        default="ROUTINE",
        nullable=False,
        comment="ROUTINE, URGENT, MANDATORY_STAND_DOWN",
    )
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    recommendation_text: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[str] = mapped_column(
        String(32),
        default="RECOMMENDED",
        nullable=False,
        index=True,
        comment="RECOMMENDED, SCHEDULED, IN_PROGRESS, COMPLETED, WAIVED",
    )
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    outcome_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Clinical or command summary of post-intervention recovery",
    )

    personnel: Mapped["Personnel"] = relationship("Personnel", lazy="joined")
    officer: Mapped[Optional["User"]] = relationship("User", lazy="joined")

    __table_args__ = (
        Index("idx_interventions_personnel_status", "personnel_id", "status"),
    )
