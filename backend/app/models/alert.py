"""
Alert Engine ORM Model.
Stores automated triage notifications and clinical escalation events in PostgreSQL.

Rules:
- 0-30:   GREEN (Normal / Low Risk)
- 31-60:  AMBER (Warning / Moderate Risk)
- 61-100: RED   (Critical / Severe Risk)
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
import uuid
from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.personnel import Personnel
    from app.models.unit import Unit
    from app.models.user import User


class Alert(Base, TimestampMixin):
    __tablename__ = "alerts"

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
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("units.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Core Alert Tiering: GREEN (0-30), AMBER (31-60), RED (61-100)
    alert_tier: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        index=True,
        comment="Tier: GREEN (0-30), AMBER (31-60), RED (61-100)",
    )
    stress_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        comment="Stress index value that triggered this alert",
    )

    title: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Operational Lifecycle Status
    status: Mapped[str] = mapped_column(
        String(32),
        default="NEW",
        nullable=False,
        index=True,
        comment="Status: NEW, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, DISMISSED",
    )

    # Incident Response & Acknowledgement Tracking
    acknowledged_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Clinical or command action summary taken to resolve the alert",
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    personnel: Mapped["Personnel"] = relationship("Personnel", lazy="joined")
    unit: Mapped["Unit"] = relationship("Unit", lazy="joined")
    acknowledged_by: Mapped[Optional["User"]] = relationship("User", lazy="joined")

    __table_args__ = (
        Index("idx_alerts_tier_status", "alert_tier", "status"),
        Index("idx_alerts_unit_tier", "unit_id", "alert_tier"),
    )

    def __repr__(self) -> str:
        return f"<Alert(tier={self.alert_tier}, score={self.stress_score}, status={self.status})>"
