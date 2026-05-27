"""
Auth Router — Endpoints de autenticação.
==========================================
Endpoints:
    POST /api/auth/login      → Login (retorna JWT tokens)
    POST /api/auth/logout     → Logout (invalida sessão)
    POST /api/auth/refresh    → Renova access token via refresh token
    GET  /api/auth/me         → Retorna dados do usuário autenticado
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.core.responses import success_response
from app.modules.auth.schemas import LoginRequest, TokenRefreshRequest
from app.modules.auth.service import AuthService
from app.modules.auth.dependencies import get_current_user, oauth2_scheme
from app.modules.users.schemas import UserResponse
from app.modules.users.model import User
from app.core.limiter import limiter

router = APIRouter()


@router.post("/login", response_model=dict)
@limiter.limit("5/minute")
async def login(
    request: Request,
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Autentica o usuário e retorna tokens JWT.
    """
    service = AuthService(db)
    result = await service.authenticate(credentials.email, credentials.password)
    return success_response(data=result, message="Login realizado com sucesso")


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Logout do usuário, revogando o access token atual.
    """
    from app.modules.auth.model import RevokedToken
    from app.core.security import verify_token
    from datetime import datetime, timezone

    # Extrair expiração do token para persistir apenas o tempo necessário
    try:
        payload = verify_token(token, expected_type="access")
        exp_timestamp = payload.get("exp")
        expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc).replace(tzinfo=None) if exp_timestamp else datetime.now(timezone.utc).replace(tzinfo=None)
    except Exception:
        expires_at = datetime.now(timezone.utc).replace(tzinfo=None)

    revoked = RevokedToken(token=token, expires_at=expires_at)
    db.add(revoked)
    await db.commit()

    return success_response(message="Logout realizado com sucesso")


@router.post("/refresh", response_model=dict)
async def refresh_token(
    body: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Renova o access token usando o refresh token (com rotação).
    """
    service = AuthService(db)
    result = await service.refresh_access_token(body.refresh_token)
    return success_response(data=result, message="Token renovado com sucesso")


@router.get("/me", response_model=dict)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Retorna dados do usuário autenticado.
    """
    user_data = UserResponse.model_validate(current_user).model_dump()
    return success_response(data=user_data)
