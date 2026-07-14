#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/apps/tio-carona}"
CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-tio-carona-postgres}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: $0 /caminho/do/backup.dump" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERRO: backup não encontrado: $BACKUP_FILE" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: arquivo .env não encontrado em: $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

: "${POSTGRES_DB:?POSTGRES_DB não definido no .env}"
: "${POSTGRES_USER:?POSTGRES_USER não definido no .env}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "ERRO: container $CONTAINER_NAME não está em execução." >&2
  exit 1
fi

cat <<MSG
ATENÇÃO: esta operação vai restaurar o banco '$POSTGRES_DB'.
Ela deve ser feita com o backend parado para evitar gravações durante o restore.

Backup selecionado:
$BACKUP_FILE
MSG

read -r -p "Digite RESTAURAR para continuar: " CONFIRMA
if [ "$CONFIRMA" != "RESTAURAR" ]; then
  echo "Operação cancelada."
  exit 0
fi

echo "Parando backend..."
cd "$APP_DIR"
docker compose stop tio-carona-backend || true

echo "Encerrando conexões ativas..."
docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d postgres <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${POSTGRES_DB}'
  AND pid <> pg_backend_pid();
SQL

echo "Recriando banco '$POSTGRES_DB'..."
docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d postgres <<SQL
DROP DATABASE IF EXISTS ${POSTGRES_DB};
CREATE DATABASE ${POSTGRES_DB};
SQL

echo "Restaurando backup..."
cat "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" pg_restore \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists

echo "Subindo backend..."
docker compose up -d tio-carona-backend

echo "Restore concluído. Acompanhe os logs com:"
echo "docker logs -f tio-carona-backend"
