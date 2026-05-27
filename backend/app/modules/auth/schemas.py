"""
Auth Schemas — Modelos de request/response para autenticação.
==============================================================
Schemas Pydantic para validação de dados de entrada e saída.
"""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Dados para login."""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Resposta do login com tokens JWT."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    """Request para renovar o access token."""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Resposta do refresh com novo access token."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Payload decodificado do JWT."""
    sub: str  # user_id como string
    role: str
    exp: int  # timestamp de expiração
