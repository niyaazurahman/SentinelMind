"""
Revoked Token Model.
Maintains a cryptographic blacklist of revoked JWT tokens (JTIs) upon logout to prevent replay attacks.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    jti: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    token_type: Mapped[str] = mapped_column(String(16), nullable=False)  # 'access' or 'refresh'
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    revoked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_revoked_tokens_jti_exp", "jti", "expires_at"),
    )

    def __repr__(self) -> str:
        return f"<RevokedToken(jti={self.jti}, type={self.token_type})>"
