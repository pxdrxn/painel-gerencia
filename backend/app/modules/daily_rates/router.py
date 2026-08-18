"""
Daily Rates Router — Endpoints REST para Diárias.
"""

from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import ApiResponse, success_response
from app.database.session import get_db
from app.modules.auth.dependencies import get_current_active_user, require_manager_role
from app.modules.daily_rates.schemas import (
    DailyRateCreate,
    DailyRatePreviewRequest,
    DailyRateUpdate,
)
from app.modules.daily_rates.service import DailyRateService
from app.modules.users.model import User

router = APIRouter()


@router.post("/preview", response_model=ApiResponse)
async def preview_daily_rate(
    data: DailyRatePreviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Calcula e retorna a prévia dia a dia das diárias de um funcionário no período."""
    service = DailyRateService(db)
    result = await service.preview_calculation(data)
    return success_response(data=result.model_dump())


@router.get("", response_model=ApiResponse)
async def list_daily_rates(
    employee_id: UUID | None = Query(None, description="Filtrar por colaborador"),
    status: str | None = Query(None, description="Filtrar por status"),
    start_date: date | None = Query(None, description="Filtrar por data início"),
    end_date: date | None = Query(None, description="Filtrar por data fim"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Lista o histórico de apurações de diárias."""
    service = DailyRateService(db)
    records = await service.list_records(
        employee_id=employee_id,
        status=status,
        start_date=start_date,
        end_date=end_date,
    )
    return success_response(data=[r.model_dump() for r in records])


@router.post("", response_model=ApiResponse, status_code=201)
async def create_daily_rate(
    data: DailyRateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    """Salva um lançamento de diária apurada."""
    service = DailyRateService(db)
    record = await service.create_record(data, created_by=current_user.id)
    return success_response(
        data=record.model_dump(),
        message="Lançamento de diárias salvo com sucesso!",
    )


@router.get("/{record_id}", response_model=ApiResponse)
async def get_daily_rate(
    record_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Obtém detalhes de um lançamento de diárias."""
    service = DailyRateService(db)
    record = await service.get_by_id(record_id)
    return success_response(data=record.model_dump())


@router.patch("/{record_id}", response_model=ApiResponse)
async def update_daily_rate(
    record_id: UUID,
    data: DailyRateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    """Atualiza um lançamento de diárias (status, pagamento, notas)."""
    service = DailyRateService(db)
    updated = await service.update_record(record_id, data)
    return success_response(
        data=updated.model_dump(),
        message="Lançamento de diárias atualizado com sucesso!",
    )


@router.delete("/{record_id}", response_model=ApiResponse)
async def delete_daily_rate(
    record_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    """Exclui um lançamento de diárias."""
    service = DailyRateService(db)
    await service.delete_record(record_id)
    return success_response(message="Lançamento de diárias excluído com sucesso!")
