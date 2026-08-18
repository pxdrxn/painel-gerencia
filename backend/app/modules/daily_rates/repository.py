"""
Daily Rates Repository — Acesso ao banco de dados para Diárias.
"""

from datetime import date
from uuid import UUID
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.daily_rates.model import DailyRate
from app.modules.employees.model import Employee


class DailyRateRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, data: dict) -> DailyRate:
        record = DailyRate(**data)
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record, ["employee"])
        return record

    async def get_by_id(self, record_id: UUID) -> DailyRate | None:
        stmt = (
            select(DailyRate)
            .where(DailyRate.id == record_id)
            .options(selectinload(DailyRate.employee).selectinload(Employee.unit))
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def list_records(
        self,
        employee_id: UUID | None = None,
        status: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[DailyRate]:
        stmt = (
            select(DailyRate)
            .options(selectinload(DailyRate.employee).selectinload(Employee.unit))
            .order_by(desc(DailyRate.created_at))
        )

        if employee_id:
            stmt = stmt.where(DailyRate.employee_id == employee_id)
        if status:
            stmt = stmt.where(DailyRate.status == status)
        if start_date:
            stmt = stmt.where(DailyRate.end_date >= start_date)
        if end_date:
            stmt = stmt.where(DailyRate.start_date <= end_date)

        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def update(self, record_id: UUID, data: dict) -> DailyRate:
        record = await self.get_by_id(record_id)
        if not record:
            raise ValueError("Registro de diária não encontrado")

        for key, value in data.items():
            if value is not None and hasattr(record, key):
                setattr(record, key, value)

        await self.db.flush()
        await self.db.refresh(record, ["employee"])
        return record

    async def delete(self, record_id: UUID) -> None:
        record = await self.get_by_id(record_id)
        if record:
            await self.db.delete(record)
            await self.db.flush()
