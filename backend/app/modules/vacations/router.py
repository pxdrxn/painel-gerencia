"""
Vacations Router — Controle de férias.
========================================
Endpoints:
    GET    /api/vacations              → Calendário com filtros (status, período)
    POST   /api/vacations              → Agendar férias (Admin, Supervisor)
    PATCH  /api/vacations/{id}         → Editar/cancelar (Admin, Supervisor)
    POST   /api/vacations/{id}/complete → Marcar como concluída (Admin, Supervisor)
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.responses import success_response, ApiResponse
from app.modules.auth.dependencies import get_current_active_user, require_manager_role
from app.modules.users.model import User
from app.modules.vacations.schemas import VacationCreate, VacationUpdate, VacationResponse, VacationCalendarResponse
from app.modules.vacations.service import VacationService

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def list_vacations(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Calendário de férias."""
    service = VacationService(db)
    items = await service.list_calendar(status)
    
    total = len(items)
    on_vacation = sum(1 for v in items if v["status"] == "em_andamento")
    
    data = {
        "vacations": [VacationResponse.model_validate(i).model_dump() for i in items],
        "total": total,
        "on_vacation_count": on_vacation
    }
    
    return success_response(data=data)

@router.post("", response_model=ApiResponse, status_code=201)
async def schedule_vacation(
    data: VacationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    """Agenda férias."""
    service = VacationService(db)
    vacation = await service.schedule_vacation(data, current_user.id)
    return success_response(data={"id": str(vacation.id)}, message="Férias agendadas")

@router.patch("/{vacation_id}", response_model=ApiResponse)
async def update_vacation(
    vacation_id: UUID,
    data: VacationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    """Atualiza férias."""
    service = VacationService(db)
    if data.status == "cancelada":
        await service.cancel_vacation(vacation_id)
        return success_response(message="Férias canceladas")
        
    vacation = await service.update_vacation(vacation_id, data)
    return success_response(data={"id": str(vacation.id)}, message="Férias atualizadas")

@router.post("/{vacation_id}/complete", response_model=ApiResponse)
async def complete_vacation(
    vacation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    """Marca férias como concluídas."""
    service = VacationService(db)
    vacation = await service.complete_vacation(vacation_id)
    return success_response(data={"id": str(vacation.id)}, message="Férias concluídas")
