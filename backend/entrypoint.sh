#!/bin/sh
# entrypoint.sh — Roda as migrações automáticas antes do start do servidor

set -e

echo "=== Executando alembic migrations (upgrade head) ==="
alembic upgrade head

echo "=== Iniciando o servidor ==="
exec "$@"
