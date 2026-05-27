"""
Units Schemas — Modelos de request/response.
===============================================
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UnitCreate(BaseModel):
    """Dados para criar uma unidade."""
    name: str
    manager_id: UUID | None = None
    phone: str | None = None
    required_attendants: int = 0
    required_pamphletists: int = 0
    required_analysts: int = 0


class UnitUpdate(BaseModel):
    """Dados para atualizar uma unidade (todos opcionais)."""
    name: str | None = None
    manager_id: UUID | None = None
    phone: str | None = None
    required_attendants: int | None = None
    required_pamphletists: int | None = None
    required_analysts: int | None = None
    is_active: bool | None = None


class UnitResponse(BaseModel):
    """Dados completos da unidade (como no PDF: Mapeamento de Unidades)."""
    id: UUID
    name: str
    manager_name: str | None = None  # Nome do responsável (via join)
    phone: str | None
    employee_count: int = 0  # Total de funcionários ativos
    status_operacional: str = "Ativa"  # Ativa | Déficit (calculado)
    required_attendants: int
    required_pamphletists: int
    required_analysts: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UnitListResponse(BaseModel):
    """Item da tabela de unidades (conforme screenshot do PDF)."""
    id: UUID
    name: str
    manager_name: str | None = None
    phone: str | None
    employee_count: int = 0
    status_operacional: str = "Ativa"  # Ativa | Déficit

    model_config = {"from_attributes": True}


class StaffAvailability(BaseModel):
    """Disponibilidade por tipo de cargo."""
    required: int
    current: int
    deficit: int


class UnitAvailability(BaseModel):
    """Disponibilidade operacional de uma unidade (conforme PDF)."""
    unit_id: UUID
    unit_name: str
    manager_name: str | None = None
    attendants: StaffAvailability | None = None
    pamphletists: StaffAvailability | None = None
    analysts: StaffAvailability | None = None
    availability_percent: float = 0.0
    status: str = "completa"  # completa | parcial | critica
