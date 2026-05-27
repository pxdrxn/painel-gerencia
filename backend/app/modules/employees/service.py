"""
Employees Service — Regras de negócio de funcionários.
========================================================
Regras:
    - CPF deve ser único (mesmo entre soft-deleted)
    - Ao mudar unit_id → disparar recálculo de disponibilidade (BackgroundTask)
    - Ao mudar status para inativo → disparar recálculo de disponibilidade
    - Impedir desativar funcionário com férias agendadas
    - Validar que a unidade de destino existe e está ativa
    - Validar formato de CPF e telefone
"""

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException, BusinessRuleException
from app.modules.employees.repository import EmployeeRepository
from app.modules.employees.schemas import EmployeeCreate, EmployeeUpdate
from app.modules.units.repository import UnitRepository
from app.modules.employees.model import Employee


class EmployeeService:
    """Service de gestão de funcionários."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = EmployeeRepository(db)
        self.unit_repo = UnitRepository(db)

    async def create_employee(self, data: EmployeeCreate, created_by: UUID) -> Employee:
        """Cadastrar novo funcionário. Valida CPF único e unidade existente."""
        if data.cpf:
            existing = await self.repo.get_by_cpf(data.cpf)
            if existing:
                raise ConflictException("Já existe um funcionário com este CPF")
            
        if data.unit_id:
            unit = await self.unit_repo.get_by_id(data.unit_id)
            if not unit or not unit.is_active:
                raise BusinessRuleException("Unidade destino inválida ou inativa")

        emp_data = data.model_dump()
        emp_data["created_by"] = created_by
        return await self.repo.create(emp_data)

    async def update_employee(self, employee_id: UUID, data: EmployeeUpdate, updated_by: UUID) -> Employee:
        """Editar funcionário."""
        employee = await self.repo.get_by_id(employee_id)
        if not employee:
            raise NotFoundException("Funcionário não encontrado")
            
        if data.unit_id and data.unit_id != employee.unit_id:
            unit = await self.unit_repo.get_by_id(data.unit_id)
            if not unit or not unit.is_active:
                raise BusinessRuleException("Unidade destino inválida ou inativa")
                
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by"] = updated_by

        # Validar as unidades de disponibilidade
        if data.available_unit_ids is not None:
            for u_id in data.available_unit_ids:
                unit = await self.unit_repo.get_by_id(u_id)
                if not unit:
                    raise BusinessRuleException(f"Unidade de disponibilidade inválida: {u_id}")
            # Converter de list[UUID] para list[str] para persistência JSON uniforme
            update_data["available_unit_ids"] = [str(u_id) for u_id in data.available_unit_ids]
        
        return await self.repo.update(employee_id, update_data)

    async def deactivate_employee(self, employee_id: UUID, updated_by: UUID) -> None:
        """Desativar funcionário."""
        employee = await self.repo.get_by_id(employee_id)
        if not employee:
            raise NotFoundException("Funcionário não encontrado")
            
        await self.repo.soft_delete(employee_id)

    async def list_employees(self, page: int, per_page: int, filters: dict, query_str: str | None = None):
        """Listar com filtros."""
        if query_str:
            return await self.repo.search(query_str, page, per_page)
        return await self.repo.get_paginated(page=page, per_page=per_page, filters=filters, order_by="name")

    async def get_employee(self, employee_id: UUID) -> Employee:
        """Buscar por ID."""
        employee = await self.repo.get_by_id(employee_id)
        if not employee:
            raise NotFoundException("Funcionário não encontrado")
        return employee
