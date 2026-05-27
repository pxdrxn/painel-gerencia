"""Goals Router — Metas por unidade."""
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.responses import success_response, ApiResponse
from app.modules.auth.dependencies import get_current_active_user, require_manager_role
from app.modules.users.model import User
from app.modules.goals.schemas import GoalCreate, GoalUpdate, GoalResponse
from app.modules.goals.service import GoalService

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def get_goals(
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = GoalService(db)
    goals = await service.get_goals(year, month)
    return success_response(data=goals)

@router.post("", response_model=ApiResponse, status_code=201)
async def create_goal(
    data: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    service = GoalService(db)
    goal = await service.create_goal(data)
    return success_response(data={"id": str(goal.id)}, message="Meta definida")

@router.patch("/{goal_id}", response_model=ApiResponse)
async def update_goal(
    goal_id: UUID,
    data: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    service = GoalService(db)
    goal = await service.update_goal(goal_id, data)
    return success_response(data={"id": str(goal.id)}, message="Meta atualizada")
