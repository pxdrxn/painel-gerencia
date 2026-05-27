"""
Script para criar o primeiro usuário administrador.
======================================================
Uso:
    python -m scripts.create_admin

Solicita email e senha via input.
"""

import asyncio
import sys
import os

# Adiciona o diretório raiz ao path para conseguir importar app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.modules.users.model import User
from app.core.security import hash_password


async def create_admin():
    print("=== Criação de Admin Inicial ===")
    
    # Tenta ler do ambiente primeiro para deploy automático
    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    full_name = os.environ.get("ADMIN_FULL_NAME", "Admin Inicial")
    
    # Se não configurado, cai no input interativo
    if not email:
        try:
            email = input("Email do admin: ")
        except (IOError, EOFError):
            print("Erro: Input interativo indisponível e ADMIN_EMAIL não configurado.")
            return
            
    if not password:
        try:
            password = input("Senha: ")
        except (IOError, EOFError):
            print("Erro: Input interativo indisponível e ADMIN_PASSWORD não configurado.")
            return
            
    if not email or not password:
        print("Erro: Email e Senha são obrigatórios.")
        return

    async with AsyncSessionLocal() as db:
        # Check if exists
        query = select(User).where(User.email == email)
        result = await db.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            print(f"Aviso: Usuário {email} já cadastrado. Nenhuma ação necessária.")
            return

        hashed = hash_password(password)
        admin = User(
            email=email,
            hashed_password=hashed,
            full_name=full_name,
            role="admin",
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print(f"Sucesso: Admin {email} criado com sucesso.")


if __name__ == "__main__":
    asyncio.run(create_admin())
