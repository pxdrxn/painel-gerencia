"""
Fixtures globais para testes.
================================
Configura:
    - Banco de dados de teste (SQLite async ou Testcontainers PostgreSQL)
    - Sessão de teste
    - Client HTTP (httpx AsyncClient)
    - Usuário de teste autenticado
    - Factory de dados de teste
"""

# TODO: Implementar fixtures
# import pytest
# from httpx import AsyncClient, ASGITransport
# from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
# from app.main import app
# from app.database.session import get_db
# from app.database.base import Base

# @pytest.fixture
# async def db_session():
#     """Sessão de banco de dados para testes (usa SQLite in-memory)."""
#     pass

# @pytest.fixture
# async def client(db_session):
#     """Client HTTP para testes de integração."""
#     pass

# @pytest.fixture
# async def auth_headers(client):
#     """Headers com JWT token para testes autenticados."""
#     pass
