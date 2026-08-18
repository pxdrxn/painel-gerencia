"""
Sessão assíncrona do banco de dados.
======================================
Factory de sessão AsyncSession com connection pooling.

Responsabilidades:
    - Criar engine async (asyncpg)
    - Configurar pool de conexões
    - Fornecer dependency get_db() para injeção no FastAPI
    - Registrar event listener para soft delete filter automático

Uso nos routers:
    from app.database.session import get_db

    @router.get("/")
    async def list_items(db: AsyncSession = Depends(get_db)):
        ...

Dependências:
    - sqlalchemy[asyncio]
    - asyncpg
"""

from collections.abc import AsyncGenerator

from sqlalchemy import event
from sqlalchemy.orm import Session, with_loader_criteria
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.database.base import SoftDeleteMixin

settings = get_settings()

# asyncpg não suporta 'sslmode' ou 'channel_binding', exige 'ssl=require'
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

if "postgresql+asyncpg" in db_url:
    import re
    db_url = re.sub(r'[&?]channel_binding=[^&]+', '', db_url)
    db_url = re.sub(r'[&?]sslmode=[^&]+', '', db_url)
    if "localhost" not in db_url and "127.0.0.1" not in db_url:
        if "ssl=" not in db_url:
            db_url += ("&" if "?" in db_url else "?") + "ssl=require"

engine = create_async_engine(
    db_url,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    echo=settings.DB_ECHO,
    connect_args={"timeout": 10},  # timeout de conexão de 10s
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

AsyncSessionLocal = async_session_factory


@event.listens_for(Session, "do_orm_execute")
def _apply_soft_delete_filter(execute_state):
    """Filtra automaticamente registros com is_deleted=True."""
    if execute_state.is_select and not execute_state.execution_options.get("include_deleted", False):
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                SoftDeleteMixin,
                lambda cls: cls.is_deleted == False,
                include_aliases=True,
            )
        )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency que fornece uma sessão de banco de dados.

    A sessão é automaticamente fechada ao final da request.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Inicializa o banco de dados e garante schemas essenciais.
    """
    async with engine.begin() as conn:
        from sqlalchemy import text
        await conn.execute(text("SELECT 1"))
        await conn.execute(text("ALTER TABLE vacations ADD COLUMN IF NOT EXISTS pause_date DATE"))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS daily_rates (
                id UUID PRIMARY KEY,
                employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                daily_value NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
                days_count NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
                total_value NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
                rule_type VARCHAR(30) NOT NULL DEFAULT 'seg_sab',
                work_saturdays BOOLEAN NOT NULL DEFAULT TRUE,
                discount_absences BOOLEAN NOT NULL DEFAULT TRUE,
                discount_vacations BOOLEAN NOT NULL DEFAULT TRUE,
                absences_deducted INTEGER NOT NULL DEFAULT 0,
                vacations_deducted INTEGER NOT NULL DEFAULT 0,
                saturday_half_days INTEGER NOT NULL DEFAULT 0,
                additions_value NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
                discounts_value NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
                status VARCHAR(20) NOT NULL DEFAULT 'pendente',
                payment_date DATE,
                notes TEXT,
                details_breakdown JSON NOT NULL DEFAULT '[]'::json,
                created_by UUID,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_daily_rates_employee_id ON daily_rates (employee_id)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_daily_rates_start_date ON daily_rates (start_date)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_daily_rates_end_date ON daily_rates (end_date)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_daily_rates_status ON daily_rates (status)"))


async def close_db() -> None:
    """
    Fecha o pool de conexões.
    """
    await engine.dispose()
