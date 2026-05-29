"""
S.O.S Crédito — Painel de Gerência
===================================
Ponto de entrada da aplicação FastAPI.

Responsabilidades deste arquivo:
- Criar instância FastAPI com metadata
- Configurar CORS middleware
- Registrar todos os routers dos módulos
- Registrar middlewares globais (audit, error_handler)
- Configurar evento de startup (conexão DB)
- Configurar evento de shutdown (fechar conexões)

NÃO colocar lógica de negócio aqui.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.employees.router import router as employees_router
from app.modules.units.router import router as units_router
from app.modules.vacations.router import router as vacations_router
from app.modules.availability.router import router as availability_router
from app.modules.production.router import router as production_router
from app.modules.goals.router import router as goals_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.absences.router import router as absences_router
from app.modules.saturday_scales.router import router as saturday_scales_router

from app.middleware.error_handler import register_error_handlers
from app.middleware.security_headers import SecurityHeadersMiddleware

from app.database.session import init_db, close_db
from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciador de ciclo de vida (startup e shutdown)."""
    # Executado ao iniciar a aplicação
    await init_db()
    yield
    # Executado ao desligar a aplicação
    await close_db()


def create_app() -> FastAPI:
    """Factory function para criar a aplicação FastAPI."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="API do Painel de Gerência Operacional — S.O.S Crédito",
        docs_url="/api/docs" if settings.DEBUG else None,
        redoc_url="/api/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # --- CORS ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # --- Middlewares ---
    app.add_middleware(SecurityHeadersMiddleware)
    register_error_handlers(app)

    # --- Rate Limiter Setup ---
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # --- Routers ---
    app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
    app.include_router(users_router, prefix="/api/users", tags=["Users"])
    app.include_router(employees_router, prefix="/api/employees", tags=["Employees"])
    app.include_router(units_router, prefix="/api/units", tags=["Units"])
    app.include_router(vacations_router, prefix="/api/vacations", tags=["Vacations"])
    app.include_router(availability_router, prefix="/api/availability", tags=["Availability"])
    app.include_router(production_router, prefix="/api/production", tags=["Production"])
    app.include_router(goals_router, prefix="/api/goals", tags=["Goals"])
    app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
    app.include_router(absences_router, prefix="/api/absences", tags=["Absences"])
    app.include_router(saturday_scales_router, prefix="/api/saturday-scales", tags=["Saturday Scales"])

    @app.get("/api/health", tags=["Health"])
    async def health_check() -> dict:
        """Endpoint de health check para o Render."""
        return {"status": "healthy", "version": settings.APP_VERSION}

    return app


app = create_app()
