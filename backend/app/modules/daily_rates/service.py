"""
Daily Rates Service — Lógica de cálculo e regras de negócio para Diárias.
"""

from datetime import date, timedelta
from uuid import UUID
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundException, ValidationException
from app.modules.absences.model import Absence
from app.modules.daily_rates.model import DailyRate
from app.modules.daily_rates.repository import DailyRateRepository
from app.modules.daily_rates.schemas import (
    DailyRateCreate,
    DailyRatePreviewRequest,
    DailyRatePreviewResponse,
    DailyRateResponse,
    DailyRateUpdate,
    DayBreakdownItem,
)
from app.modules.employees.model import Employee
from app.modules.saturday_scales.model import SaturdayScale
from app.modules.vacations.model import Vacation


DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]


class DailyRateService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = DailyRateRepository(db)

    async def get_employee(self, employee_id: UUID) -> Employee:
        stmt = (
            select(Employee)
            .where(Employee.id == employee_id)
            .options(selectinload(Employee.unit))
        )
        res = await self.db.execute(stmt)
        emp = res.scalar_one_or_none()
        if not emp:
            raise NotFoundException("Colaborador não encontrado")
        return emp

    async def preview_calculation(self, req: DailyRatePreviewRequest) -> DailyRatePreviewResponse:
        employee = await self.get_employee(req.employee_id)

        # 1. Buscar faltas/folgas no período
        abs_stmt = select(Absence).where(
            Absence.employee_id == req.employee_id,
            Absence.date >= req.start_date,
            Absence.date <= req.end_date,
            Absence.status != "cancelada",
        )
        abs_res = await self.db.execute(abs_stmt)
        absences_map = {a.date: a for a in abs_res.scalars().all()}

        # 2. Buscar férias no período
        vac_stmt = select(Vacation).where(
            Vacation.employee_id == req.employee_id,
            Vacation.start_date <= req.end_date,
            Vacation.end_date >= req.start_date,
            Vacation.status != "cancelada",
        )
        vac_res = await self.db.execute(vac_stmt)
        vacations = list(vac_res.scalars().all())

        # 3. Buscar escalas de sábado no período
        sat_stmt = select(SaturdayScale).where(
            SaturdayScale.employee_id == req.employee_id,
            SaturdayScale.date >= req.start_date,
            SaturdayScale.date <= req.end_date,
        )
        sat_res = await self.db.execute(sat_stmt)
        saturdays_map = {s.date: s for s in sat_res.scalars().all()}

        breakdown: list[DayBreakdownItem] = []
        current = req.start_date
        total_workdays_scheduled = 0.0
        absences_deducted = 0
        vacations_deducted = 0
        saturday_half_days = 0

        while current <= req.end_date:
            w_day = current.weekday()  # 0=Seg, ..., 5=Sáb, 6=Dom
            day_name = DAY_NAMES[w_day]
            is_workday = True
            occurrence = "normal"
            rate_factor = 1.0
            note = None

            # Domingo
            if w_day == 6:
                if req.rule_type == "todos":
                    is_workday = True
                    occurrence = "domingo"
                    rate_factor = 1.0
                    note = "Domingo (Regime 7 dias)"
                else:
                    is_workday = False
                    occurrence = "domingo"
                    rate_factor = 0.0
                    note = "Domingo (Descanso semanal)"

            # Sábado
            elif w_day == 5:
                if req.rule_type == "seg_sex":
                    is_workday = False
                    occurrence = "sabado_folga"
                    rate_factor = 0.0
                    note = "Sábado (Regime Seg-Sex)"
                else:
                    # Checar escala de sábado
                    sat_scale = saturdays_map.get(current)
                    if sat_scale:
                        if sat_scale.action == "folgou":
                            is_workday = False
                            occurrence = "sabado_folga"
                            rate_factor = 0.0
                            note = "Sábado Folgou (Escala)"
                        elif sat_scale.action == "largou_12h":
                            is_workday = True
                            occurrence = "sabado_meiodia"
                            rate_factor = 0.5
                            note = "Sábado Meio-Dia (Largou 12h)"
                            saturday_half_days += 1
                        else:
                            is_workday = True
                            occurrence = "sabado_escala"
                            rate_factor = 1.0
                            note = "Sábado Trabalhado (Integral)"
                    else:
                        is_workday = True
                        occurrence = "sabado_escala"
                        rate_factor = 1.0
                        note = "Sábado Trabalhado"

            # Segunda a Sexta
            else:
                is_workday = True
                occurrence = "normal"
                rate_factor = 1.0

            if is_workday:
                total_workdays_scheduled += 1.0

            # Checar Férias
            if req.discount_vacations and is_workday:
                for vac in vacations:
                    # Se pausada, verificar pause_date
                    if vac.start_date <= current <= vac.end_date:
                        if vac.status == "pausada" and vac.pause_date and current >= vac.pause_date:
                            continue
                        occurrence = "ferias"
                        rate_factor = 0.0
                        note = "Em Férias"
                        vacations_deducted += 1
                        break

            # Checar Faltas e Folgas
            if req.discount_absences and occurrence != "ferias" and is_workday:
                abs_rec = absences_map.get(current)
                if abs_rec:
                    if abs_rec.type == "falta":
                        occurrence = "falta"
                        rate_factor = 0.0
                        note = f"Falta registrada ({abs_rec.status})"
                        absences_deducted += 1
                    elif abs_rec.type == "folga":
                        occurrence = "folga"
                        rate_factor = 0.0
                        note = f"Folga registrada ({abs_rec.status})"
                        absences_deducted += 1

            # Ajuste manual customizado
            date_str = current.isoformat()
            if req.custom_overrides and date_str in req.custom_overrides:
                override_val = float(req.custom_overrides[date_str])
                rate_factor = override_val
                note = f"Ajuste manual: {override_val} diária"

            breakdown.append(
                DayBreakdownItem(
                    date=current,
                    day_of_week=w_day,
                    day_name=day_name,
                    is_workday=is_workday,
                    occurrence=occurrence,
                    rate_factor=rate_factor,
                    notes=note,
                )
            )

            current += timedelta(days=1)

        total_calendar_days = (req.end_date - req.start_date).days + 1
        effective_days_count = sum(item.rate_factor for item in breakdown)
        subtotal_value = round(effective_days_count * req.daily_value, 2)
        total_value = max(0.0, round(subtotal_value + req.additions_value - req.discounts_value, 2))

        return DailyRatePreviewResponse(
            employee_id=employee.id,
            employee_name=employee.name,
            employee_position=employee.position,
            employee_cpf=employee.cpf,
            employee_cnpj=employee.cnpj,
            unit_name=employee.unit_name,
            start_date=req.start_date,
            end_date=req.end_date,
            total_calendar_days=total_calendar_days,
            total_workdays_scheduled=total_workdays_scheduled,
            absences_deducted=absences_deducted,
            vacations_deducted=vacations_deducted,
            saturday_half_days=saturday_half_days,
            effective_days_count=effective_days_count,
            daily_value=req.daily_value,
            subtotal_value=subtotal_value,
            additions_value=req.additions_value,
            discounts_value=req.discounts_value,
            total_value=total_value,
            breakdown=breakdown,
        )

    async def create_record(self, data: DailyRateCreate, created_by: UUID | None) -> DailyRateResponse:
        employee = await self.get_employee(data.employee_id)

        dumped = data.model_dump()
        dumped["created_by"] = created_by
        record = await self.repo.create(dumped)

        return self._format_response(record)

    async def list_records(
        self,
        employee_id: UUID | None = None,
        status: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[DailyRateResponse]:
        records = await self.repo.list_records(
            employee_id=employee_id,
            status=status,
            start_date=start_date,
            end_date=end_date,
        )
        return [self._format_response(r) for r in records]

    async def get_by_id(self, record_id: UUID) -> DailyRateResponse:
        record = await self.repo.get_by_id(record_id)
        if not record:
            raise NotFoundException("Lançamento de diária não encontrado")
        return self._format_response(record)

    async def update_record(self, record_id: UUID, data: DailyRateUpdate) -> DailyRateResponse:
        record = await self.repo.get_by_id(record_id)
        if not record:
            raise NotFoundException("Lançamento de diária não encontrado")

        update_dict = data.model_dump(exclude_unset=True)
        # Recalcular total_value se houver alteração de valores
        daily_val = update_dict.get("daily_value", record.daily_value)
        add_val = update_dict.get("additions_value", record.additions_value)
        disc_val = update_dict.get("discounts_value", record.discounts_value)
        if "daily_value" in update_dict or "additions_value" in update_dict or "discounts_value" in update_dict:
            update_dict["total_value"] = max(0.0, round((record.days_count * daily_val) + add_val - disc_val, 2))

        updated = await self.repo.update(record_id, update_dict)
        return self._format_response(updated)

    async def delete_record(self, record_id: UUID) -> None:
        record = await self.repo.get_by_id(record_id)
        if not record:
            raise NotFoundException("Lançamento de diária não encontrado")
        await self.repo.delete(record_id)

    def _format_response(self, record: DailyRate) -> DailyRateResponse:
        emp = record.employee
        return DailyRateResponse(
            id=record.id,
            employee_id=record.employee_id,
            employee_name=emp.name if emp else None,
            employee_position=emp.position if emp else None,
            employee_cpf=emp.cpf if emp else None,
            employee_cnpj=emp.cnpj if emp else None,
            unit_name=emp.unit_name if emp else None,
            start_date=record.start_date,
            end_date=record.end_date,
            daily_value=float(record.daily_value),
            days_count=float(record.days_count),
            total_value=float(record.total_value),
            rule_type=record.rule_type,
            work_saturdays=record.work_saturdays,
            discount_absences=record.discount_absences,
            discount_vacations=record.discount_vacations,
            absences_deducted=record.absences_deducted,
            vacations_deducted=record.vacations_deducted,
            saturday_half_days=record.saturday_half_days,
            additions_value=float(record.additions_value),
            discounts_value=float(record.discounts_value),
            status=record.status,
            payment_date=record.payment_date,
            notes=record.notes,
            details_breakdown=record.details_breakdown or [],
            created_at=record.created_at,
            updated_at=record.updated_at,
        )
