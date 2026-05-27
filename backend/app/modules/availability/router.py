"""
Availability Router — Disponibilidade operacional.
=====================================================
Endpoints (somente leitura):
    GET /api/availability           → Disponibilidade de todas as unidades
    GET /api/availability/{unit_id} → Disponibilidade de uma unidade
"""

from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.responses import success_response
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.model import User
from app.modules.availability.service import AvailabilityService

router = APIRouter()

@router.get("", response_model=dict)
async def get_all_availability(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Disponibilidade de todas as unidades."""
    service = AvailabilityService(db)
    summary = await service.get_all_availability()
    return success_response(data=summary.model_dump())

@router.get("/{unit_id}", response_model=dict)
async def get_unit_availability(
    unit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Disponibilidade de uma unidade específica."""
    service = AvailabilityService(db)
    avail = await service.get_unit_availability(unit_id)
    return success_response(data=avail.model_dump())
