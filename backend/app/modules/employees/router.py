"""
Employees Router — CRUD completo de funcionários.
====================================================
Endpoints:
    GET    /api/employees              → Lista paginada (filtros: status, unidade, cargo, busca)
    GET    /api/employees/{id}         → Detalhes do funcionário
    POST   /api/employees              → Cadastrar (Admin, Supervisor)
    PATCH  /api/employees/{id}         → Editar (Admin, Supervisor)
    DELETE /api/employees/{id}         → Soft delete (Admin)
    GET    /api/employees/{id}/history → Histórico de alterações (Admin, Supervisor)
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.responses import success_response, paginated_response, ApiResponse
from app.modules.auth.dependencies import get_current_active_user, require_manager_role
from app.modules.users.model import User
from app.modules.employees.schemas import EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeListResponse
from app.modules.employees.service import EmployeeService

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def list_employees(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    unit_id: UUID | None = None,
    status: str | None = None,
    position: str | None = None,
    query: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Lista funcionários com paginação e filtros."""
    service = EmployeeService(db)
    filters = {}
    if unit_id:
        filters["unit_id"] = unit_id
    if status:
        filters["status"] = status
    if position:
        filters["position"] = position
        
    result = await service.list_employees(page, per_page, filters, query)
    
    items = []
    for emp in result.items:
        items.append(EmployeeListResponse.model_validate(emp).model_dump())
        
    return paginated_response(
        data=items,
        total=result.total,
        page=result.page,
        per_page=result.per_page
    )

@router.get("/{employee_id}", response_model=ApiResponse)
async def get_employee(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Retorna detalhes do funcionário."""
    service = EmployeeService(db)
    employee = await service.get_employee(employee_id)
    return success_response(data=EmployeeResponse.model_validate(employee).model_dump())

@router.post("", response_model=ApiResponse, status_code=201)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    """Cadastra funcionário."""
    service = EmployeeService(db)
    employee = await service.create_employee(data, current_user.id)
    return success_response(data={"id": str(employee.id)}, message="Funcionário cadastrado")

@router.patch("/{employee_id}", response_model=ApiResponse)
async def update_employee(
    employee_id: UUID,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    """Atualiza dados do funcionário."""
    service = EmployeeService(db)
    employee = await service.update_employee(employee_id, data, current_user.id)
    return success_response(data={"id": str(employee.id)}, message="Funcionário atualizado")

@router.delete("/{employee_id}", response_model=ApiResponse)
async def deactivate_employee(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager_role),
) -> dict:
    """Remove funcionário (soft delete)."""
    service = EmployeeService(db)
    await service.deactivate_employee(employee_id, current_user.id)
    return success_response(message="Funcionário removido")
