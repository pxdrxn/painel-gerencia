"""
Users Service — Lógica de negócio para usuários.
===================================================
Regras:
    - Email deve ser único
    - Senha deve ser hasheada antes de salvar
    - Admin pode criar qualquer role
    - Não pode deletar o próprio usuário
    - Não pode deletar o último admin
"""

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.core.exceptions import ConflictException, NotFoundException, BusinessRuleException
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate
from app.modules.users.model import User


class UserService:
    """Service de gestão de usuários do sistema."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)

    async def create_user(self, data: UserCreate, created_by: UUID) -> User:
        """Cria um novo usuário."""
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise ConflictException("Email já cadastrado")

        user_data = data.model_dump()
        user_data["hashed_password"] = hash_password(user_data.pop("password"))
        user_data["created_by"] = created_by

        return await self.repo.create(user_data)

    async def update_user(self, user_id: UUID, data: UserUpdate, updated_by: UUID) -> User:
        """Atualiza dados do usuário."""
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Usuário não encontrado")

        if data.email and data.email != user.email:
            existing = await self.repo.get_by_email(data.email)
            if existing:
                raise ConflictException("Email já cadastrado")

        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by"] = updated_by
        
        return await self.repo.update(user_id, update_data)

    async def deactivate_user(self, user_id: UUID, current_user_id: UUID) -> None:
        """Desativa um usuário."""
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Usuário não encontrado")
            
        if user_id == current_user_id:
            raise BusinessRuleException("Não é possível desativar o próprio usuário")

        if user.role == "admin":
            admins_count = await self.repo.count_admins()
            if admins_count <= 1:
                raise BusinessRuleException("Não é possível desativar o último administrador")

        await self.repo.update(user_id, {"is_active": False, "updated_by": current_user_id})

    async def list_users(self, page: int = 1, per_page: int = 20, filters: dict | None = None):
        """Lista usuários com paginação."""
        return await self.repo.get_paginated(page=page, per_page=per_page, filters=filters, order_by="-created_at")

    async def get_user(self, user_id: UUID) -> User:
        """Busca usuário pelo ID."""
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Usuário não encontrado")
        return user
