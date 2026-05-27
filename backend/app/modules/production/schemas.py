"""
Production Schemas — Modelos de request/response.
====================================================
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class ProductionCreate(BaseModel):
    """Dados para registrar produção mensal."""
    unit_id: UUID
    year: int
    month: int
    quantity: int
    observations: str | None = None

    @field_validator("month")
    @classmethod
    def validate_month(cls, v: int) -> int:
        if not 1 <= v <= 12:
            raise ValueError("Mês deve ser entre 1 e 12")
        return v


class ProductionUpdate(BaseModel):
    """Dados para editar produção (opcionais)."""
    quantity: int | None = None
    observations: str | None = None


class ProductionResponse(BaseModel):
    """Dados de produção mensal."""
    id: UUID
    unit_id: UUID
    unit_name: str | None = None
    year: int
    month: int
    quantity: int
    observations: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductionRanking(BaseModel):
    """Item do ranking de produtividade."""
    position: int
    unit_id: UUID
    unit_name: str
    quantity: int


class ProductionSummary(BaseModel):
    """Resumo mensal de produção (para dashboard)."""
    year: int
    month: int
    total_quantity: int
    unit_count: int
    average_per_unit: float
    growth_percentage: float | None = None  # vs mês anterior


class MonthComparison(BaseModel):
    """Comparação de produção entre meses."""
    year: int
    month: int
    total: int
    growth_pct: float | None = None
