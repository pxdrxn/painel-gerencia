"""
Availability Service — Cálculo de disponibilidade operacional.
================================================================
Não possui model próprio — calcula dinamicamente a partir de:
    - Units (required_attendants, required_pamphletists, required_analysts)
    - Employees (status='ativo', agrupados por unit_id e position)

Recalculado quando:
    - Funcionário muda de status (ativo ↔ inativo/férias)
    - Funcionário muda de unidade
    - Férias iniciam ou terminam

Conforme screenshot do PDF "Disponibilidade de Unidade":
    | UNIDADE       | DISPONIBILIDADE (RESP./ATEND.) | PANFLETISTAS | ANALISTA  |
    | Matriz Centro | Ricardo Mendes (3)              | 2            | Ana Paula |
"""

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.units.repository import UnitRepository
from app.modules.employees.repository import EmployeeRepository
from app.modules.availability.schemas import UnitAvailabilityResponse, AvailabilitySummary
from app.modules.employees.model import Employee


class AvailabilityService:
    """Service de disponibilidade operacional."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.unit_repo = UnitRepository(db)
        self.employee_repo = EmployeeRepository(db)

    async def get_all_availability(self) -> AvailabilitySummary:
        units = await self.unit_repo.get_all()
        
        # Query all active, non-deleted employees once
        employees_query = select(Employee).where(
            Employee.status == "ativo",
            Employee.is_deleted == False
        )
        result = await self.db.execute(employees_query)
        all_active_employees = list(result.scalars().all())
        
        unit_responses = []
        total_units = len(units)
        units_complete = 0
        units_partial = 0
        units_critical = 0
        sum_efficiency = 0.0
        
        for unit in units:
            avail = await self.get_unit_availability_optimized(unit, all_active_employees)
            unit_responses.append(avail)
            
            sum_efficiency += avail.availability_percent
            
            if avail.status == "completa":
                units_complete += 1
            elif avail.status == "parcial":
                units_partial += 1
            else:
                units_critical += 1
                
        overall_efficiency = sum_efficiency / total_units if total_units > 0 else 0.0
        
        return AvailabilitySummary(
            total_units=total_units,
            units_complete=units_complete,
            units_partial=units_partial,
            units_critical=units_critical,
            overall_efficiency=round(overall_efficiency, 2),
            units=unit_responses
        )

    async def get_unit_availability(self, unit_id: UUID) -> UnitAvailabilityResponse:
        unit = await self.unit_repo.get_by_id(unit_id)
        if not unit:
            from app.core.exceptions import NotFoundException
            raise NotFoundException("Unidade não encontrada")
            
        # Fetch all active, non-deleted employees
        employees_query = select(Employee).where(
            Employee.status == "ativo",
            Employee.is_deleted == False
        )
        result = await self.db.execute(employees_query)
        all_active_employees = list(result.scalars().all())
        
        return await self.get_unit_availability_optimized(unit, all_active_employees)

    async def get_unit_availability_optimized(self, unit, all_active_employees: list[Employee]) -> UnitAvailabilityResponse:
        unit_id_str = str(unit.id)
        
        # Filter employees who belong to this unit OR have this unit in their available_unit_ids
        unit_employees = [
            emp for emp in all_active_employees
            if emp.unit_id == unit.id or unit_id_str in [str(uid) for uid in (emp.available_unit_ids or [])]
        ]
        
        manager_name = None
        if unit.manager_id:
            manager = next((emp for emp in unit_employees if emp.id == unit.manager_id), None)
            if not manager:
                manager = await self.employee_repo.get_by_id(unit.manager_id)
            if manager:
                manager_name = manager.name
                
        attendants = sum(1 for emp in unit_employees if emp.position == "atendente")
        pamphletists = sum(1 for emp in unit_employees if emp.position == "panfletista")
        
        analyst = next((emp for emp in unit_employees if emp.position == "analista"), None)
        analyst_name = analyst.name if analyst else None
        analysts = 1 if analyst else 0
        
        req_att = unit.required_attendants
        req_pam = unit.required_pamphletists
        req_ana = unit.required_analysts
        
        total_req = req_att + req_pam + req_ana
        total_curr = attendants + pamphletists + analysts
        
        percent = (total_curr / total_req * 100) if total_req > 0 else 100.0
        
        status = "completa"
        if percent < 50:
            status = "critica"
        elif percent < 100:
            status = "parcial"
            
        return UnitAvailabilityResponse(
            unit_id=unit.id,
            unit_name=unit.name,
            manager_name=manager_name,
            attendants_count=attendants,
            pamphletists_count=pamphletists,
            analyst_name=analyst_name,
            availability_percent=round(percent, 2),
            status=status
        )
