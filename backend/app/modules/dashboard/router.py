"""
Dashboard Router — Painel de Controle Unificado.
===================================================
Endpoint:
    GET /api/dashboard/metrics → Métricas consolidadas de todos os módulos
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.responses import success_response
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.model import User
from app.modules.dashboard.service import DashboardService

router = APIRouter()

@router.get("/metrics", response_model=dict)
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = DashboardService(db)
    metrics = await service.get_metrics()
    return success_response(data=metrics.model_dump())
