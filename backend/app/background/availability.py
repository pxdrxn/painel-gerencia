"""
Background Task — Recálculo de disponibilidade operacional.
==============================================================
Disparado automaticamente quando:
    - Funcionário muda de status (ativo ↔ inativo/férias)
    - Funcionário muda de unidade
    - Férias iniciam ou terminam

Uso nos services:
    from fastapi import BackgroundTasks

    @router.patch("/{id}")
    async def update_employee(
        ...,
        background_tasks: BackgroundTasks,
    ):
        employee = await service.update(...)
        if unit_changed or status_changed:
            background_tasks.add_task(
                recalculate_unit_availability,
                unit_id=employee.unit_id,
            )
"""

from uuid import UUID
import logging
from app.database.session import AsyncSessionLocal
from app.modules.availability.service import AvailabilityService

logger = logging.getLogger(__name__)

async def recalculate_unit_availability(unit_id: UUID) -> None:
    """
    Recalcula a disponibilidade operacional de uma unidade.

    Fluxo:
        1. Buscar configuração da unidade (required_*)
        2. Contar funcionários ativos por cargo na unidade
        3. Calcular déficit e % de disponibilidade
        4. Logar resultado

    Args:
        unit_id: UUID da unidade a recalcular.
    """
    async with AsyncSessionLocal() as db:
        try:
            service = AvailabilityService(db)
            avail = await service.get_unit_availability(unit_id)
            logger.info(f"Availability for unit {unit_id} recalculated: {avail.status} ({avail.availability_percent}%)")
        except Exception as e:
            logger.error(f"Error recalculating availability for unit {unit_id}: {e}")
