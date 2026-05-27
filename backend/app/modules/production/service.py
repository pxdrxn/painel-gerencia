"""
Production Service — Regras de negócio para produção mensal.
==============================================================
Regras:
    - Um registro por funcionário/mês (UNIQUE constraint)
    - Calcular total mensal (soma de todos os funcionários)
    - Calcular crescimento percentual entre meses
    - Gerar ranking por quantidade
"""

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException, BusinessRuleException
from app.modules.production.repository import ProductionRepository
from app.modules.production.schemas import ProductionCreate, ProductionUpdate, ProductionSummary, ProductionRanking, MonthComparison
from app.modules.production.model import MonthlyProduction


class ProductionService:
    """Service de produção mensal."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ProductionRepository(db)

    async def register_production(self, data: ProductionCreate) -> MonthlyProduction:
        existing = await self.repo.get_by_unit_month(data.unit_id, data.year, data.month)
        if existing:
            prod = await self.repo.update(existing.id, {"quantity": data.quantity, "observations": data.observations})
        else:
            prod = await self.repo.create(data.model_dump())
            
        # Sync with UnitGoal achieved_value
        from app.modules.goals.repository import GoalRepository
        goal_repo = GoalRepository(self.db)
        goal_existing = await goal_repo.get_by_unit_month(data.unit_id, data.year, data.month)
        if goal_existing:
            await goal_repo.update(goal_existing.id, {"achieved_value": data.quantity})
        else:
            await goal_repo.create({
                "unit_id": data.unit_id,
                "year": data.year,
                "month": data.month,
                "target_value": 0,
                "achieved_value": data.quantity
            })
            
        return prod

    async def update_production(self, production_id: UUID, data: ProductionUpdate) -> MonthlyProduction:
        prod = await self.repo.get_by_id(production_id)
        if not prod:
            raise NotFoundException("Registro de produção não encontrado")
            
        return await self.repo.update(production_id, data.model_dump(exclude_unset=True))

    async def get_monthly_summary(self, year: int, month: int) -> ProductionSummary:
        total = await self.repo.get_monthly_total(year, month)
        unit_count = await self.repo.get_unit_count_in_month(year, month)
        
        avg = total / unit_count if unit_count > 0 else 0.0
        growth = await self.get_growth_percentage(year, month)
        
        return ProductionSummary(
            year=year,
            month=month,
            total_quantity=total,
            unit_count=unit_count,
            average_per_unit=round(avg, 2),
            growth_percentage=growth
        )

    async def get_ranking(self, year: int, month: int, limit: int = 10) -> list[ProductionRanking]:
        ranking_dicts = await self.repo.get_ranking(year, month, limit)
        return [ProductionRanking.model_validate(r) for r in ranking_dicts]

    async def get_comparison(self, year: int, months: list[int]) -> list[MonthComparison]:
        if not months:
            return []
            
        start_month = min(months)
        end_month = max(months)
        
        totals = await self.repo.get_monthly_totals_range(year, start_month, year, end_month)
        
        results = []
        for i, t in enumerate(totals):
            growth = None
            if i > 0:
                prev_total = totals[i-1]["total"]
                if prev_total > 0:
                    growth = round(((t["total"] - prev_total) / prev_total) * 100, 2)
                elif t["total"] > 0:
                    growth = 100.0
                    
            if t["month"] in months:
                results.append(MonthComparison(
                    year=t["year"],
                    month=t["month"],
                    total=t["total"],
                    growth_pct=growth
                ))
                
        return results

    async def get_growth_percentage(self, year: int, month: int) -> float | None:
        curr_total = await self.repo.get_monthly_total(year, month)
        
        prev_month = month - 1
        prev_year = year
        if prev_month == 0:
            prev_month = 12
            prev_year -= 1
            
        prev_total = await self.repo.get_monthly_total(prev_year, prev_month)
        
        if prev_total == 0:
            return 100.0 if curr_total > 0 else None
            
        return round(((curr_total - prev_total) / prev_total) * 100, 2)
