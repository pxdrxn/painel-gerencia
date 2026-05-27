"""
Vacation Model — Registro de férias de funcionário.
=====================================================
Colunas:
    - id: UUID (PK)
    - employee_id: UUID (FK → employees)
    - start_date: date — Data de saída
    - end_date: date — Data de retorno
    - status: enum (agendada | em_andamento | concluida | cancelada)
    - observations: text
    + TimestampMixin (created_at, updated_at)
    - created_by: UUID (FK → users)

Constraints:
    - CHECK: end_date > start_date
    - INDEX: (employee_id, start_date, end_date) para detecção de conflitos
"""

import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class Vacation(Base, TimestampMixin):
    """Model de férias."""

    __tablename__ = "vacations"

    # --- Constraints ---
    __table_args__ = (
        CheckConstraint("end_date > start_date", name="ck_vacation_dates"),
        Index("ix_vacation_period", "employee_id", "start_date", "end_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True
    )
    start_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    end_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="agendada"
    )  # agendada | em_andamento | concluida | cancelada
    observations: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # --- Relationships ---
    employee = relationship("Employee", back_populates="vacations", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Vacation {self.employee_id} {self.start_date}→{self.end_date} ({self.status})>"
