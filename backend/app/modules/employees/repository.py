"""
Employees Repository — Acesso a dados de funcionários.
=========================================================
Herda BaseRepository e adiciona queries específicas para funcionários.
"""

from datetime import date
from uuid import UUID

from dateutil.relativedelta import relativedelta
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.repository import BaseRepository, PaginatedResult
from app.modules.employees.model import Employee


class EmployeeRepository(BaseRepository[Employee]):
    """Repository de funcionários."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Employee, db)

    async def get_by_cpf(self, cpf: str) -> Employee | None:
        """Busca funcionário por CPF."""
        query = select(Employee).where(Employee.cpf == cpf)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def search(
        self,
        query_str: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PaginatedResult[Employee]:
        """
        Busca por nome ou CPF (ILIKE).
        """
        query = select(Employee).where(
            or_(
                Employee.name.ilike(f"%{query_str}%"),
                Employee.cpf.ilike(f"%{query_str}%")
            )
        ).order_by(Employee.name)
        
        count_query = select(func.count()).select_from(Employee).where(
            or_(
                Employee.name.ilike(f"%{query_str}%"),
                Employee.cpf.ilike(f"%{query_str}%")
            )
        )
        
        total = await self.db.scalar(count_query) or 0
        query = query.offset((page - 1) * per_page).limit(per_page)
        
        result = await self.db.execute(query)
        items = list(result.scalars().all())
        
        return PaginatedResult(items=items, total=total, page=page, per_page=per_page)

    async def get_by_unit(
        self,
        unit_id: UUID,
        status: str | None = None,
    ) -> list[Employee]:
        """
        Lista funcionários de uma unidade.
        """
        query = select(Employee).where(Employee.unit_id == unit_id)
        if status:
            query = query.where(Employee.status == status)
        query = query.order_by(Employee.name)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_by_unit_and_position(self, unit_id: UUID) -> dict[str, int]:
        """
        Conta funcionários ATIVOS por cargo em uma unidade.
        """
        query = select(Employee.position, func.count()).where(
            Employee.unit_id == unit_id,
            Employee.status == "ativo",
            Employee.is_deleted == False
        ).group_by(Employee.position)
        
        result = await self.db.execute(query)
        return {pos: count for pos, count in result.all()}

    async def count_by_status(self) -> dict[str, int]:
        """
        Conta funcionários por status (global).
        """
        query = select(Employee.status, func.count()).where(
            Employee.is_deleted == False
        ).group_by(Employee.status)
        
        result = await self.db.execute(query)
        counts = {status: count for status, count in result.all()}
        
        for s in ["ativo", "inativo", "ferias", "afastado"]:
            counts.setdefault(s, 0)
        return counts

    async def get_recent_hires(self, days: int = 30) -> list[Employee]:
        """Funcionários contratados nos últimos N dias."""
        target_date = date.today() - relativedelta(days=days)
        query = select(Employee).where(
            Employee.hire_date >= target_date,
            Employee.is_deleted == False
        ).order_by(Employee.hire_date.desc())
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_hire_date_range(
        self,
        min_months: int | None = None,
        max_months: int | None = None,
    ) -> list[Employee]:
        """
        Funcionários por faixa de tempo de empresa.
        """
        query = select(Employee).where(
            Employee.status == "ativo",
            Employee.is_deleted == False
        )
        
        today = date.today()
        
        if min_months is not None:
            max_date = today - relativedelta(months=min_months)
            query = query.where(Employee.hire_date <= max_date)
            
        if max_months is not None:
            min_date = today - relativedelta(months=max_months)
            query = query.where(Employee.hire_date > min_date)
            
        result = await self.db.execute(query)
        return list(result.scalars().all())
