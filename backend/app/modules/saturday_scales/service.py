"""SaturdayScales Service."""

from datetime import date
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, ConflictException, NotFoundException
from app.modules.employees.repository import EmployeeRepository
from app.modules.saturday_scales.model import SaturdayScale
from app.modules.saturday_scales.repository import SaturdayScaleRepository
from app.modules.saturday_scales.schemas import SaturdayScaleCreate, SaturdayScaleUpdate


class SaturdayScaleService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = SaturdayScaleRepository(db)
        self.emp_repo = EmployeeRepository(db)

    async def add_employee_to_scale(self, data: SaturdayScaleCreate, created_by: UUID) -> SaturdayScale:
        """Adiciona um funcionário à escala de um sábado específico."""
        # 1. Validar se a data é um sábado (weekday = 5 no Python: 0=segunda, 5=sábado)
        if data.date.weekday() != 5:
            raise BusinessRuleException("A data da escala deve ser obrigatoriamente um sábado")

        # 2. Verificar se o funcionário já está alocado nesse sábado
        existing = await self.repo.get_by_employee_date(data.employee_id, data.date)
        if existing:
            raise ConflictException("Este colaborador já está adicionado na escala deste sábado")

        # 3. Verificar se o funcionário existe
        employee = await self.emp_repo.get_by_id(data.employee_id)
        if not employee:
            raise NotFoundException("Funcionário não encontrado")

        scale_data = data.model_dump()
        scale_data["created_by"] = created_by
        return await self.repo.create(scale_data)

    async def update_action(self, scale_id: UUID, data: SaturdayScaleUpdate) -> SaturdayScale:
        """Atualiza a ação do funcionário (folgou / largou_12h) na escala."""
        scale = await self.repo.get_by_id(scale_id)
        if not scale:
            raise NotFoundException("Escala de sábado não encontrada")

        return await self.repo.update(scale_id, data.model_dump(exclude_unset=True))

    async def remove_employee_from_scale(self, scale_id: UUID) -> None:
        """Remove um funcionário da escala de sábado."""
        scale = await self.repo.get_by_id(scale_id)
        if not scale:
            raise NotFoundException("Escala de sábado não encontrada")

        await self.db.delete(scale)
        await self.db.flush()

    async def list_saturday_scale(self, date_val: date | None) -> list[dict]:
        """Lista os funcionários escalados no sábado informado ou todos se None."""
        if date_val:
            if date_val.weekday() != 5:
                raise BusinessRuleException("A data informada deve ser um sábado")
            return await self.repo.list_by_date(date_val)
        return await self.repo.list_all()
