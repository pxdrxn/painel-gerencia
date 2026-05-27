"""
Employee Model — Funcionário da operação S.O.S Crédito.
=========================================================
Representa um funcionário que trabalha nas unidades/lojas.
Diferente de User (usuário do sistema).

Colunas:
    - id: UUID (PK)
    - name: string
    - cpf: string (unique)
    - phone: string
    - email: string
    - position: enum (atendente | panfletista | analista | gerente | supervisor)
    - unit_id: UUID (FK → units)
    - hire_date: date
    - status: enum (ativo | inativo | ferias | afastado)
    - observations: text
    - absences: int (folgas/faltas)
    - medical_leaves: int (atestados médicos)
    + TimestampMixin (created_at, updated_at)
    + SoftDeleteMixin (is_deleted, deleted_at)
    + AuditMixin (created_by, updated_by)

Relationships:
    - unit: Unit (many-to-one)
    - vacations: list[Vacation] (one-to-many)
    - productions: list[MonthlyProduction] (one-to-many)
"""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, SoftDeleteMixin, AuditMixin


class Employee(Base, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """Model de funcionário da operação."""

    __tablename__ = "employees"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    cpf: Mapped[str] = mapped_column(
        String(14), unique=True, nullable=False, index=True
    )  # Formato: 000.000.000-00
    phone: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # Formato: (11) 9999-9999
    email: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    position: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # atendente | panfletista | analista | gerente | supervisor
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id"), nullable=False, index=True
    )
    hire_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ativo", index=True
    )  # ativo | inativo | ferias | afastado
    observations: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    absences: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Quantidade de folgas/faltas
    medical_leaves: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # Quantidade de atestados médicos
    available_unit_ids: Mapped[list] = mapped_column(
        JSON, nullable=False, default=list
    )  # IDs das unidades onde o funcionário tem disponibilidade

    # --- Relationships ---
    unit = relationship("Unit", back_populates="employees", foreign_keys=[unit_id], lazy="selectin")
    vacations = relationship("Vacation", back_populates="employee")

    @property
    def unit_name(self) -> str | None:
        """Retorna o nome da unidade associada."""
        return self.unit.name if self.unit else None

    def __repr__(self) -> str:
        return f"<Employee {self.name} ({self.position}) — {self.status}>"
