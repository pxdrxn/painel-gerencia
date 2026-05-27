"""
Base declarativa e Mixins reutilizáveis.
=========================================
Define a base do SQLAlchemy e os mixins que TODOS os models herdam.

Mixins disponíveis:
    - TimestampMixin: created_at, updated_at
    - SoftDeleteMixin: is_deleted, deleted_at
    - AuditMixin: created_by, updated_by

Todos os models de negócio devem herdar de Base + os mixins necessários:

    class Employee(Base, TimestampMixin, SoftDeleteMixin, AuditMixin):
        __tablename__ = "employees"
        ...

Dependências:
    - sqlalchemy >= 2.0
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base declarativa para todos os models."""
    pass


class TimestampMixin:
    """
    Adiciona colunas de timestamp automáticas.

    Colunas:
        - created_at: preenchido automaticamente na criação (server-side)
        - updated_at: atualizado automaticamente em cada update
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """
    Soft delete transparente.

    Colunas:
        - is_deleted: flag boolean (indexado para performance)
        - deleted_at: timestamp de quando foi deletado

    O filtro automático (is_deleted=False) é aplicado via event listener
    no session.py, tornando o soft delete transparente para queries normais.

    Para incluir deletados, usar execution option:
        session.execute(select(Model).execution_options(include_deleted=True))
    """
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        index=True,
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )


class AuditMixin:
    """
    Rastreia quem criou e modificou o registro.

    Colunas:
        - created_by: UUID do usuário que criou
        - updated_by: UUID do usuário que fez a última atualização

    Preenchido automaticamente pelo middleware de auditoria
    usando o user_id do JWT.
    """
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
