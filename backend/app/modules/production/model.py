"""
MonthlyProduction Model — Produção mensal de funcionário.
==========================================================
Colunas:
    - id: UUID (PK)
    - employee_id: UUID (FK → employees)
    - year: int
    - month: int (1-12)
    - quantity: int — Produção do mês
    - observations: text
    + TimestampMixin (created_at, updated_at)

Constraints:
    - UNIQUE (employee_id, year, month) — Um registro por funcionário/mês
"""

import uuid

from sqlalchemy import ForeignKey, Integer, Numeric, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class MonthlyProduction(Base, TimestampMixin):
    """Model de produção mensal."""

    __tablename__ = "monthly_production"

    __table_args__ = (
        UniqueConstraint("unit_id", "year", "month", name="uq_prod_unit_month"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    month: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # 1-12
    quantity: Mapped[float] = mapped_column(
        Numeric(precision=15, scale=2), nullable=False, default=0.0
    )
    observations: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    # --- Relationships ---
    unit = relationship("Unit", back_populates="productions")

    def __repr__(self) -> str:
        return f"<Production {self.unit_id} {self.month}/{self.year}: {self.quantity}>"
