"""
Alembic env.py — Configuração de migrações.
=============================================
Configurado para usar AsyncEngine do SQLAlchemy.
Importa todos os models para auto-detecção de mudanças.
"""

import asyncio
import sys
from logging.config import fileConfig

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import get_settings
from app.database.base import Base

# Importar TODOS os models para que o Alembic detecte mudanças
from app.modules.users.model import User  # noqa: F401
from app.modules.employees.model import Employee  # noqa: F401
from app.modules.units.model import Unit  # noqa: F401
from app.modules.vacations.model import Vacation  # noqa: F401
from app.modules.production.model import MonthlyProduction  # noqa: F401
from app.modules.goals.model import UnitGoal  # noqa: F401
from app.modules.auth.model import RevokedToken  # noqa: F401
from app.modules.absences.model import Absence  # noqa: F401
from app.modules.saturday_scales.model import SaturdayScale  # noqa: F401

# Alembic Config object
config = context.config

# Setup logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# MetaData dos models para autogenerate
target_metadata = Base.metadata

# Sobrescrever sqlalchemy.url com o valor do .env
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)


def run_migrations_offline() -> None:
    """Rodar migrations em modo offline (gera SQL sem conectar)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Rodar migrations em modo online (sync)."""
    from sqlalchemy import create_engine
    
    # Troca o driver async pelo psycopg2 para a migração
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
    
    connectable = create_engine(
        sync_url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
