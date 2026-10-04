"""
Stress Log & Telemetry ORM Model.
Stores physiological vitals (Sleep Hours, HRV, Resting HR), operational workload (Duty Hours),
and psychological indicators (Mood Score, Stress Score).
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
import uuid
from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.personnel import Personnel


class StressLog(Base, TimestampMixin):
    __tablename__ = "stress_logs"

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
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Core Metrics Requested
    sleep_hours: Mapped[Decimal] = mapped_column(
        Numeric(4, 2),
        nullable=False,
        comment="Total sleep duration in hours (e.g., 6.50)",
    )
    hrv: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        nullable=False,
        comment="Heart Rate Variability RMSSD in milliseconds (e.g., 42.80)",
    )
    resting_heart_rate: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
        comment="Resting Heart Rate in BPM (e.g., 62)",
    )
    duty_hours: Mapped[Decimal] = mapped_column(
        Numeric(4, 2),
        nullable=False,
        comment="Operational or shift duty duration in hours (e.g., 8.00)",
    )
    mood_score: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
        comment="Subjective mood rating from 1 (Very Low) to 10 (Optimal)",
    )
    stress_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        index=True,
        comment="Evaluated stress index from 0.00 (Minimal) to 100.00 (Critical)",
    )

    # Contextual Telemetry Metadata
    sensor_source: Mapped[str] = mapped_column(
        String(32),
        default="MANUAL_INPUT",
        nullable=False,
        comment="Source: WEARABLE_SENSOR, FIELD_TABLET, or MANUAL_INPUT",
    )
    clinical_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Optional observational notes or symptom flags",
    )

    # Relationship back to service member
    personnel: Mapped["Personnel"] = relationship("Personnel", lazy="joined")

    __table_args__ = (
        Index("idx_stress_personnel_recorded", "personnel_id", "recorded_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<StressLog(personnel={self.personnel_id}, "
            f"stress={self.stress_score}, recorded_at={self.recorded_at})>"
        )
