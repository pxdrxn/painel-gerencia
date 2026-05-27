"""
Unit Model — Unidade/Loja da S.O.S Crédito.
==============================================
Representa uma unidade de negócio (loja/filial).

Colunas:
    - id: UUID (PK)
    - name: string (unique) — Ex: "S.O.S Matriz", "S.O.S Unidade Sul"
    - manager_id: UUID (FK → employees) — Responsável da unidade
    - phone: string — Telefone da unidade
    - required_attendants: int — Qtd necessária de atendentes
    - required_pamphletists: int — Qtd necessária de panfletistas
    - required_analysts: int — Qtd necessária de analistas
    - is_active: boolean
    + TimestampMixin (created_at, updated_at)
    + SoftDeleteMixin (is_deleted, deleted_at)

Relationships:
    - manager: Employee (FK)
    - employees: list[Employee]
    - goals: list[UnitGoal]
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, SoftDeleteMixin


class Unit(Base, TimestampMixin, SoftDeleteMixin):
    """Model de unidade/loja."""

    __tablename__ = "units"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    manager_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True
    )
    phone: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    required_attendants: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    required_pamphletists: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    required_analysts: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # --- Relationships ---
    manager = relationship("Employee", foreign_keys=[manager_id])
    employees = relationship("Employee", back_populates="unit", foreign_keys="[Employee.unit_id]")
    goals = relationship("UnitGoal", back_populates="unit")
    productions = relationship("MonthlyProduction", back_populates="unit")

    def __repr__(self) -> str:
        return f"<Unit {self.name}>"
