"""
Middleware de Auditoria.
=========================
Intercepta operações de escrita (POST, PUT, PATCH, DELETE)
e registra na tabela audit_logs via BackgroundTask.

Dados registrados:
    - user_id: UUID do usuário autenticado (do JWT)
    - action: CREATE | UPDATE | DELETE
    - resource_type: "employee", "unit", "vacation", etc.
    - resource_id: UUID do recurso afetado
    - changes: JSONB com diff antes/depois
    - ip_address: IP do cliente
    - timestamp: momento da operação

A persistência é feita via BackgroundTask para não bloquear a response.

Dependências:
    - FastAPI BackgroundTasks
    - Model AuditLog (em modules/audit ou diretamente aqui)
"""

from uuid import UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

# TODO: Imports reais
# from starlette.middleware.base import BaseHTTPMiddleware
# from starlette.requests import Request
# from starlette.responses import Response


# --- Audit Log Model ---
# Pode ser movido para um módulo separado se crescer

# class AuditLog(Base, TimestampMixin):
#     __tablename__ = "audit_logs"
#
#     id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
#     user_id: Mapped[uuid.UUID | None] = mapped_column(UUID, nullable=True)
#     action: Mapped[str]           # CREATE | UPDATE | DELETE | LOGIN | LOGOUT
#     resource_type: Mapped[str]    # "employee", "unit", "vacation"
#     resource_id: Mapped[uuid.UUID | None] = mapped_column(UUID, nullable=True)
#     changes: Mapped[dict | None]  # JSONB — diff antes/depois
#     ip_address: Mapped[str | None]
#     timestamp: Mapped[datetime]


# --- Middleware ---

# class AuditMiddleware(BaseHTTPMiddleware):
#     """
#     Middleware que registra operações de escrita automaticamente.
#
#     Funciona interceptando requests POST/PUT/PATCH/DELETE,
#     extraindo o user_id do JWT e o resource_type do path.
#     """
#
#     async def dispatch(self, request: Request, call_next) -> Response:
#         """
#         Intercepta a request e registra a auditoria.
#
#         Fluxo:
#         1. Verificar se é operação de escrita (POST/PUT/PATCH/DELETE)
#         2. Extrair user_id do header Authorization (JWT)
#         3. Extrair resource_type do path (/api/employees → "employee")
#         4. Processar a request normalmente
#         5. Se status 2xx, agendar BackgroundTask para salvar audit_log
#         """
#         # TODO: Implementar
#         pass


# --- Helper Functions ---

async def create_audit_log(
    db: AsyncSession,
    user_id: UUID | None,
    action: str,
    resource_type: str,
    resource_id: UUID | None = None,
    changes: dict | None = None,
    ip_address: str | None = None,
) -> None:
    """
    Cria um registro de auditoria no banco.

    Chamado via BackgroundTask pelo middleware ou diretamente pelos services.

    Args:
        db: Sessão do banco.
        user_id: UUID do usuário que executou a ação.
        action: Tipo de ação (CREATE, UPDATE, DELETE, LOGIN, LOGOUT).
        resource_type: Tipo do recurso (employee, unit, vacation).
        resource_id: UUID do recurso afetado.
        changes: Dict com o diff das mudanças.
        ip_address: IP do cliente.
    """
    # TODO: Implementar
    # audit = AuditLog(
    #     user_id=user_id,
    #     action=action,
    #     resource_type=resource_type,
    #     resource_id=resource_id,
    #     changes=changes,
    #     ip_address=ip_address,
    #     timestamp=datetime.utcnow(),
    # )
    # db.add(audit)
    # await db.commit()
    raise NotImplementedError


def extract_resource_type(path: str) -> str:
    """
    Extrai o tipo de recurso do path da API.

    Exemplo:
        /api/employees/123 → "employee"
        /api/units → "unit"
        /api/vacations/456/complete → "vacation"

    Args:
        path: Path da request.

    Returns:
        Nome do recurso no singular.
    """
    # TODO: Implementar
    raise NotImplementedError
