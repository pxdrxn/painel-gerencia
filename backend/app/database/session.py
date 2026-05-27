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

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    echo=settings.DB_ECHO,
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
    Inicializa o banco de dados.
    """
    # Validação simples da conexão (rodar "SELECT 1")
    async with engine.begin() as conn:
        from sqlalchemy import text
        await conn.execute(text("SELECT 1"))


async def close_db() -> None:
    """
    Fecha o pool de conexões.
    """
    await engine.dispose()
