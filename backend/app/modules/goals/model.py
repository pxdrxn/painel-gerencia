"""
UnitGoal Model — Meta mensal por unidade.
============================================
Colunas:
    - id: UUID (PK)
    - unit_id: UUID (FK → units)
    - year: int
    - month: int (1-12)
    - target_value: Decimal — Meta da unidade
    - achieved_value: Decimal — Valor atingido
    + TimestampMixin (created_at, updated_at)

Constraints:
    - UNIQUE (unit_id, year, month) — Uma meta por unidade/mês
"""

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class UnitGoal(Base, TimestampMixin):
    """Model de meta mensal por unidade."""

    __tablename__ = "unit_goals"

    __table_args__ = (
        UniqueConstraint("unit_id", "year", "month", name="uq_goal_unit_month"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    target_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
    )
    achieved_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
    )

    unit = relationship("Unit", back_populates="goals")

    def __repr__(self) -> str:
        return f"<UnitGoal {self.unit_id} {self.month}/{self.year}: {self.achieved_value}/{self.target_value}>"
