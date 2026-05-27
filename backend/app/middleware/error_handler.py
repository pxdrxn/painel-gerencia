"""
Error Handler global.
======================
Converte exceções AppException em responses JSON padronizados.
Captura exceções não tratadas e retorna 500 com log.

Registro:
    Chamado em main.py via register_error_handlers(app)

Formato de erro:
    {
        "success": false,
        "message": "Mensagem de erro",
        "data": null
    }
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.exceptions import AppException


import logging
import traceback

def register_error_handlers(app: FastAPI) -> None:
    """
    Registra handlers de exceção globais na aplicação FastAPI.
    """
    logger = logging.getLogger("app.error_handler")

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        """
        Handler para exceções de negócio (AppException e subclasses).
        """
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message,
                "detail": exc.detail,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """
        Handler para exceções não tratadas.
        """
        logger.error(f"Unhandled Exception: {exc}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Erro interno do servidor",
                "detail": None,
            },
        )
