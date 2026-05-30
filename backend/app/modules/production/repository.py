"""
Production Repository — Acesso a dados de produção.
======================================================
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.repository import BaseRepository
from app.modules.production.model import MonthlyProduction


class ProductionRepository(BaseRepository[MonthlyProduction]):
    """Repository de produção mensal."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(MonthlyProduction, db)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_, and_

from app.database.repository import BaseRepository
from app.modules.production.model import MonthlyProduction
from app.modules.employees.model import Employee
from app.modules.units.model import Unit


class ProductionRepository(BaseRepository[MonthlyProduction]):
    """Repository de produção mensal."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(MonthlyProduction, db)

    async def get_by_unit_month(self, unit_id, year, month) -> MonthlyProduction | None:
        query = select(MonthlyProduction).where(
            MonthlyProduction.unit_id == unit_id,
            MonthlyProduction.year == year,
            MonthlyProduction.month == month
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_monthly_total(self, year, month) -> float:
        query = select(func.sum(MonthlyProduction.quantity)).where(
            MonthlyProduction.year == year,
            MonthlyProduction.month == month
        )
        result = await self.db.execute(query)
        return float(result.scalar() or 0.0)

    async def get_unit_count_in_month(self, year, month) -> int:
        query = select(func.count(MonthlyProduction.id)).where(
            MonthlyProduction.year == year,
            MonthlyProduction.month == month,
            MonthlyProduction.quantity > 0
        )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_ranking(self, year, month, limit=10) -> list[dict]:
        query = (
            select(
                MonthlyProduction.unit_id,
                Unit.name.label("unit_name"),
                MonthlyProduction.quantity,
                MonthlyProduction.observations
            )
            .join(Unit, MonthlyProduction.unit_id == Unit.id)
            .where(
                MonthlyProduction.year == year,
                MonthlyProduction.month == month
            )
            .order_by(desc(MonthlyProduction.quantity))
            .limit(limit)
        )
        result = await self.db.execute(query)
        
        ranking = []
        for i, row in enumerate(result.all(), start=1):
            ranking.append({
                "position": i,
                "unit_id": row.unit_id,
                "unit_name": row.unit_name,
                "quantity": float(row.quantity),
                "observations": row.observations
            })
        return ranking

    async def get_monthly_totals_range(self, start_year, start_month, end_year, end_month) -> list[dict]:
        query = (
            select(
                MonthlyProduction.year,
                MonthlyProduction.month,
                func.sum(MonthlyProduction.quantity).label("total")
            )
            .where(
                or_(
                    and_(MonthlyProduction.year == start_year, MonthlyProduction.month >= start_month),
                    and_(MonthlyProduction.year == end_year, MonthlyProduction.month <= end_month),
                    and_(MonthlyProduction.year > start_year, MonthlyProduction.year < end_year)
                )
            )
            .group_by(MonthlyProduction.year, MonthlyProduction.month)
            .order_by(MonthlyProduction.year, MonthlyProduction.month)
        )
        result = await self.db.execute(query)
        return [{"year": row.year, "month": row.month, "total": row.total or 0} for row in result.all()]
