"""
Script para ZERAR completamente o banco de dados.
====================================================
Remove TODOS os dados das tabelas operacionais:
    - vacations (férias)
    - monthly_production (produção mensal)
    - unit_goals (metas)
    - employees (funcionários)
    - units (unidades)
    - users (usuários de acesso — EXCETO o admin padrão)

Uso:
    python -m scripts.clear_db
"""

import asyncio
import sys
import os
import sqlalchemy as sa

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import AsyncSessionLocal


async def clear_db():
    async with AsyncSessionLocal() as db:
        print("=" * 50)
        print("  ZERANDO BANCO DE DADOS — S.O.S Crédito")
        print("=" * 50)

        print("\n[1/5] Removendo férias...")
        await db.execute(sa.text("TRUNCATE TABLE vacations CASCADE;"))

        print("[2/5] Removendo produção mensal...")
        await db.execute(sa.text("TRUNCATE TABLE monthly_production CASCADE;"))

        print("[3/5] Removendo metas...")
        await db.execute(sa.text("TRUNCATE TABLE unit_goals CASCADE;"))

        print("[4/5] Removendo funcionários...")
        await db.execute(sa.text("TRUNCATE TABLE employees CASCADE;"))

        print("[5/5] Removendo unidades...")
        await db.execute(sa.text("TRUNCATE TABLE units CASCADE;"))

        await db.commit()

        print("\n" + "=" * 50)
        print("  BANCO ZERADO COM SUCESSO!")
        print("  Agora acesse o sistema e cadastre:")
        print("  1. Suas unidades (aba Unidades)")
        print("  2. Seus funcionários (aba Funcionários)")
        print("  3. Os valores de produção (aba Produção)")
        print("=" * 50 + "\n")


if __name__ == "__main__":
    asyncio.run(clear_db())
