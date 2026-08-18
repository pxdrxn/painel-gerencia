"""
Daily Rates Schemas — Modelos Pydantic para validação e serialização.
"""

from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator


class DayBreakdownItem(BaseModel):
    """Detalhe de um dia apurado no período."""
    date: date
    day_of_week: int  # 0=Segunda, 6=Domingo
    day_name: str  # Seg, Ter, Qua, Qui, Sex, Sáb, Dom
    is_workday: bool
    occurrence: str  # normal | sabado_escala | sabado_meiodia | sabado_folga | falta | folga | ferias | domingo
    rate_factor: float  # 1.0, 0.5, 0.0
    notes: str | None = None


class DailyRatePreviewRequest(BaseModel):
    """Parâmetros para simulação e cálculo prévio de diárias."""
    employee_id: UUID
    start_date: date
    end_date: date
    daily_value: float = Field(default=0.0, ge=0)
    rule_type: str = Field(default="seg_sab")  # seg_sex | seg_sab | todos
    work_saturdays: bool = True
    discount_absences: bool = True
    discount_vacations: bool = True
    additions_value: float = Field(default=0.0, ge=0)
    discounts_value: float = Field(default=0.0, ge=0)
    custom_overrides: dict[str, float] | None = None  # data YYYY-MM-DD -> factor

    @model_validator(mode="after")
    def validate_period(self):
        if self.end_date < self.start_date:
            raise ValueError("A data de fim deve ser igual ou posterior à data de início")
        return self


class DailyRatePreviewResponse(BaseModel):
    """Resposta com o cálculo detalhado de diárias."""
    employee_id: UUID
    employee_name: str | None = None
    employee_position: str | None = None
    employee_cpf: str | None = None
    employee_cnpj: str | None = None
    unit_name: str | None = None
    start_date: date
    end_date: date
    total_calendar_days: int
    total_workdays_scheduled: float
    absences_deducted: int
    vacations_deducted: int
    saturday_half_days: int
    effective_days_count: float
    daily_value: float
    subtotal_value: float
    additions_value: float
    discounts_value: float
    total_value: float
    breakdown: list[DayBreakdownItem]


class DailyRateCreate(BaseModel):
    """Dados para salvar um lançamento de diárias."""
    employee_id: UUID
    start_date: date
    end_date: date
    daily_value: float = Field(ge=0)
    days_count: float = Field(ge=0)
    total_value: float = Field(ge=0)
    rule_type: str = "seg_sab"
    work_saturdays: bool = True
    discount_absences: bool = True
    discount_vacations: bool = True
    absences_deducted: int = 0
    vacations_deducted: int = 0
    saturday_half_days: int = 0
    additions_value: float = 0.0
    discounts_value: float = 0.0
    status: str = "pendente"  # pendente | aprovado | pago | cancelado
    payment_date: date | None = None
    notes: str | None = None
    details_breakdown: list[dict] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_period(self):
        if self.end_date < self.start_date:
            raise ValueError("A data de término não pode ser anterior à data de início")
        return self


class DailyRateUpdate(BaseModel):
    """Dados para atualizar um lançamento de diárias."""
    status: str | None = None  # pendente | aprovado | pago | cancelado
    payment_date: date | None = None
    notes: str | None = None
    daily_value: float | None = None
    additions_value: float | None = None
    discounts_value: float | None = None
    total_value: float | None = None


class DailyRateResponse(BaseModel):
    """Modelo de resposta completo para a API."""
    id: UUID
    employee_id: UUID
    employee_name: str | None = None
    employee_position: str | None = None
    employee_cpf: str | None = None
    employee_cnpj: str | None = None
    unit_name: str | None = None
    start_date: date
    end_date: date
    daily_value: float
    days_count: float
    total_value: float
    rule_type: str
    work_saturdays: bool
    discount_absences: bool
    discount_vacations: bool
    absences_deducted: int
    vacations_deducted: int
    saturday_half_days: int
    additions_value: float
    discounts_value: float
    status: str
    payment_date: date | None = None
    notes: str | None = None
    details_breakdown: list[dict]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
