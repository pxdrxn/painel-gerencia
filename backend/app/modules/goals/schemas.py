"""Goals Schemas."""
from decimal import Decimal
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, field_validator

class GoalCreate(BaseModel):
    unit_id: UUID
    year: int
    month: int
    target_value: Decimal
    achieved_value: Decimal = Decimal("0")
    @field_validator("month")
    @classmethod
    def validate_month(cls, v: int) -> int:
        if not 1 <= v <= 12:
            raise ValueError("Mês deve ser entre 1 e 12")
        return v

class GoalUpdate(BaseModel):
    target_value: Decimal | None = None
    achieved_value: Decimal | None = None

class GoalResponse(BaseModel):
    id: UUID
    unit_id: UUID
    unit_name: str | None = None
    year: int
    month: int
    target_value: Decimal
    achieved_value: Decimal
    achievement_pct: float = 0.0  # (achieved / target) * 100
    created_at: datetime
    model_config = {"from_attributes": True}
