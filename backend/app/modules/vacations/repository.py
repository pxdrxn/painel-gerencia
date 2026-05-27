"""
Vacations Repository — Acesso a dados de férias.
===================================================
"""

from datetime import date
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.repository import BaseRepository
from app.modules.vacations.model import Vacation


from datetime import date
from uuid import UUID

from sqlalchemy import select, or_, not_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.database.repository import BaseRepository
from app.modules.vacations.model import Vacation
from app.modules.employees.model import Employee


class VacationRepository(BaseRepository[Vacation]):
    """Repository de férias."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Vacation, db)

    async def check_overlap(
        self,
        employee_id: UUID,
        start_date: date,
        end_date: date,
        exclude_id: UUID | None = None,
    ) -> bool:
        """
        Verifica se há conflito de datas para o mesmo funcionário.
        """
        query = select(Vacation).where(
            Vacation.employee_id == employee_id,
            Vacation.status.in_(["agendada", "em_andamento"]),
            not_(or_(end_date <= Vacation.start_date, start_date >= Vacation.end_date))
        )
        if exclude_id:
            query = query.where(Vacation.id != exclude_id)
            
        result = await self.db.execute(query)
        return result.scalars().first() is not None

    async def get_by_employee(self, employee_id: UUID) -> list[Vacation]:
        """Lista todas as férias de um funcionário."""
        query = select(Vacation).where(Vacation.employee_id == employee_id).order_by(Vacation.start_date.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_starting_today(self) -> list[Vacation]:
        """Férias que iniciam hoje ou no passado que ainda estão agendadas."""
        today = date.today()
        query = select(Vacation).where(
            Vacation.start_date <= today,
            Vacation.status == "agendada"
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_ending_today(self) -> list[Vacation]:
        """Férias que terminam hoje (para cron job)."""
        today = date.today()
        query = select(Vacation).where(
            Vacation.end_date < today,
            Vacation.status == "em_andamento"
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_upcoming(self, days: int = 30) -> list[Vacation]:
        """Férias que iniciam nos próximos N dias."""
        from dateutil.relativedelta import relativedelta
        today = date.today()
        limit_date = today + relativedelta(days=days)
        
        query = select(Vacation).where(
            Vacation.start_date >= today,
            Vacation.start_date <= limit_date,
            Vacation.status == "agendada"
        ).order_by(Vacation.start_date)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_active(self) -> int:
        """Conta férias em andamento."""
        query = select(func.count()).select_from(Vacation).where(Vacation.status == "em_andamento")
        result = await self.db.execute(query)
        return result.scalar() or 0
        
    async def get_vacations_with_employee(self, status: str | None = None) -> list[dict]:
        """Retorna as férias com o nome e data de contratação do funcionário"""
        query = (
            select(
                Vacation,
                Employee.name.label("employee_name"),
                Employee.hire_date.label("hire_date")
            )
            .join(Employee, Vacation.employee_id == Employee.id)
        )
        
        if status:
            query = query.where(Vacation.status == status)
            
        query = query.order_by(Vacation.start_date)
        
        result = await self.db.execute(query)
        
        data = []
        for vac, emp_name, emp_hire in result.all():
            data.append({
                "id": vac.id,
                "employee_id": vac.employee_id,
                "employee_name": emp_name,
                "hire_date": emp_hire,
                "start_date": vac.start_date,
                "end_date": vac.end_date,
                "status": vac.status,
                "observations": vac.observations,
                "created_at": vac.created_at,
            })
        return data
