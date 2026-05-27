"""Absences Schemas."""
from datetime import date as dt_date, datetime
from uuid import UUID
from pydantic import BaseModel, field_validator


class AbsenceCreate(BaseModel):
    employee_id: UUID
    date: dt_date
    type: str  # folga | falta
    observations: str | None = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {"folga", "falta"}
        if v not in allowed:
            raise ValueError("Tipo deve ser 'folga' ou 'falta'")
        return v


class AbsenceUpdate(BaseModel):
    date: dt_date | None = None
    type: str | None = None
    status: str | None = None
    observations: str | None = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"folga", "falta"}
        if v not in allowed:
            raise ValueError("Tipo deve ser 'folga' ou 'falta'")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"agendada", "confirmada", "cancelada"}
        if v not in allowed:
            raise ValueError("Status inválido")
        return v


class AbsenceResponse(BaseModel):
    id: UUID
    employee_id: UUID
    employee_name: str | None = None
    date: dt_date
    type: str
    status: str
    observations: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
