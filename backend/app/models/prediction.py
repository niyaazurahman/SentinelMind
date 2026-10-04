"""
Prediction ORM Model.
Stores multi-horizon stress predictions and explainability attributions:
- Current Stress Score (0.00 to 100.00)
- 7-Day Risk Forecast (0.00 to 100.00)
- 30-Day Risk Forecast (0.00 to 100.00)
- Risk Category (GREEN, AMBER, RED)
- 7-Day & 30-Day Personalized Baseline deltas
- SHAP Feature Attributions (JSONB)
- Isolation Forest Anomaly indicators
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.personnel import Personnel


class Prediction(Base, TimestampMixin):
    __tablename__ = "predictions"

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
    predicted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    # Multi-Horizon Stress Scores
    current_stress_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        comment="Current estimated stress score (0.00 to 100.00)",
    )
    risk_forecast_7d: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        comment="Forward 7-day cumulative stress risk forecast",
    )
    risk_forecast_30d: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        comment="Forward 30-day cumulative burnout / operational exhaustion risk",
    )
    risk_category: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        index=True,
        comment="GREEN (0-30), AMBER (31-60), RED (61-100)",
    )

    # Personalized Baseline Comparison
    baseline_7d_delta: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("0.0"),
        comment="Deviation from member's 7-day rolling baseline",
    )
    baseline_30d_delta: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("0.0"),
        comment="Deviation from member's 30-day normative baseline",
    )

    # Isolation Forest Anomaly
    is_anomaly: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    anomaly_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(6, 4),
        nullable=True,
    )

    # SHAP Explanations Breakdown (e.g. {"Poor Sleep": 35, "Low Mood": 25, ...})
    shap_factors: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment="Ranked SHAP marginal attributions with percentages",
    )

    personnel: Mapped["Personnel"] = relationship("Personnel", lazy="joined")

    __table_args__ = (
        Index("idx_predictions_personnel_date", "personnel_id", "predicted_at"),
    )
