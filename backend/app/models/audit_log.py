"""
Audit Log ORM Model.
Maintains tamper-evident records for military compliance and officer actions:
- Logins & Role escalation
- Health record accesses
- Triage alert acknowledgements
- Mandatory stand-down orders & medical reviews
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
import uuid
from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        comment="e.g. AUTH_LOGIN, VIEW_HEALTH_RECORD, ACKNOWLEDGE_ALERT, ISSUE_INTERVENTION",
    )
    resource_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        comment="e.g. PERSONNEL, ALERT, PREDICTION, INTERVENTION",
    )
    resource_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
    )
    details: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Contextual metadata regarding the operational event",
    )

    user: Mapped[Optional["User"]] = relationship("User", lazy="joined")

    __table_args__ = (
        Index("idx_audit_user_action", "user_id", "action"),
        Index("idx_audit_created_at", "created_at"),
    )
