"""
Segurança — JWT e Hashing de Senhas.
======================================
Centraliza toda a lógica de tokens e senhas.

Dependências:
    - python-jose[cryptography] (JWT)
    - passlib[bcrypt] (hashing)

Uso:
    from app.core.security import create_access_token, verify_password
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
from jose import JWTError, jwt
from app.core.config import get_settings
from app.core.exceptions import UnauthorizedException

settings = get_settings()


# --- Password Hashing ---

def hash_password(password: str) -> str:
    """
    Gera hash bcrypt de uma senha plaintext.

    Args:
        password: Senha em texto puro.

    Returns:
        Hash bcrypt da senha.
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha plaintext corresponde ao hash.

    Args:
        plain_password: Senha em texto puro.
        hashed_password: Hash bcrypt armazenado.

    Returns:
        True se a senha corresponde.
    """
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


# --- JWT Tokens ---

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Cria um access token JWT.

    Payload deve conter:
        - sub: user_id (UUID como string)
        - role: role do usuário
        - exp: timestamp de expiração
        - type: "access"

    Args:
        data: Dados a codificar no token (sub, role).
        expires_delta: Tempo de expiração customizado (opcional).

    Returns:
        Token JWT encoded.
    """
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Cria um refresh token JWT com expiração mais longa.

    Payload deve conter:
        - sub: user_id (UUID como string)
        - exp: timestamp de expiração
        - type: "refresh"

    Args:
        data: Dados a codificar (sub).
        expires_delta: Tempo de expiração (default: JWT_REFRESH_TOKEN_EXPIRE_DAYS).

    Returns:
        Refresh token JWT encoded.
    """
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str, expected_type: str | None = None) -> dict:
    """
    Decodifica e valida um token JWT.

    Args:
        token: Token JWT encoded.
        expected_type: Tipo de token esperado ("access" ou "refresh").

    Returns:
        Payload decodificado (sub, role, exp, type).

    Raises:
        UnauthorizedException: Se o token for inválido, expirado ou tiver tipo incorreto.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        
        # Validar tipo de token
        if expected_type and payload.get("type") != expected_type:
            raise UnauthorizedException("Tipo de token inválido")
            
        return payload
    except JWTError:
        raise UnauthorizedException("Token inválido ou expirado")
