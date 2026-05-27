"""
Availability Schemas — Response models para disponibilidade.
==============================================================
"""

from uuid import UUID

from pydantic import BaseModel


class StaffAvailability(BaseModel):
    """Disponibilidade por tipo de cargo."""
    required: int
    current: int
    deficit: int


class UnitAvailabilityResponse(BaseModel):
    """Disponibilidade de uma unidade (conforme tabela do PDF)."""
    unit_id: UUID
    unit_name: str
    manager_name: str | None = None
    attendants_count: int = 0  # Quantidade de atendentes ativos
    pamphletists_count: int = 0
    analyst_name: str | None = None  # Nome do analista (se houver)
    availability_percent: float = 0.0
    status: str = "completa"  # completa | parcial | critica


class AvailabilitySummary(BaseModel):
    """Resumo geral de disponibilidade (para dashboard)."""
    total_units: int
    units_complete: int  # 100% disponível
    units_partial: int  # 50-99%
    units_critical: int  # < 50%
    overall_efficiency: float  # Média de disponibilidade
    units: list[UnitAvailabilityResponse]
