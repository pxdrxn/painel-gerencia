"""
Vacations Service — Regras de negócio de férias.
===================================================
Regras:
    - Verificar conflito de datas para o mesmo funcionário
    - Ao agendar → checar se a unidade ficará em disponibilidade crítica
    - Ao iniciar férias → atualizar status do funcionário para 'ferias'
    - Ao concluir férias → restaurar status do funcionário para 'ativo'
    - Disparar recálculo automático de disponibilidade via BackgroundTask
    - Funcionário inativo não pode ter férias agendadas
"""

from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException, BusinessRuleException
from app.modules.vacations.repository import VacationRepository
from app.modules.employees.repository import EmployeeRepository
from app.modules.vacations.schemas import VacationCreate, VacationUpdate
from app.modules.vacations.model import Vacation


class VacationService:
    """Service de controle de férias."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = VacationRepository(db)
        self.employee_repo = EmployeeRepository(db)

    async def schedule_vacation(self, data: VacationCreate, created_by: UUID) -> Vacation:
        """Agenda férias para um funcionário ativo."""
        employee = await self.employee_repo.get_by_id(data.employee_id)
        if not employee or employee.status != "ativo":
            raise BusinessRuleException("Apenas funcionários ativos podem ter férias agendadas")

        overlap = await self.repo.check_overlap(data.employee_id, data.start_date, data.end_date)
        if overlap:
            raise ConflictException("O funcionário já possui férias agendadas neste período")

        vacation_data = data.model_dump()
        vacation_data["created_by"] = created_by
        return await self.repo.create(vacation_data)

    async def update_vacation(self, vacation_id: UUID, data: VacationUpdate) -> Vacation:
        """Atualiza datas de férias."""
        vacation = await self.repo.get_by_id(vacation_id)
        if not vacation:
            raise NotFoundException("Férias não encontradas")
            
        start = data.start_date or vacation.start_date
        end = data.end_date or vacation.end_date
        
        if end <= start:
             raise BusinessRuleException("A data de retorno deve ser posterior à data de saída")

        overlap = await self.repo.check_overlap(vacation.employee_id, start, end, exclude_id=vacation_id)
        if overlap:
            raise ConflictException("O funcionário já possui férias agendadas neste período")

        return await self.repo.update(vacation_id, data.model_dump(exclude_unset=True))

    async def complete_vacation(self, vacation_id: UUID) -> Vacation:
        """Marca férias como concluídas e retorna status do funcionário para ativo."""
        vacation = await self.repo.get_by_id(vacation_id)
        if not vacation:
            raise NotFoundException("Férias não encontradas")
            
        if vacation.status == "concluida":
            return vacation
            
        vacation = await self.repo.update(vacation_id, {"status": "concluida"})
        await self.employee_repo.update(vacation.employee_id, {"status": "ativo"})
        return vacation

    async def cancel_vacation(self, vacation_id: UUID) -> Vacation:
        """Cancela férias."""
        vacation = await self.repo.get_by_id(vacation_id)
        if not vacation:
            raise NotFoundException("Férias não encontradas")
            
        if vacation.status == "em_andamento":
            await self.employee_repo.update(vacation.employee_id, {"status": "ativo"})
            
        return await self.repo.update(vacation_id, {"status": "cancelada"})

    async def list_calendar(self, status: str | None = None) -> list[dict]:
        """Lista calendário de férias."""
        return await self.repo.get_vacations_with_employee(status)

    async def process_daily_vacation_changes(self) -> None:
        """Cron job: atualiza status de férias que iniciam ou terminam hoje."""
        starting = await self.repo.get_starting_today()
        for vac in starting:
            await self.repo.update(vac.id, {"status": "em_andamento"})
            await self.employee_repo.update(vac.employee_id, {"status": "ferias"})
            
        ending = await self.repo.get_ending_today()
        for vac in ending:
            await self.repo.update(vac.id, {"status": "concluida"})
            await self.employee_repo.update(vac.employee_id, {"status": "ativo"})
