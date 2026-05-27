"""Absences Service."""
from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ConflictException, NotFoundException, BusinessRuleException
from app.modules.absences.model import Absence
from app.modules.absences.repository import AbsenceRepository
from app.modules.absences.schemas import AbsenceCreate, AbsenceUpdate
from app.modules.employees.repository import EmployeeRepository


class AbsenceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AbsenceRepository(db)
        self.emp_repo = EmployeeRepository(db)

    async def schedule_absence(self, data: AbsenceCreate, created_by: UUID) -> Absence:
        # Check conflict
        existing = await self.repo.get_by_employee_date(data.employee_id, data.date)
        if existing:
            raise ConflictException(f"Já existe uma folga/falta agendada para esta data: {data.date}")

        employee = await self.emp_repo.get_by_id(data.employee_id)
        if not employee:
            raise NotFoundException("Funcionário não encontrado")

        absence_data = data.model_dump()
        absence_data["created_by"] = created_by
        absence_data["status"] = "agendada"
        return await self.repo.create(absence_data)

    async def update_absence(self, absence_id: UUID, data: AbsenceUpdate) -> Absence:
        absence = await self.repo.get_by_id(absence_id)
        if not absence:
            raise NotFoundException("Agendamento de folga/falta não encontrado")

        old_status = absence.status
        update_data = data.model_dump(exclude_unset=True)
        updated = await self.repo.update(absence_id, update_data)

        # Se mudou para confirmada, incrementamos as folgas/faltas do funcionário
        if old_status != "confirmada" and updated.status == "confirmada":
            employee = await self.emp_repo.get_by_id(updated.employee_id)
            if employee:
                await self.emp_repo.update(employee.id, {"absences": employee.absences + 1})

        # Se mudou de confirmada para outra (cancelada por exemplo), decrementamos
        elif old_status == "confirmada" and updated.status != "confirmada":
            employee = await self.emp_repo.get_by_id(updated.employee_id)
            if employee:
                await self.emp_repo.update(employee.id, {"absences": max(0, employee.absences - 1)})

        return updated

    async def list_absences(self) -> list[dict]:
        return await self.repo.get_all_with_employee_name()
