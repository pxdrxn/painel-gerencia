"""
Auth Models — RevokedToken model.
=================================
"""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class RevokedToken(Base):
    """
    Model para armazenar tokens revogados (blacklist).
    Utilizado para invalidar sessões após o logout.
    """

    __tablename__ = "revoked_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    token: Mapped[str] = mapped_column(
        String(500), unique=True, index=True, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )

    def __repr__(self) -> str:
        return f"<RevokedToken {self.token[:20]}... expires_at={self.expires_at}>"
