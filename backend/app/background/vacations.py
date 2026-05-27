"""
Background Task — Processamento automático de férias.
=======================================================
Para execução via cron job (Render Cron Jobs) ou endpoint protegido.

Tarefas:
    1. Verificar férias que iniciam hoje → atualizar status do funcionário para 'ferias'
    2. Verificar férias que terminam hoje → restaurar status para 'ativo'
"""


import logging
from datetime import date
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.modules.vacations.model import Vacation
from app.modules.employees.model import Employee
from app.background.availability import recalculate_unit_availability

logger = logging.getLogger(__name__)

async def process_vacation_starts() -> None:
    """
    Processa férias que iniciam hoje.

    Fluxo:
        1. Buscar férias com status='agendada' e start_date=hoje
        2. Atualizar status da férias para 'em_andamento'
        3. Atualizar status do funcionário para 'ferias'
        4. Disparar recálculo de disponibilidade da unidade

    Executar diariamente via cron job.
    """
    today = date.today()
    async with AsyncSessionLocal() as db:
        try:
            query = select(Vacation).where(
                Vacation.status == "agendada",
                Vacation.start_date <= today
            )
            result = await db.execute(query)
            vacations = result.scalars().all()
            
            for vac in vacations:
                vac.status = "em_andamento"
                
                emp_query = select(Employee).where(Employee.id == vac.employee_id)
                emp_res = await db.execute(emp_query)
                emp = emp_res.scalars().first()
                if emp:
                    emp.status = "ferias"
                    
            await db.commit()
            
            for vac in vacations:
                emp_query = select(Employee).where(Employee.id == vac.employee_id)
                emp_res = await db.execute(emp_query)
                emp = emp_res.scalars().first()
                if emp:
                    await recalculate_unit_availability(emp.unit_id)
                    
            logger.info(f"Processed {len(vacations)} vacation starts")
        except Exception as e:
            await db.rollback()
            logger.error(f"Error processing vacation starts: {e}")


async def process_vacation_ends() -> None:
    """
    Processa férias que terminam hoje.

    Fluxo:
        1. Buscar férias com status='em_andamento' e end_date=hoje
        2. Atualizar status da férias para 'concluida'
        3. Atualizar status do funcionário para 'ativo'
        4. Disparar recálculo de disponibilidade da unidade

    Executar diariamente via cron job.
    """
    today = date.today()
    async with AsyncSessionLocal() as db:
        try:
            query = select(Vacation).where(
                Vacation.status == "em_andamento",
                Vacation.end_date < today
            )
            result = await db.execute(query)
            vacations = result.scalars().all()
            
            for vac in vacations:
                vac.status = "concluida"
                
                emp_query = select(Employee).where(Employee.id == vac.employee_id)
                emp_res = await db.execute(emp_query)
                emp = emp_res.scalars().first()
                if emp:
                    emp.status = "ativo"
                    
            await db.commit()
            
            for vac in vacations:
                emp_query = select(Employee).where(Employee.id == vac.employee_id)
                emp_res = await db.execute(emp_query)
                emp = emp_res.scalars().first()
                if emp:
                    await recalculate_unit_availability(emp.unit_id)
                    
            logger.info(f"Processed {len(vacations)} vacation ends")
        except Exception as e:
            await db.rollback()
            logger.error(f"Error processing vacation ends: {e}")
