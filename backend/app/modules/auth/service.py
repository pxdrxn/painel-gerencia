"""
Auth Service — Lógica de autenticação.
========================================
Orquestra:
    - Verificação de credenciais
    - Criação de tokens JWT
    - Refresh de tokens
    - Atualização de last_login

Não contém lógica HTTP (isso fica no router).
"""

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import create_access_token, create_refresh_token, verify_password, verify_token
from app.core.exceptions import UnauthorizedException
from app.modules.users.repository import UserRepository
from app.modules.auth.model import RevokedToken


class AuthService:
    """
    Service de autenticação.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.user_repo = UserRepository(db)

    async def authenticate(self, email: str, password: str) -> dict:
        """
        Autentica o usuário por email e senha.
        """
        user = await self.user_repo.get_by_email(email)
        if not user or not user.is_active:
            raise UnauthorizedException("Email ou senha inválidos")

        if not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Email ou senha inválidos")

        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )

        user.last_login = datetime.now(timezone.utc).replace(tzinfo=None)
        await self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    async def refresh_access_token(self, refresh_token: str) -> dict:
        """
        Renova o access token usando um refresh token válido (com rotação do refresh token).
        """
        from uuid import UUID
        
        # 1. Verificar se o refresh token foi revogado
        query = select(RevokedToken).where(RevokedToken.token == refresh_token)
        result = await self.db.execute(query)
        if result.scalar_one_or_none():
            raise UnauthorizedException("Refresh token revogado. Faça login novamente.")

        # 2. Validar JWT com tipo esperado "refresh"
        payload = verify_token(refresh_token, expected_type="refresh")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException("Refresh token inválido")

        user_id = UUID(user_id_str)
        user = await self.user_repo.get_by_id(user_id)

        if not user or not user.is_active:
            raise UnauthorizedException("Usuário inativo ou não encontrado")

        # 3. Gerar novos tokens (Refresh Token Rotation)
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )

        # 4. Blacklist o refresh token antigo para evitar reuso
        try:
            exp_timestamp = payload.get("exp")
            expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc).replace(tzinfo=None) if exp_timestamp else datetime.now(timezone.utc).replace(tzinfo=None)
        except Exception:
            expires_at = datetime.now(timezone.utc).replace(tzinfo=None)

        revoked = RevokedToken(token=refresh_token, expires_at=expires_at)
        self.db.add(revoked)
        await self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
