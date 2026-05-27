"""
Sistema de Permissões RBAC (Role-Based Access Control).
=========================================================
Define roles, permissões e guards para proteger endpoints.

Três níveis hierárquicos:
    - ADMIN: acesso total ao sistema
    - SUPERVISOR: gestão de equipe + relatórios
    - OPERACIONAL: somente leitura + registro de produção

Uso nos routers:
    @router.post("/", dependencies=[Depends(require_role(Role.ADMIN))])
    async def create_employee(...): ...

    @router.get("/", dependencies=[Depends(require_roles([Role.ADMIN, Role.SUPERVISOR]))])
    async def list_employees(...): ...
"""

from enum import Enum
from fastapi import Depends
from app.modules.auth.dependencies import get_current_user
from app.core.exceptions import ForbiddenException
from app.modules.users.model import User


class Role(str, Enum):
    """Roles do sistema."""
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    OPERACIONAL = "operacional"


class Permission(str, Enum):
    """
    Permissões granulares por recurso.

    Formato: <recurso>:<ação>
    """
    # Dashboard
    DASHBOARD_READ = "dashboard:read"

    # Employees
    EMPLOYEES_READ = "employees:read"
    EMPLOYEES_CREATE = "employees:create"
    EMPLOYEES_UPDATE = "employees:update"
    EMPLOYEES_DELETE = "employees:delete"

    # Units
    UNITS_READ = "units:read"
    UNITS_CREATE = "units:create"
    UNITS_UPDATE = "units:update"
    UNITS_DELETE = "units:delete"

    # Vacations
    VACATIONS_READ = "vacations:read"
    VACATIONS_CREATE = "vacations:create"
    VACATIONS_UPDATE = "vacations:update"

    # Production
    PRODUCTION_READ = "production:read"
    PRODUCTION_CREATE = "production:create"
    PRODUCTION_UPDATE = "production:update"

    # Goals
    GOALS_READ = "goals:read"
    GOALS_CREATE = "goals:create"
    GOALS_UPDATE = "goals:update"

    # Users (admin only)
    USERS_READ = "users:read"
    USERS_CREATE = "users:create"
    USERS_UPDATE = "users:update"
    USERS_DELETE = "users:delete"


# Mapeamento Role → Permissões
ROLE_PERMISSIONS: dict[Role, set[Permission]] = {
    Role.ADMIN: set(Permission),  # Todas as permissões

    Role.SUPERVISOR: {
        Permission.DASHBOARD_READ,
        Permission.EMPLOYEES_READ,
        Permission.EMPLOYEES_UPDATE,
        Permission.UNITS_READ,
        Permission.VACATIONS_READ,
        Permission.VACATIONS_CREATE,
        Permission.VACATIONS_UPDATE,
        Permission.PRODUCTION_READ,
        Permission.PRODUCTION_CREATE,
        Permission.PRODUCTION_UPDATE,
        Permission.GOALS_READ,
    },

    Role.OPERACIONAL: {
        Permission.DASHBOARD_READ,
        Permission.EMPLOYEES_READ,
        Permission.UNITS_READ,
        Permission.VACATIONS_READ,
        Permission.PRODUCTION_READ,
        Permission.PRODUCTION_CREATE,
        Permission.GOALS_READ,
    },
}


def require_role(role: Role):
    """
    Dependency que exige uma role específica (respeitando a hierarquia: admin > supervisor > operacional).

    Uso:
        @router.post("/", dependencies=[Depends(require_role(Role.ADMIN))])

    Args:
        role: Role mínima necessária.

    Returns:
        Dependency function para FastAPI.

    Raises:
        ForbiddenException: Se o usuário não tem a role mínima.
    """
    role_hierarchy = {
        Role.ADMIN.value: 3,
        Role.SUPERVISOR.value: 2,
        Role.OPERACIONAL.value: 1
    }

    async def _guard(current_user: User = Depends(get_current_user)) -> User:
        user_role_val = current_user.role
        required_role_val = role.value
        
        # Se a role do usuário não está na hierarquia (ex: desconhecida), nega
        if user_role_val not in role_hierarchy:
            raise ForbiddenException("Perfil com permissão inválida")
            
        # Compara privilégios na hierarquia
        if role_hierarchy[user_role_val] < role_hierarchy[required_role_val]:
            raise ForbiddenException("Acesso negado: permissão insuficiente para este perfil")
            
        return current_user
        
    return _guard


def require_roles(roles: list[Role]):
    """
    Dependency que exige uma das roles listadas (ou Admin).

    Args:
        roles: Lista de roles aceitas.

    Returns:
        Dependency function para FastAPI.
    """
    allowed_roles_vals = {r.value for r in roles}

    async def _guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == Role.ADMIN.value or current_user.role in allowed_roles_vals:
            return current_user
        raise ForbiddenException("Acesso negado: perfil não autorizado para esta operação")
        
    return _guard


def require_permission(permission: Permission):
    """
    Dependency que exige uma permissão granular.

    Verifica se a role do usuário possui a permissão via ROLE_PERMISSIONS.

    Args:
        permission: Permissão necessária (ex: Permission.EMPLOYEES_DELETE).

    Returns:
        Dependency function para FastAPI.
    """
    async def _guard(current_user: User = Depends(get_current_user)) -> User:
        try:
            user_role = Role(current_user.role)
        except ValueError:
            raise ForbiddenException("Acesso negado: perfil de usuário não reconhecido")
            
        permissions = ROLE_PERMISSIONS.get(user_role, set())
        if permission not in permissions:
            raise ForbiddenException(f"Acesso negado: sem permissão para '{permission.value}'")
            
        return current_user
        
    return _guard
