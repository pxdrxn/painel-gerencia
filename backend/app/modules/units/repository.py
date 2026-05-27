"""
Units Repository — Acesso a dados de unidades.
=================================================
"""

from sqlalchemy import select, func
from sqlalchemy.orm import aliased
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.repository import BaseRepository
from app.modules.units.model import Unit
from app.modules.employees.model import Employee


class UnitRepository(BaseRepository[Unit]):
    """Repository de unidades/lojas."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Unit, db)

    async def get_by_name(self, name: str) -> Unit | None:
        """Busca unidade por nome."""
        query = select(Unit).where(Unit.name == name)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_employee_count(self) -> list[dict]:
        """
        Lista unidades com contagem de funcionários ativos e nome do gerente.
        """
        Manager = aliased(Employee)
        
        query = (
            select(
                Unit,
                func.count(Employee.id).label("employee_count"),
                Manager.name.label("manager_name")
            )
            .outerjoin(Employee, (Employee.unit_id == Unit.id) & (Employee.status == 'ativo') & (Employee.is_deleted == False))
            .outerjoin(Manager, Unit.manager_id == Manager.id)
            .group_by(Unit.id, Manager.name)
            .order_by(Unit.name)
        )
        
        result = await self.db.execute(query)
        
        units_data = []
        for unit, count, manager_name in result.all():
            unit_dict = {
                "id": unit.id,
                "name": unit.name,
                "manager_name": manager_name,
                "phone": unit.phone,
                "employee_count": count,
                "required_attendants": unit.required_attendants,
                "required_pamphletists": unit.required_pamphletists,
                "required_analysts": unit.required_analysts,
                "is_active": unit.is_active,
                "created_at": unit.created_at,
            }
            units_data.append(unit_dict)
            
        return units_data

    async def get_by_id_with_employee_count(self, unit_id: UUID) -> dict | None:
        """
        Busca uma única unidade com contagem de funcionários ativos e nome do gerente.
        """
        Manager = aliased(Employee)
        
        query = (
            select(
                Unit,
                func.count(Employee.id).label("employee_count"),
                Manager.name.label("manager_name")
            )
            .outerjoin(Employee, (Employee.unit_id == Unit.id) & (Employee.status == 'ativo') & (Employee.is_deleted == False))
            .outerjoin(Manager, Unit.manager_id == Manager.id)
            .where(Unit.id == unit_id)
            .group_by(Unit.id, Manager.name)
        )
        
        result = await self.db.execute(query)
        row = result.first()
        if not row:
            return None
            
        unit, count, manager_name = row
        return {
            "id": unit.id,
            "name": unit.name,
            "manager_name": manager_name,
            "phone": unit.phone,
            "employee_count": count,
            "required_attendants": unit.required_attendants,
            "required_pamphletists": unit.required_pamphletists,
            "required_analysts": unit.required_analysts,
            "is_active": unit.is_active,
            "created_at": unit.created_at,
        }

    async def get_active_count(self) -> int:
        """Conta unidades ativas."""
        query = select(func.count()).select_from(Unit).where(
            Unit.is_active == True,
            Unit.is_deleted == False
        )
        result = await self.db.execute(query)
        return result.scalar() or 0
