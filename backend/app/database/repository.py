"""
Repository genérico (Base Repository Pattern).
================================================
Elimina boilerplate de CRUD repetitivo nos módulos.

Cada módulo herda BaseRepository e adiciona queries específicas:

    class EmployeeRepository(BaseRepository[Employee]):
        def __init__(self, db: AsyncSession):
            super().__init__(Employee, db)

        async def get_by_cpf(self, cpf: str) -> Employee | None:
            ...  # Query específica

Métodos disponíveis:
    - get_by_id(id) → Model | None
    - get_all(skip, limit, filters) → list[Model]
    - get_paginated(page, per_page, filters, order_by) → PaginatedResult
    - create(data) → Model
    - update(id, data) → Model
    - soft_delete(id) → None
    - exists(id) → bool
    - count(filters) → int

Dependências:
    - sqlalchemy >= 2.0
"""

from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class PaginatedResult(Generic[ModelType]):
    """Resultado paginado com metadados."""

    def __init__(
        self,
        items: list[ModelType],
        total: int,
        page: int,
        per_page: int,
    ) -> None:
        self.items = items
        self.total = total
        self.page = page
        self.per_page = per_page
        self.total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0


class BaseRepository(Generic[ModelType]):
    """
    Repository genérico para operações CRUD.

    Type Parameters:
        ModelType: O model SQLAlchemy (ex: Employee, Unit).

    Args:
        model: A classe do model SQLAlchemy.
        db: Sessão assíncrona do banco.
    """

    def __init__(self, model: type[ModelType], db: AsyncSession) -> None:
        self.model = model
        self.db = db

    async def get_by_id(self, id: UUID) -> ModelType | None:
        """
        Busca um registro pelo ID (UUID).
        """
        result = await self.db.get(self.model, id)
        return result

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: dict[str, Any] | None = None,
    ) -> list[ModelType]:
        """
        Lista registros com offset/limit e filtros opcionais.
        """
        query = select(self.model)
        if filters:
            for key, value in filters.items():
                query = query.where(getattr(self.model, key) == value)
        
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_paginated(
        self,
        page: int = 1,
        per_page: int = 20,
        filters: dict[str, Any] | None = None,
        order_by: str | None = None,
    ) -> PaginatedResult[ModelType]:
        """
        Busca paginada com contagem total.
        """
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)
        
        if filters:
            for key, value in filters.items():
                query = query.where(getattr(self.model, key) == value)
                count_query = count_query.where(getattr(self.model, key) == value)
                
        if order_by:
            if order_by.startswith("-"):
                query = query.order_by(getattr(self.model, order_by[1:]).desc())
            else:
                query = query.order_by(getattr(self.model, order_by).asc())
                
        # Conta o total
        total = await self.db.scalar(count_query) or 0
        
        # Pagina
        query = query.offset((page - 1) * per_page).limit(per_page)
        result = await self.db.execute(query)
        items = list(result.scalars().all())
        
        return PaginatedResult(items=items, total=total, page=page, per_page=per_page)

    async def create(self, data: dict[str, Any]) -> ModelType:
        """
        Cria um novo registro.
        """
        instance = self.model(**data)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def update(self, id: UUID, data: dict[str, Any]) -> ModelType | None:
        """
        Atualiza um registro existente.
        """
        instance = await self.get_by_id(id)
        if not instance:
            return None
            
        for key, value in data.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
                
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def soft_delete(self, id: UUID) -> bool:
        """
        Soft delete — marca como is_deleted=True.
        """
        instance = await self.get_by_id(id)
        if not instance:
            return False
            
        if hasattr(instance, "is_deleted"):
            instance.is_deleted = True
            if hasattr(instance, "deleted_at"):
                instance.deleted_at = func.now()
            await self.db.flush()
            return True
        return False

    async def exists(self, id: UUID) -> bool:
        """
        Verifica se um registro existe (não deletado).
        """
        query = select(self.model.id).where(self.model.id == id)
        result = await self.db.execute(query)
        return result.first() is not None

    async def count(self, filters: dict[str, Any] | None = None) -> int:
        """
        Conta registros com filtros opcionais.
        """
        query = select(func.count()).select_from(self.model)
        if filters:
            for key, value in filters.items():
                query = query.where(getattr(self.model, key) == value)
        
        return await self.db.scalar(query) or 0
