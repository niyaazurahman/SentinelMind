"""
Mood Report / Self-Assessment ORM Model.
Stores personnel self-assessment logs:
- Mood score (1 to 10)
- Sleep quality (1 to 10)
- Self-perceived stress rating (1 to 10)
- Wellness notes & qualitative narrative
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
import uuid
from sqlalchemy import DateTime, ForeignKey, Index, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.personnel import Personnel


class MoodReport(Base, TimestampMixin):
    __tablename__ = "mood_reports"

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
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    mood_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="1 (Severe depression/distress) to 10 (Peak morale)",
    )
    sleep_quality: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="1 (Restless/Insomnia) to 10 (Deep restorative sleep)",
    )
    stress_rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="1 (Relaxed/Equilibrium) to 10 (Severe overload)",
    )
    wellness_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Qualitative notes on physical fatigue, combat tension, or personal concerns",
    )

    personnel: Mapped["Personnel"] = relationship("Personnel", lazy="joined")

    __table_args__ = (
        Index("idx_mood_personnel_reported", "personnel_id", "reported_at"),
    )
