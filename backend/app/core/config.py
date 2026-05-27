"""
Configurações centralizadas da aplicação.
==========================================
Usa pydantic-settings para carregar variáveis de ambiente do .env.

Todas as configurações sensíveis (senhas, chaves, URLs de banco)
devem estar no .env e NUNCA hardcoded.

Uso:
    from app.core.config import get_settings
    settings = get_settings()
    print(settings.DATABASE_URL)
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações da aplicação carregadas do .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # --- App ---
    APP_NAME: str = "S.O.S Crédito — Painel de Gerência"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development | staging | production

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # --- Database (Neon PostgreSQL) ---
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/painel_gerencia"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_ECHO: bool = False  # True para logar SQL queries (debug)

    # --- JWT ---
    JWT_SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- CORS ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",  # Next.js dev
    ]

    # --- URLs ---
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    """Retorna instância cacheada das configurações."""
    return Settings()
