"""
DailyRate Model — Registro e cálculo de diárias de funcionários.
================================================================
Colunas:
    - id: UUID (PK)
    - employee_id: UUID (FK → employees)
    - start_date: date — Início do período
    - end_date: date — Fim do período
    - daily_value: numeric(10, 2) — Valor unitário da diária
    - days_count: numeric(5, 2) — Quantidade de diárias apuradas
    - total_value: numeric(10, 2) — Valor total líquido a pagar
    - rule_type: string(30) — 'seg_sex' | 'seg_sab' | 'todos'
    - work_saturdays: boolean
    - discount_absences: boolean
    - discount_vacations: boolean
    - absences_deducted: int
    - vacations_deducted: int
    - saturday_half_days: int
    - additions_value: numeric(10, 2)
    - discounts_value: numeric(10, 2)
    - status: string(20) — 'pendente' | 'aprovado' | 'pago' | 'cancelado'
    - payment_date: date
    - notes: text
    - details_breakdown: json (lista com cada dia apurado e status)
    - created_by: UUID (FK → users)
    + TimestampMixin (created_at, updated_at)
"""

import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class DailyRate(Base, TimestampMixin):
    """Model de apuração e controle de diárias."""

    __tablename__ = "daily_rates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True
    )
    start_date: Mapped[date] = mapped_column(
        Date, nullable=False, index=True
    )
    end_date: Mapped[date] = mapped_column(
        Date, nullable=False, index=True
    )
    daily_value: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.0
    )
    days_count: Mapped[float] = mapped_column(
        Numeric(5, 2), nullable=False, default=0.0
    )
    total_value: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.0
    )
    rule_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="seg_sab"
    )  # seg_sex | seg_sab | todos
    work_saturdays: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    discount_absences: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    discount_vacations: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    absences_deducted: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    vacations_deducted: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    saturday_half_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    additions_value: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.0
    )
    discounts_value: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.0
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pendente", index=True
    )  # pendente | aprovado | pago | cancelado
    payment_date: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )
    notes: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    details_breakdown: Mapped[list] = mapped_column(
        JSON, nullable=False, default=list
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # --- Relationships ---
    employee = relationship("Employee", lazy="selectin")

    def __repr__(self) -> str:
        return f"<DailyRate {self.employee_id} {self.start_date}→{self.end_date}: {self.days_count} dias = R${self.total_value} ({self.status})>"
