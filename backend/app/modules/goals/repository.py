"""Goals Repository."""
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.repository import BaseRepository
from app.modules.goals.model import UnitGoal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database.repository import BaseRepository
from app.modules.goals.model import UnitGoal
from app.modules.units.model import Unit

class GoalRepository(BaseRepository[UnitGoal]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(UnitGoal, db)
        
    async def get_by_unit_month(self, unit_id, year, month) -> UnitGoal | None:
        query = select(UnitGoal).where(
            UnitGoal.unit_id == unit_id,
            UnitGoal.year == year,
            UnitGoal.month == month
        )
        result = await self.db.execute(query)
        return result.scalars().first()
        
    async def get_monthly_summary(self, year, month) -> list[dict]:
        query = (
            select(
                UnitGoal,
                Unit.name.label("unit_name")
            )
            .join(Unit, UnitGoal.unit_id == Unit.id)
            .where(
                UnitGoal.year == year,
                UnitGoal.month == month
            )
            .order_by(Unit.name)
        )
        result = await self.db.execute(query)
        
        data = []
        for goal, unit_name in result.all():
            pct = 0.0
            if goal.target_value > 0:
                pct = float((goal.achieved_value / goal.target_value) * 100)
                
            data.append({
                "id": goal.id,
                "unit_id": goal.unit_id,
                "unit_name": unit_name,
                "year": goal.year,
                "month": goal.month,
                "target_value": goal.target_value,
                "achieved_value": goal.achieved_value,
                "achievement_pct": round(pct, 2),
                "created_at": goal.created_at
            })
        return data

    async def get_overall_achievement_pct(self, year, month) -> float:
        query = select(
            func.sum(UnitGoal.achieved_value).label("achieved"),
            func.sum(UnitGoal.target_value).label("target")
        ).where(
            UnitGoal.year == year,
            UnitGoal.month == month
        )
        result = await self.db.execute(query)
        row = result.first()
        
        if not row or not row.target or row.target == 0:
            return 0.0
            
        return round(float((row.achieved / row.target) * 100), 2)
