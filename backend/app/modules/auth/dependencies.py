"""
Auth Dependencies — FastAPI dependencies para autenticação.
=============================================================
Funções de dependency injection usadas nos routers para:
    - Extrair e validar JWT do header Authorization
    - Retornar o usuário autenticado
    - Verificar roles

Uso nos routers:
    from app.modules.auth.dependencies import get_current_user

    @router.get("/protected")
    async def protected_endpoint(user = Depends(get_current_user)):
        ...
"""

from uuid import UUID

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.core.security import verify_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.modules.users.repository import UserRepository
from app.modules.users.model import User
from app.modules.auth.model import RevokedToken

# OAuth2 scheme para extrair o Bearer token do header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency que extrai e valida o JWT, retornando o User autenticado.
    """
    # 1. Verificar se o token foi revogado (logout)
    query = select(RevokedToken).where(RevokedToken.token == token)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise UnauthorizedException("Sessão encerrada. Faça login novamente.")

    try:
        # 2. Validar JWT com tipo esperado "access"
        payload = verify_token(token, expected_type="access")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException("Token sem identificação de usuário")
            
        user_id = UUID(user_id_str)
        user = await UserRepository(db).get_by_id(user_id)
        
        if not user or not user.is_active:
            raise UnauthorizedException("Usuário não encontrado ou inativo")
            
        return user
    except ValueError:
        raise UnauthorizedException("Formato de token inválido")


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency que verifica se o usuário está ativo.
    """
    if not current_user.is_active:
        raise ForbiddenException("Usuário inativo")
    return current_user


async def require_manager_role(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Acesso permitido apenas para gestores (admin, supervisor, gerente).
    """
    if current_user.role not in ["admin", "supervisor", "gerente"]:
        raise ForbiddenException("Acesso negado para o seu perfil")
    return current_user
