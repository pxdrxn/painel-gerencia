"""Absences Repository."""
from uuid import UUID
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.repository import BaseRepository
from app.modules.absences.model import Absence
from app.modules.employees.model import Employee


class AbsenceRepository(BaseRepository[Absence]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Absence, db)

    async def get_by_employee_date(self, employee_id: UUID, date_val: date) -> Absence | None:
        query = select(Absence).where(
            Absence.employee_id == employee_id,
            Absence.date == date_val,
            Absence.status != "cancelada"
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_all_with_employee_name(self) -> list[dict]:
        query = (
            select(
                Absence,
                Employee.name.label("employee_name")
            )
            .join(Employee, Absence.employee_id == Employee.id)
            .order_by(Absence.date.desc())
        )
        result = await self.db.execute(query)
        
        data = []
        for absence, emp_name in result.all():
            data.append({
                "id": absence.id,
                "employee_id": absence.employee_id,
                "employee_name": emp_name,
                "date": absence.date,
                "type": absence.type,
                "status": absence.status,
                "observations": absence.observations,
                "created_at": absence.created_at
            })
        return data
