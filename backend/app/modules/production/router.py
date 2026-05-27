"""
Production Router — Produção mensal.
=======================================
Endpoints:
    GET    /api/production              → Produção mensal (filtros: mês, ano, unidade)
    POST   /api/production              → Registrar produção (Todos)
    PATCH  /api/production/{id}         → Editar (Admin, Supervisor)
    GET    /api/production/ranking      → Ranking de produtividade
    GET    /api/production/comparison   → Comparação entre meses
"""

from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.responses import success_response, ApiResponse
from app.modules.auth.dependencies import get_current_active_user, require_manager_role
from app.modules.users.model import User
from app.modules.production.schemas import ProductionCreate, ProductionUpdate
from app.modules.production.service import ProductionService

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def get_production(
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = ProductionService(db)
    summary = await service.get_monthly_summary(year, month)
    return success_response(data=summary.model_dump())

@router.post("", response_model=ApiResponse, status_code=201)
async def register_production(
    data: ProductionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = ProductionService(db)
    prod = await service.register_production(data)
    return success_response(data={"id": str(prod.id)}, message="Produção registrada")

@router.patch("/{production_id}", response_model=ApiResponse)
async def update_production(
    production_id: UUID,
    data: ProductionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    service = ProductionService(db)
    prod = await service.update_production(production_id, data)
    return success_response(data={"id": str(prod.id)}, message="Produção atualizada")

@router.get("/ranking", response_model=ApiResponse)
async def get_ranking(
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month),
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = ProductionService(db)
    ranking = await service.get_ranking(year, month, limit)
    return success_response(data=[r.model_dump() for r in ranking])

@router.get("/comparison", response_model=ApiResponse)
async def get_comparison(
    year: int = Query(default_factory=lambda: date.today().year),
    months: list[int] = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = ProductionService(db)
    comparison = await service.get_comparison(year, months)
    return success_response(data=[c.model_dump() for c in comparison])
