"""SaturdayScales Router."""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import ApiResponse, success_response
from app.database.session import get_db
from app.modules.auth.dependencies import get_current_active_user
from app.modules.saturday_scales.schemas import SaturdayScaleCreate, SaturdayScaleUpdate
from app.modules.saturday_scales.service import SaturdayScaleService
from app.modules.users.model import User

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def list_saturday_scale(
    date: date = Query(..., description="Data do sábado a ser consultado (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = SaturdayScaleService(db)
    scales = await service.list_saturday_scale(date)
    return success_response(data=scales)


@router.post("", response_model=ApiResponse, status_code=201)
async def add_employee_to_scale(
    data: SaturdayScaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = SaturdayScaleService(db)
    scale = await service.add_employee_to_scale(data, created_by=current_user.id)
    await db.commit()
    return success_response(data={"id": str(scale.id)}, message="Colaborador adicionado à escala com sucesso")


@router.patch("/{scale_id}", response_model=ApiResponse)
async def update_action(
    scale_id: UUID,
    data: SaturdayScaleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = SaturdayScaleService(db)
    scale = await service.update_action(scale_id, data)
    await db.commit()
    return success_response(data={"id": str(scale.id)}, message="Escala do colaborador atualizada com sucesso")


@router.delete("/{scale_id}", response_model=ApiResponse)
async def remove_employee_from_scale(
    scale_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = SaturdayScaleService(db)
    await service.remove_employee_from_scale(scale_id)
    await db.commit()
    return success_response(message="Colaborador removido da escala de sábado")
