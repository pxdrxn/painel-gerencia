"""
Vacations Schemas — Modelos de request/response.
===================================================
Conforme layout do PDF: Calendário de Férias.
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, model_validator


class VacationCreate(BaseModel):
    """Dados para agendar férias."""
    employee_id: UUID
    start_date: date
    end_date: date
    observations: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        """Garante que end_date > start_date."""
        if self.end_date <= self.start_date:
            raise ValueError("Data de retorno deve ser posterior à data de saída")
        return self


class VacationUpdate(BaseModel):
    """Dados para editar férias (todos opcionais)."""
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None  # agendada | cancelada
    observations: str | None = None


class VacationResponse(BaseModel):
    """Dados de férias conforme tabela do PDF."""
    id: UUID
    employee_id: UUID
    employee_name: str | None = None  # Via join
    hire_date: date | None = None  # Via join — "Data Contratação" no PDF
    start_date: date  # "Período Saída" no PDF
    end_date: date  # "Retorno" no PDF
    status: str  # Agendado | Disponível | Ok | Concluído
    observations: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class VacationCalendarResponse(BaseModel):
    """Lista de férias para o calendário."""
    vacations: list[VacationResponse]
    total: int
    on_vacation_count: int  # Quantos em férias agora
