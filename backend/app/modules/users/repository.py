"""
Users Repository — Acesso a dados de usuários.
=================================================
Herda BaseRepository e adiciona queries específicas.
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.repository import BaseRepository
from app.modules.users.model import User


class UserRepository(BaseRepository[User]):
    """Repository de usuários do sistema."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        """
        Busca usuário por email.
        """
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def count_admins(self) -> int:
        """
        Conta quantos admins ativos existem.
        """
        query = select(func.count()).select_from(User).where(
            User.role == "admin",
            User.is_active == True,
            User.is_deleted == False
        )
        result = await self.db.execute(query)
        return result.scalar() or 0
