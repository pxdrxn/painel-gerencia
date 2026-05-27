import asyncio
import asyncpg
import sys
import os
from urllib.parse import urlparse

# Adiciona o diretório raiz ao path para conseguir importar app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_settings


async def main():
    try:
        settings = get_settings()
        db_url = settings.DATABASE_URL
        
        # Substitui driver se necessário
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
            
        # Parse connection URL
        parsed = urlparse(db_url)
        
        # Neon exige conexão SSL. Adaptamos a query para o asyncpg.
        query = parsed.query
        if "sslmode=require" in query:
            query = query.replace("sslmode=require", "ssl=require")
        elif not query:
            query = "ssl=require"
            
        # Conecta no banco padrão 'postgres' para criar 'painel_gerencia'
        dsn = f"postgresql://{parsed.username}:{parsed.password}@{parsed.hostname}:{parsed.port or 5432}/postgres?{query}"
        
        db_name = parsed.path.lstrip("/")
        if not db_name:
            db_name = "painel_gerencia"
            
        conn = await asyncpg.connect(dsn)
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", db_name)
        if not exists:
            # Sanitiza nome do banco para evitar SQL injection
            clean_db_name = "".join(c for c in db_name if c.isalnum() or c == "_")
            await conn.execute(f'CREATE DATABASE "{clean_db_name}"')
            print(f'Database {clean_db_name} created successfully.')
        else:
            print(f'Database {db_name} already exists.')
        await conn.close()
    except Exception as e:
        print(f'Error: {e}')
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
