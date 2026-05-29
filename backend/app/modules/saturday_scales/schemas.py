"""SaturdayScales Schemas."""

from datetime import date as dt_date
from uuid import UUID
from pydantic import BaseModel, field_validator


class SaturdayScaleCreate(BaseModel):
    employee_id: UUID
    date: dt_date
    action: str = "pendente"  # folgou | largou_12h | pendente

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        allowed = {"folgou", "largou_12h", "pendente"}
        if v not in allowed:
            raise ValueError("Ação deve ser 'folgou', 'largou_12h' ou 'pendente'")
        return v


class SaturdayScaleUpdate(BaseModel):
    action: str  # folgou | largou_12h | pendente

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        allowed = {"folgou", "largou_12h", "pendente"}
        if v not in allowed:
            raise ValueError("Ação deve ser 'folgou', 'largou_12h' ou 'pendente'")
        return v


class SaturdayScaleResponse(BaseModel):
    id: UUID
    employee_id: UUID
    employee_name: str
    employee_position: str
    unit_name: str
    date: dt_date
    action: str

    model_config = {"from_attributes": True}
