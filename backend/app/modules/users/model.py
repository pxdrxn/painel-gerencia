"""
User Model — Usuário do sistema.
==================================
Representa um usuário com acesso ao painel.
Diferente de Employee (funcionário da operação).

Colunas:
    - id: UUID (PK)
    - email: string (unique)
    - hashed_password: string
    - full_name: string
    - role: enum (admin | supervisor | operacional)
    - is_active: boolean
    - last_login: datetime (nullable)
    + TimestampMixin (created_at, updated_at)
    + SoftDeleteMixin (is_deleted, deleted_at)
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin, SoftDeleteMixin


class User(Base, TimestampMixin, SoftDeleteMixin):
    """Model de usuário do sistema."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    full_name: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(50), nullable=False, default="operacional"
    )  # admin | supervisor | operacional
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
