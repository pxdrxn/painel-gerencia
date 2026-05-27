"""
Envelope de resposta padronizado.
==================================
Todas as APIs retornam respostas neste formato para consistência.

Formato:
    {
        "success": true,
        "data": {...} ou [...],
        "message": "Operação realizada com sucesso",
        "meta": {                     # Somente em listas paginadas
            "page": 1,
            "per_page": 20,
            "total": 150,
            "total_pages": 8
        }
    }

Uso:
    from app.core.responses import success_response, paginated_response, error_response
"""

from typing import Any
from pydantic import BaseModel


class PaginationMeta(BaseModel):
    """Metadados de paginação."""
    page: int
    per_page: int
    total: int
    total_pages: int


class ApiResponse(BaseModel):
    """Envelope padrão de resposta da API."""
    success: bool
    data: Any = None
    message: str = ""
    meta: PaginationMeta | None = None


def success_response(
    data: Any = None,
    message: str = "Operação realizada com sucesso",
) -> dict:
    """
    Cria uma resposta de sucesso.

    Args:
        data: Dados a retornar (dict, list, ou None).
        message: Mensagem descritiva.

    Returns:
        Dict no formato do envelope padronizado.
    """
    return {
        "success": True,
        "data": data,
        "message": message,
    }


def paginated_response(
    data: list,
    total: int,
    page: int,
    per_page: int,
    message: str = "",
) -> dict:
    """
    Cria uma resposta paginada.

    Args:
        data: Lista de itens da página atual.
        total: Total de itens (todas as páginas).
        page: Página atual.
        per_page: Itens por página.
        message: Mensagem descritiva (opcional).

    Returns:
        Dict com data + meta de paginação.
    """
    total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
    return {
        "success": True,
        "data": data,
        "message": message,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
        },
    }


def error_response(
    message: str = "Erro interno",
    detail: Any = None,
) -> dict:
    """
    Cria uma resposta de erro.

    Args:
        message: Mensagem de erro.
        detail: Detalhes adicionais (opcional).

    Returns:
        Dict no formato de erro.
    """
    return {
        "success": False,
        "data": None,
        "message": message,
        "detail": detail,
    }
