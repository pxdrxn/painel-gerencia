"""
Units Service — Regras de negócio para unidades.
===================================================
Regras:
    - Nome da unidade deve ser único
    - Manager deve ser um funcionário ativo da unidade
    - Ao deletar, verificar se há funcionários ativos vinculados
    - Calcular disponibilidade: current vs required staff
"""

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException, BusinessRuleException
from app.modules.units.repository import UnitRepository
from app.modules.units.schemas import UnitCreate, UnitUpdate, UnitAvailability, StaffAvailability
from app.modules.employees.repository import EmployeeRepository
from app.modules.units.model import Unit


class UnitService:
    """Service de gestão de unidades/lojas."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UnitRepository(db)
        self.employee_repo = EmployeeRepository(db)

    async def create_unit(self, data: UnitCreate) -> Unit:
        """Cria uma nova unidade."""
        existing = await self.repo.get_by_name(data.name)
        if existing:
            raise ConflictException("Já existe uma unidade com este nome")
            
        if data.manager_id:
            manager = await self.employee_repo.get_by_id(data.manager_id)
            if not manager or not manager.status == "ativo":
                raise BusinessRuleException("O gerente deve ser um funcionário ativo")
                
        return await self.repo.create(data.model_dump())

    async def update_unit(self, unit_id: UUID, data: UnitUpdate) -> Unit:
        """Atualiza uma unidade."""
        unit = await self.repo.get_by_id(unit_id)
        if not unit:
            raise NotFoundException("Unidade não encontrada")
            
        if data.name and data.name != unit.name:
            existing = await self.repo.get_by_name(data.name)
            if existing:
                raise ConflictException("Já existe uma unidade com este nome")
                
        if data.manager_id and data.manager_id != unit.manager_id:
            manager = await self.employee_repo.get_by_id(data.manager_id)
            if not manager or not manager.status == "ativo":
                raise BusinessRuleException("O gerente deve ser um funcionário ativo")
                
        return await self.repo.update(unit_id, data.model_dump(exclude_unset=True))

    async def delete_unit(self, unit_id: UUID) -> None:
        """Deleta (soft) uma unidade."""
        unit = await self.repo.get_by_id(unit_id)
        if not unit:
            raise NotFoundException("Unidade não encontrada")
            
        active_employees = await self.employee_repo.count({"unit_id": unit_id, "status": "ativo", "is_deleted": False})
        if active_employees > 0:
            raise BusinessRuleException(f"Não é possível deletar a unidade pois existem {active_employees} funcionários ativos vinculados")
            
        await self.repo.soft_delete(unit_id)

    async def list_units_with_stats(self) -> list[dict]:
        """Lista unidades formatadas com cálculo de déficit operacional."""
        units = await self.repo.get_with_employee_count()
        for u in units:
            total_req = u["required_attendants"] + u["required_pamphletists"] + u["required_analysts"]
            u["status_operacional"] = "Ativa" if u["employee_count"] >= total_req else "Déficit"
        return units

    async def get_unit_with_stats(self, unit_id: UUID) -> dict:
        """Busca uma única unidade e calcula o status operacional."""
        unit_data = await self.repo.get_by_id_with_employee_count(unit_id)
        if not unit_data:
            raise NotFoundException("Unidade não encontrada")
            
        total_req = unit_data["required_attendants"] + unit_data["required_pamphletists"] + unit_data["required_analysts"]
        unit_data["status_operacional"] = "Ativa" if unit_data["employee_count"] >= total_req else "Déficit"
        return unit_data

    async def get_unit_availability(self, unit_id: UUID) -> UnitAvailability:
        """Calcula a disponibilidade de equipe detalhada de uma unidade."""
        unit = await self.repo.get_by_id(unit_id)
        if not unit:
            raise NotFoundException("Unidade não encontrada")
            
        manager = None
        if unit.manager_id:
            manager_emp = await self.employee_repo.get_by_id(unit.manager_id)
            if manager_emp:
                manager = manager_emp.name
                
        # Contar funcionários por cargo
        attendants = await self.employee_repo.count({"unit_id": unit_id, "position": "atendente", "status": "ativo", "is_deleted": False})
        pamphletists = await self.employee_repo.count({"unit_id": unit_id, "position": "panfletista", "status": "ativo", "is_deleted": False})
        analysts = await self.employee_repo.count({"unit_id": unit_id, "position": "analista", "status": "ativo", "is_deleted": False})
        
        req_att = unit.required_attendants
        req_pam = unit.required_pamphletists
        req_ana = unit.required_analysts
        
        def calculate_deficit(req, curr):
            return max(0, req - curr)
            
        att_avail = StaffAvailability(required=req_att, current=attendants, deficit=calculate_deficit(req_att, attendants))
        pam_avail = StaffAvailability(required=req_pam, current=pamphletists, deficit=calculate_deficit(req_pam, pamphletists))
        ana_avail = StaffAvailability(required=req_ana, current=analysts, deficit=calculate_deficit(req_ana, analysts))
        
        total_req = req_att + req_pam + req_ana
        total_curr = attendants + pamphletists + analysts
        
        percent = (total_curr / total_req * 100) if total_req > 0 else 100.0
        
        status = "completa"
        if percent < 50:
            status = "critica"
        elif percent < 100:
            status = "parcial"
            
        return UnitAvailability(
            unit_id=unit.id,
            unit_name=unit.name,
            manager_name=manager,
            attendants=att_avail,
            pamphletists=pam_avail,
            analysts=ana_avail,
            availability_percent=round(percent, 2),
            status=status
        )
