"""
Exceções customizadas de negócio.
==================================
Hierarquia de exceções tipadas para tratamento consistente.

Cada exceção tem um status_code HTTP associado.
O middleware error_handler converte automaticamente em JSON padronizado.

Uso:
    from app.core.exceptions import NotFoundException
    raise NotFoundException("Funcionário não encontrado")
"""


class AppException(Exception):
    """
    Exceção base da aplicação.

    Attributes:
        message: Mensagem de erro legível.
        status_code: Código HTTP associado.
        detail: Detalhes adicionais (opcional).
    """

    def __init__(
        self,
        message: str = "Erro interno do servidor",
        status_code: int = 500,
        detail: dict | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class NotFoundException(AppException):
    """Recurso não encontrado (404)."""

    def __init__(self, message: str = "Recurso não encontrado") -> None:
        super().__init__(message=message, status_code=404)


class ConflictException(AppException):
    """
    Conflito de dados (409).

    Exemplos:
        - CPF já cadastrado
        - Férias conflitantes no mesmo período
        - Meta duplicada para o mesmo mês
    """

    def __init__(self, message: str = "Conflito de dados") -> None:
        super().__init__(message=message, status_code=409)


class ForbiddenException(AppException):
    """Acesso negado — permissão insuficiente (403)."""

    def __init__(self, message: str = "Acesso negado") -> None:
        super().__init__(message=message, status_code=403)


class UnauthorizedException(AppException):
    """Não autenticado — token inválido ou ausente (401)."""

    def __init__(self, message: str = "Não autenticado") -> None:
        super().__init__(message=message, status_code=401)


class ValidationException(AppException):
    """
    Erro de validação de dados (422).

    Attributes:
        errors: Lista de erros de validação detalhados.
    """

    def __init__(
        self,
        message: str = "Dados inválidos",
        errors: list[dict] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=422, detail={"errors": errors or []})


class BusinessRuleException(AppException):
    """
    Violação de regra de negócio (400).

    Exemplos:
        - Unidade sem atendentes suficientes
        - Funcionário com férias agendadas não pode ser desativado
        - Disponibilidade crítica impede agendamento
    """

    def __init__(self, message: str = "Regra de negócio violada") -> None:
        super().__init__(message=message, status_code=400)
