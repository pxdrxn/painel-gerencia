"""
Script para popular o banco com dados iniciais limpos e consistentes.
=====================================================================
Cria:
    - 10 unidades da S.O.S Crédito
    - Exatamente 15 funcionários ativos/férias distribuídos
    - Produção mensal das lojas de exemplo para histórico
    - Metas mensais das lojas de exemplo

Uso:
    python -m scripts.seed
"""

import asyncio
import random
import sys
import os
import sqlalchemy as sa
from datetime import date, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.modules.units.model import Unit
from app.modules.employees.model import Employee
from app.modules.vacations.model import Vacation
from app.modules.production.model import MonthlyProduction
from app.modules.goals.model import UnitGoal

UNITS_DATA = [
    {"name": "S.O.S Matriz Centro", "phone": "(11) 3333-0001", "att": 5, "pam": 2, "ana": 3},
    {"name": "S.O.S Unidade Sul", "phone": "(11) 3333-0002", "att": 3, "pam": 1, "ana": 2},
    {"name": "S.O.S Unidade Norte", "phone": "(11) 3333-0003", "att": 4, "pam": 2, "ana": 2},
    {"name": "S.O.S Shopping", "phone": "(11) 3333-0004", "att": 6, "pam": 0, "ana": 3},
    {"name": "S.O.S Expresso Digital", "phone": "(11) 3333-0005", "att": 2, "pam": 0, "ana": 5},
    {"name": "S.O.S Unidade Leste", "phone": "(11) 3333-0006", "att": 3, "pam": 1, "ana": 2},
    {"name": "S.O.S Unidade Oeste", "phone": "(11) 3333-0007", "att": 3, "pam": 1, "ana": 2},
    {"name": "S.O.S Avenida", "phone": "(11) 3333-0008", "att": 4, "pam": 2, "ana": 2},
    {"name": "S.O.S Estação", "phone": "(11) 3333-0009", "att": 3, "pam": 1, "ana": 1},
    {"name": "S.O.S Bairro", "phone": "(11) 3333-0010", "att": 2, "pam": 1, "ana": 1},
]

NAMES = [
    "Ricardo", "Ana", "João", "Maria", "Pedro", "Lucas", "Julia", "Marcos", 
    "Fernanda", "Carlos", "Beatriz", "Rafael", "Gabriela", "Felipe", "Mariana"
]
SURNAMES = [
    "Mendes", "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", 
    "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho"
]

def generate_cpf(index: int):
    # CPF determinístico para evitar colisões
    return f"{300 + index:03d}.123.456-{index:02d}"

async def seed_db():
    async with AsyncSessionLocal() as db:
        print("Limpando tabelas...")
        await db.execute(sa.text("TRUNCATE TABLE vacations CASCADE;"))
        await db.execute(sa.text("TRUNCATE TABLE monthly_production CASCADE;"))
        await db.execute(sa.text("TRUNCATE TABLE unit_goals CASCADE;"))
        await db.execute(sa.text("TRUNCATE TABLE employees CASCADE;"))
        await db.execute(sa.text("TRUNCATE TABLE units CASCADE;"))
        await db.commit()

        print("Populando 10 unidades...")
        db_units = []
        for u in UNITS_DATA:
            unit = Unit(
                name=u["name"],
                phone=u["phone"],
                required_attendants=u["att"],
                required_pamphletists=u["pam"],
                required_analysts=u["ana"],
                is_active=True
            )
            db.add(unit)
            db_units.append(unit)
        await db.flush()

        print("Populando exatamente 15 funcionários...")
        # Definimos uma distribuição determinística de cargos para totalizar exatamente 15 colaboradores
        positions = [
            ("gerente", 0),  # Ricardo Mendes na Matriz
            ("gerente", 1),  # Unidade Sul
            ("gerente", 2),  # Unidade Norte
            ("supervisor", 0),  # Supervisor geral na Matriz
            ("atendente", 0),
            ("atendente", 0),
            ("atendente", 1),
            ("atendente", 2),
            ("atendente", 3),
            ("panfletista", 0),
            ("panfletista", 1),
            ("panfletista", 2),
            ("panfletista", 5),
            ("analista", 0),
            ("analista", 4)
        ]

        db_employees = []
        for i, (pos, unit_idx) in enumerate(positions):
            unit = db_units[unit_idx]
            status = "ativo"
            # Coloca um funcionário em férias para testar a aba de férias
            if i == 5:
                status = "ferias"

            emp = Employee(
                name=f"{NAMES[i]} {SURNAMES[i]}",
                cpf=generate_cpf(i),
                phone=f"(11) 98765-43{i:02d}",
                email=f"{NAMES[i].lower()}.{SURNAMES[i].lower()}@soscredito.com.br",
                position=pos,
                unit_id=unit.id,
                hire_date=date.today() - timedelta(days=200 + i * 20),
                status=status
            )
            db.add(emp)
            db_employees.append(emp)
            await db.flush()

            # Atribui gerentes às suas respectivas unidades
            if pos == "gerente":
                unit.manager_id = emp.id
        
        await db.flush()

        print("Populando produção mensal e metas para cada loja...")
        today = date.today()
        # Seed dados dos últimos 5 meses
        for unit in db_units:
            for m in range(1, today.month + 1):
                # Faturamento mensal (valor em Reais)
                quantity = random.randint(50, 150) * 1000
                prod = MonthlyProduction(
                    unit_id=unit.id,
                    year=today.year,
                    month=m,
                    quantity=quantity,
                    observations=f"Faturamento da unidade {unit.name} em {m}/{today.year}"
                )
                db.add(prod)

                # Metas da loja
                target = random.randint(80, 130)
                achieved = random.randint(int(target * 0.7), int(target * 1.25))
                goal = UnitGoal(
                    unit_id=unit.id,
                    year=today.year,
                    month=m,
                    target_value=target,
                    achieved_value=achieved
                )
                db.add(goal)

        await db.commit()
        print("Seed finalizado com sucesso! Exatamente 10 unidades e 15 funcionários criados.")

if __name__ == "__main__":
    asyncio.run(seed_db())
