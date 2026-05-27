"""
Users Schemas — Modelos de request/response.
===============================================
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserCreate(BaseModel):
    """Dados para criar um usuário."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    role: str = "operacional"  # admin | supervisor | operacional

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Valida que a senha atende aos critérios de complexidade."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("A senha deve conter pelo menos uma letra maiúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("A senha deve conter pelo menos uma letra minúscula")
        if not re.search(r"[0-9]", v):
            raise ValueError("A senha deve conter pelo menos um número")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("A senha deve conter pelo menos um caractere especial (!@#$%^&*(),.?\":{}|<>)")
        return v


class UserUpdate(BaseModel):
    """Dados para atualizar um usuário (todos opcionais)."""
    email: EmailStr | None = None
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    """Dados do usuário retornados pela API (sem senha)."""
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    last_login: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """Item da lista de usuários (resumido)."""
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
