"""
Facial Analysis Record ORM Model.
Stores raw and normalized computer vision facial stress indicators:
- Eye closure (EAR - Eye Aspect Ratio)
- Blink frequency (blinks / min)
- Facial tension (brow furrow, jaw clenching, lip corner depressor)
- Yawning frequency & duration (MAR - Mouth Aspect Ratio)
- Head posture (pitch, yaw, roll)
- Attention level (0 - 100%)
- Facial Stress & Fatigue scores
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
import uuid
from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.personnel import Personnel


class FacialAnalysisRecord(Base, TimestampMixin):
    __tablename__ = "facial_analysis_records"

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
    session_id: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        comment="Unique identifier for the webcam capture session",
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    # Core Computer Vision Biometrics
    eye_closure_ratio: Mapped[Decimal] = mapped_column(
        Numeric(4, 3),
        nullable=False,
        comment="Eye Aspect Ratio (EAR), lower implies eyelid drooping/closure",
    )
    blink_frequency_bpm: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        comment="Blinks detected per minute",
    )
    facial_tension_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        comment="0.0 to 100.0, derived from corrugator supercilii / brow furrowing and jaw clench",
    )
    yawn_count: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        comment="Yawn occurrences detected via Mouth Aspect Ratio (MAR)",
    )
    head_pitch: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("0.0"),
        comment="Nodding tilt in degrees",
    )
    head_yaw: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("0.0"),
        comment="Horizontal turning angle in degrees",
    )
    head_roll: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("0.0"),
        comment="Lateral tilt angle in degrees",
    )
    attention_level: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        comment="Gaze fixation and head posture attention score (0.00 to 100.00)",
    )

    # Derived Synthetic Scores
    current_stress_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        comment="Facial stress score (0.00 to 100.00)",
    )
    fatigue_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        comment="Facial fatigue index (0.00 to 100.00)",
    )

    # Raw landmark metadata
    landmarks_summary: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Summary geometry of key facial landmarks (eyes, lips, brows)",
    )

    # Relationship
    personnel: Mapped["Personnel"] = relationship("Personnel", lazy="joined")

    __table_args__ = (
        Index("idx_facial_records_personnel_date", "personnel_id", "recorded_at"),
    )
