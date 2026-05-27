"""
Dashboard Service — Agregação de métricas.
=============================================
Consolida dados de TODOS os módulos para o painel principal.

Conforme screenshot do PDF "Painel de Controle Unificado":
    - Funcionários: 15
    - Lojas: 10
    - Em Férias: 01
    - Contratações: 02
    - Ativos: 14
    - Meta Mês: 87%
    - Eficiência de Atendimento: Operacional
"""

from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.modules.employees.repository import EmployeeRepository
from app.modules.units.repository import UnitRepository
from app.modules.vacations.repository import VacationRepository
from app.modules.production.repository import ProductionRepository
from app.modules.availability.service import AvailabilityService
from app.modules.dashboard.schemas import DashboardMetrics
from app.modules.employees.model import Employee
from app.modules.units.model import Unit
from app.modules.goals.repository import GoalRepository
from app.modules.production.service import ProductionService

class DashboardService:
    """Service de agregação de métricas do dashboard."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.employee_repo = EmployeeRepository(db)
        self.unit_repo = UnitRepository(db)
        self.vacation_repo = VacationRepository(db)
        self.production_repo = ProductionRepository(db)
        self.goal_repo = GoalRepository(db)
        self.availability_service = AvailabilityService(db)
        self.production_service = ProductionService(db)

    async def get_metrics(self) -> DashboardMetrics:
        # Total employees (not deleted)
        total_emp_query = select(func.count(Employee.id)).where(Employee.is_deleted == False)
        result = await self.db.execute(total_emp_query)
        total_employees = result.scalar() or 0
        
        # Total units
        total_unit_query = select(func.count(Unit.id)).where(Unit.is_active == True)
        result = await self.db.execute(total_unit_query)
        total_units = result.scalar() or 0
        
        # Active employees
        active_emp_query = select(func.count(Employee.id)).where(Employee.status == "ativo", Employee.is_deleted == False)
        result = await self.db.execute(active_emp_query)
        active_employees = result.scalar() or 0
        
        # On vacation
        on_vacation = await self.vacation_repo.count_active()
        
        # Recent hires (last 30 days)
        thirty_days_ago = date.today() - timedelta(days=30)
        recent_hires_query = select(func.count(Employee.id)).where(Employee.hire_date >= thirty_days_ago, Employee.is_deleted == False)
        result = await self.db.execute(recent_hires_query)
        recent_hires = result.scalar() or 0
        
        # Monthly goal pct
        today = date.today()
        monthly_goal_pct = await self.goal_repo.get_overall_achievement_pct(today.year, today.month)
        
        # Efficiency
        avail_summary = await self.availability_service.get_all_availability()
        efficiency = avail_summary.overall_efficiency
        efficiency_label = "Operacional"
        if efficiency < 50:
             efficiency_label = "Crítico"
        elif efficiency > 95:
             efficiency_label = "Excelente"
             
        # Production
        production_total_month = await self.production_repo.get_monthly_total(today.year, today.month)
        growth_pct = await self.production_service.get_growth_percentage(today.year, today.month)
        
        return DashboardMetrics(
            total_employees=total_employees,
            total_units=total_units,
            on_vacation=on_vacation,
            recent_hires=recent_hires,
            active_employees=active_employees,
            monthly_goal_pct=monthly_goal_pct,
            efficiency=efficiency,
            efficiency_label=efficiency_label,
            production_total_month=production_total_month,
            production_growth_pct=growth_pct
        )
