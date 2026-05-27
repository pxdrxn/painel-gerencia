"""
Users Router — CRUD de usuários do sistema.
=============================================
Somente ADMIN pode gerenciar usuários.

Endpoints:
    GET    /api/users          → Lista paginada
    GET    /api/users/{id}     → Detalhes
    POST   /api/users          → Criar usuário
    PATCH  /api/users/{id}     → Editar
    DELETE /api/users/{id}     → Soft delete
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.responses import success_response, paginated_response, ApiResponse
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.schemas import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.modules.users.service import UserService
from app.modules.users.model import User
from app.core.exceptions import ForbiddenException

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_active_user)):
    """Verifica se o usuário é administrador."""
    if current_user.role != "admin":
        raise ForbiddenException("Apenas administradores podem gerenciar usuários")
    return current_user

@router.get("", response_model=ApiResponse)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: str | None = None,
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Lista usuários paginados."""
    service = UserService(db)
    filters = {}
    if role:
        filters["role"] = role
    if is_active is not None:
        filters["is_active"] = is_active
        
    result = await service.list_users(page, per_page, filters)
    return paginated_response(
        data=[UserListResponse.model_validate(u).model_dump() for u in result.items],
        total=result.total,
        page=result.page,
        per_page=result.per_page
    )

@router.get("/{user_id}", response_model=ApiResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Busca os detalhes de um usuário."""
    service = UserService(db)
    user = await service.get_user(user_id)
    return success_response(data=UserResponse.model_validate(user).model_dump())

@router.post("", response_model=ApiResponse, status_code=201)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Cria um novo usuário."""
    service = UserService(db)
    user = await service.create_user(data, current_user.id)
    return success_response(data=UserResponse.model_validate(user).model_dump(), message="Usuário criado com sucesso")

@router.patch("/{user_id}", response_model=ApiResponse)
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Atualiza dados do usuário."""
    service = UserService(db)
    user = await service.update_user(user_id, data, current_user.id)
    return success_response(data=UserResponse.model_validate(user).model_dump(), message="Usuário atualizado com sucesso")

@router.delete("/{user_id}", response_model=ApiResponse)
async def deactivate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    """Desativa um usuário (Soft Delete)."""
    service = UserService(db)
    await service.deactivate_user(user_id, current_user.id)
    return success_response(message="Usuário desativado com sucesso")
