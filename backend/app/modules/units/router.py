"""
Units Router — CRUD de unidades/lojas.
========================================
Endpoints:
    GET    /api/units          → Lista com disponibilidade calculada
    GET    /api/units/{id}     → Detalhes + funcionários da unidade
    POST   /api/units          → Criar (Admin)
    PATCH  /api/units/{id}     → Editar (Admin)
    DELETE /api/units/{id}     → Soft delete (Admin)
"""

from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.responses import success_response, ApiResponse
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.model import User
from app.core.exceptions import ForbiddenException
from app.modules.units.schemas import UnitCreate, UnitUpdate, UnitResponse, UnitListResponse
from app.modules.units.service import UnitService

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_active_user)):
    """Apenas admin pode gerenciar unidades."""
    if current_user.role != "admin":
        raise ForbiddenException("Apenas administradores podem gerenciar unidades")
    return current_user

@router.get("", response_model=ApiResponse)
async def list_units(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Lista todas as unidades com status operacional."""
    service = UnitService(db)
    units = await service.list_units_with_stats()
    return success_response(data=[UnitListResponse.model_validate(u).model_dump() for u in units])

@router.get("/{unit_id}", response_model=ApiResponse)
async def get_unit(
    unit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Retorna detalhes da unidade."""
    service = UnitService(db)
    unit = await service.get_unit_with_stats(unit_id)
    return success_response(data=UnitResponse.model_validate(unit).model_dump())

@router.post("", response_model=ApiResponse, status_code=201)
async def create_unit(
    data: UnitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Cria unidade."""
    service = UnitService(db)
    unit = await service.create_unit(data)
    return success_response(data={"id": str(unit.id), "name": unit.name}, message="Unidade criada com sucesso")

@router.patch("/{unit_id}", response_model=ApiResponse)
async def update_unit(
    unit_id: UUID,
    data: UnitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Atualiza unidade."""
    service = UnitService(db)
    unit = await service.update_unit(unit_id, data)
    return success_response(data={"id": str(unit.id)}, message="Unidade atualizada")

@router.delete("/{unit_id}", response_model=ApiResponse)
async def delete_unit(
    unit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Deleta unidade."""
    service = UnitService(db)
    await service.delete_unit(unit_id)
    return success_response(message="Unidade removida com sucesso")
