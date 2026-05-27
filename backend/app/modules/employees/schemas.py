"""
Employees Schemas — Modelos de request/response.
===================================================
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class EmployeeCreate(BaseModel):
    """Dados para cadastrar um funcionário."""
    name: str
    cpf: str | None = None
    phone: str | None = None
    email: str | None = None
    position: str  # atendente | panfletista | analista | gerente | supervisor
    unit_id: UUID | None = None
    hire_date: date
    status: str = "ativo"
    observations: str | None = None
    absences: int = 0
    medical_leaves: int = 0

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, v: str | None) -> str | None:
        """Valida formato do CPF (000.000.000-00) e os dígitos verificadores."""
        if not v:
            return None
            
        import re
        
        if not re.match(r"^\d{3}\.\d{3}\.\d{3}-\d{2}$", v):
            raise ValueError("CPF deve estar no formato 000.000.000-00")
            
        # Algoritmo de validação de CPF
        cpf_digits = [int(digit) for digit in v if digit.isdigit()]
        if len(cpf_digits) != 11 or len(set(cpf_digits)) == 1:
            raise ValueError("CPF inválido")
            
        # Primeiro dígito
        soma1 = sum(cpf_digits[i] * (10 - i) for i in range(9))
        digito1 = (soma1 * 10) % 11
        if digito1 == 10:
            digito1 = 0
        if digito1 != cpf_digits[9]:
            raise ValueError("CPF inválido")
            
        # Segundo dígito
        soma2 = sum(cpf_digits[i] * (11 - i) for i in range(10))
        digito2 = (soma2 * 10) % 11
        if digito2 == 10:
            digito2 = 0
        if digito2 != cpf_digits[10]:
            raise ValueError("CPF inválido")
            
        return v

    @field_validator("position")
    @classmethod
    def validate_position(cls, v: str) -> str:
        """Valida que o cargo é um dos valores permitidos."""
        allowed = {"atendente", "panfletista", "analista", "gerente", "supervisor"}
        if v not in allowed:
            raise ValueError(f"Cargo inválido. Permitidos: {allowed}")
        return v


class EmployeeUpdate(BaseModel):
    """Dados para atualizar um funcionário (todos opcionais)."""
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    position: str | None = None
    unit_id: UUID | None = None
    hire_date: date | None = None
    status: str | None = None
    observations: str | None = None
    absences: int | None = None
    medical_leaves: int | None = None
    available_unit_ids: list[UUID] | None = None

    @field_validator("position")
    @classmethod
    def validate_position(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"atendente", "panfletista", "analista", "gerente", "supervisor"}
        if v not in allowed:
            raise ValueError(f"Cargo inválido. Permitidos: {allowed}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"ativo", "inativo", "ferias", "afastado"}
        if v not in allowed:
            raise ValueError(f"Status inválido. Permitidos: {allowed}")
        return v


class EmployeeResponse(BaseModel):
    """Dados completos do funcionário."""
    id: UUID
    name: str
    cpf: str | None
    phone: str | None
    email: str | None
    position: str
    unit_id: UUID | None
    unit_name: str | None = None  # Populated via join
    hire_date: date
    status: str
    observations: str | None
    absences: int = 0
    medical_leaves: int = 0
    available_unit_ids: list[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmployeeListResponse(BaseModel):
    """Item da lista de funcionários (resumido para tabela)."""
    id: UUID
    name: str
    cpf: str | None
    position: str
    unit_id: UUID | None
    unit_name: str | None = None
    status: str
    hire_date: date
    absences: int = 0
    medical_leaves: int = 0
    available_unit_ids: list[str] = []

    model_config = {"from_attributes": True}


class EmployeeStatusCount(BaseModel):
    """Contagem de funcionários por status (para dashboard)."""
    ativo: int = 0
    inativo: int = 0
    ferias: int = 0
    afastado: int = 0
    total: int = 0
