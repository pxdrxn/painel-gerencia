"""Absences Router."""
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.responses import success_response, ApiResponse
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.model import User
from app.modules.absences.schemas import AbsenceCreate, AbsenceUpdate
from app.modules.absences.service import AbsenceService

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def list_absences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = AbsenceService(db)
    absences = await service.list_absences()
    return success_response(data=absences)


@router.post("", response_model=ApiResponse, status_code=201)
async def schedule_absence(
    data: AbsenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = AbsenceService(db)
    absence = await service.schedule_absence(data, created_by=current_user.id)
    return success_response(data={"id": str(absence.id)}, message="Folga/falta agendada com sucesso")


@router.patch("/{absence_id}", response_model=ApiResponse)
async def update_absence(
    absence_id: UUID,
    data: AbsenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    service = AbsenceService(db)
    absence = await service.update_absence(absence_id, data)
    return success_response(data={"id": str(absence.id)}, message="Agendamento atualizado com sucesso")

@router.delete("/{absence_id}", response_model=ApiResponse)
async def delete_absence(
    absence_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Exclui registro de folga/falta."""
    service = AbsenceService(db)
    await service.delete_absence(absence_id)
    await db.commit()
    return success_response(message="Agendamento excluído com sucesso")
