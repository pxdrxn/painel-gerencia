"""
SaturdayScale Model — Controle de escala de sábados.
======================================================
"""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class SaturdayScale(Base, TimestampMixin):
    """Model de controle da escala de sábados."""

    __tablename__ = "saturday_scales"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(
        Date, nullable=False, index=True
    )
    action: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # folgou | largou_12h
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # --- Relationships ---
    employee = relationship("Employee", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_saturday_scale_employee_date"),
    )

    def __repr__(self) -> str:
        return f"<SaturdayScale {self.employee_id} on {self.date} ({self.action})>"
