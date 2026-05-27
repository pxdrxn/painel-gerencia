import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import pool

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/painel_gerencia', poolclass=pool.NullPool)
    async with engine.connect() as conn:
        print('Connected!')
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(main())
