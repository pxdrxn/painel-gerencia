"""Goals Service — Regras de negócio para metas por unidade."""
from sqlalchemy.ext.asyncio import AsyncSession

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ConflictException, NotFoundException
from app.modules.goals.repository import GoalRepository
from app.modules.goals.schemas import GoalCreate, GoalUpdate
from app.modules.goals.model import UnitGoal

class GoalService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = GoalRepository(db)
        
    async def create_goal(self, data: GoalCreate) -> UnitGoal:
        existing = await self.repo.get_by_unit_month(data.unit_id, data.year, data.month)
        if existing:
            update_data = {"target_value": data.target_value}
            if data.achieved_value != 0:
                update_data["achieved_value"] = data.achieved_value
            else:
                update_data["achieved_value"] = existing.achieved_value
            return await self.repo.update(existing.id, update_data)
        return await self.repo.create(data.model_dump())
        
    async def update_goal(self, goal_id: UUID, data: GoalUpdate) -> UnitGoal:
        goal = await self.repo.get_by_id(goal_id)
        if not goal:
            raise NotFoundException("Meta não encontrada")
        return await self.repo.update(goal_id, data.model_dump(exclude_unset=True))
        
    async def get_goals(self, year: int, month: int) -> list[dict]:
        return await self.repo.get_monthly_summary(year, month)
        
    async def get_monthly_achievement_pct(self, year: int, month: int) -> float:
        return await self.repo.get_overall_achievement_pct(year, month)
