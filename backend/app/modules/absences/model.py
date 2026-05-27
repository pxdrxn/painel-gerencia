"""
Absence Model — Agendamento de folgas e faltas.
=================================================
Colunas:
    - id: UUID (PK)
    - employee_id: UUID (FK → employees)
    - date: date — Data da folga/falta
    - type: string — "folga" | "falta"
    - status: string — "agendada" | "confirmada" | "cancelada"
    - observations: text
    + TimestampMixin (created_at, updated_at)
    - created_by: UUID (FK → users)
"""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class Absence(Base, TimestampMixin):
    """Model de agendamento de folga ou falta."""

    __tablename__ = "absences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # folga | falta
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="agendada"
    )  # agendada | confirmada | cancelada
    observations: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # --- Relationships ---
    employee = relationship("Employee", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Absence {self.employee_id} on {self.date} ({self.type} - {self.status})>"
