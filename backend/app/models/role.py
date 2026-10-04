"""
Role Definitions & Model.
Enumerates system roles and clearance mappings for SentinelMind:
- Admin
- Personnel
- Welfare Officer
- Command Officer
"""

from enum import Enum
from typing import List, TYPE_CHECKING
from sqlalchemy import SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class SystemRole(str, Enum):
    ADMIN = "ADMIN"
    PERSONNEL = "PERSONNEL"
    WELFARE_OFFICER = "WELFARE_OFFICER"
    COMMAND_OFFICER = "COMMAND_OFFICER"


# Default clearance rating and descriptions per role
ROLE_METADATA = {
    SystemRole.ADMIN: {
        "display_name": "System Administrator",
        "clearance_level": 5,
        "description": "Full administrative access, user provisioning, security audits, and system configuration.",
    },
    SystemRole.COMMAND_OFFICER: {
        "display_name": "Commanding Officer",
        "clearance_level": 4,
        "description": "Unit-level tactical oversight, aggregated readiness metrics, and duty deployment management.",
    },
    SystemRole.WELFARE_OFFICER: {
        "display_name": "Welfare / Medical Officer",
        "clearance_level": 3,
        "description": "Clinical personnel assessments, stress risk diagnosis, interventions, and medical notes.",
    },
    SystemRole.PERSONNEL: {
        "display_name": "Service Personnel",
        "clearance_level": 1,
        "description": "Standard service member. Access limited strictly to personal welfare metrics and self-reports.",
    },
}


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, autoincrement=True)
    role_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(64), nullable=False)
    clearance_level: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="role")

    def __repr__(self) -> str:
        return f"<Role(code={self.role_code}, clearance={self.clearance_level})>"
