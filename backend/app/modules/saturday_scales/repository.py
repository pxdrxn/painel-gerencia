"""SaturdayScales Repository."""

from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.repository import BaseRepository
from app.modules.employees.model import Employee
from app.modules.saturday_scales.model import SaturdayScale
from app.modules.units.model import Unit


class SaturdayScaleRepository(BaseRepository[SaturdayScale]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(SaturdayScale, db)

    async def get_by_employee_date(self, employee_id: UUID, date_val: date) -> SaturdayScale | None:
        query = select(SaturdayScale).where(
            SaturdayScale.employee_id == employee_id,
            SaturdayScale.date == date_val
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def list_by_date(self, date_val: date) -> list[dict]:
        """
        Lista todas as alocações da escala de sábado para uma determinada data,
        incluindo nome do colaborador, cargo e nome da unidade.
        """
        query = (
            select(
                SaturdayScale,
                Employee.name.label("employee_name"),
                Employee.position.label("employee_position"),
                Unit.name.label("unit_name")
            )
            .join(Employee, SaturdayScale.employee_id == Employee.id)
            .outerjoin(Unit, Employee.unit_id == Unit.id)
            .where(SaturdayScale.date == date_val)
            .order_by(Employee.name)
        )
        result = await self.db.execute(query)
        
        data = []
        for scale, emp_name, emp_pos, unit_name in result.all():
            data.append({
                "id": scale.id,
                "employee_id": scale.employee_id,
                "employee_name": emp_name,
                "employee_position": emp_pos,
                "unit_name": unit_name or "Sem Unidade",
                "date": scale.date,
                "action": scale.action,
                "created_at": scale.created_at,
            })
        return data

    async def list_all(self) -> list[dict]:
        """
        Lista todas as alocações da escala de sábado (todas as datas),
        incluindo nome do colaborador, cargo e nome da unidade, ordenados por data desc.
        """
        query = (
            select(
                SaturdayScale,
                Employee.name.label("employee_name"),
                Employee.position.label("employee_position"),
                Unit.name.label("unit_name")
            )
            .join(Employee, SaturdayScale.employee_id == Employee.id)
            .outerjoin(Unit, Employee.unit_id == Unit.id)
            .order_by(SaturdayScale.date.desc(), Employee.name.asc())
        )
        result = await self.db.execute(query)
        
        data = []
        for scale, emp_name, emp_pos, unit_name in result.all():
            data.append({
                "id": scale.id,
                "employee_id": scale.employee_id,
                "employee_name": emp_name,
                "employee_position": emp_pos,
                "unit_name": unit_name or "Sem Unidade",
                "date": scale.date,
                "action": scale.action,
                "created_at": scale.created_at,
            })
        return data
