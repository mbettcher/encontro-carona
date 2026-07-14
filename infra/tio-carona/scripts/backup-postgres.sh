#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/apps/tio-carona}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/tio-carona/postgres}"
CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-tio-carona-postgres}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

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

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/${POSTGRES_DB}-${TIMESTAMP}.dump"
LATEST_FILE="$BACKUP_DIR/${POSTGRES_DB}-latest.dump"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "ERRO: container $CONTAINER_NAME não está em execução." >&2
  exit 1
fi

echo "Iniciando backup do banco '$POSTGRES_DB' em $BACKUP_FILE"

docker exec "$CONTAINER_NAME" pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -F c \
  --no-owner \
  --no-acl \
  > "$BACKUP_FILE"

chmod 600 "$BACKUP_FILE"
cp "$BACKUP_FILE" "$LATEST_FILE"
chmod 600 "$LATEST_FILE"

find "$BACKUP_DIR" -type f -name "${POSTGRES_DB}-*.dump" -mtime +"$RETENTION_DAYS" ! -name "${POSTGRES_DB}-latest.dump" -delete

echo "Backup concluído: $BACKUP_FILE"
echo "Cópia latest atualizada: $LATEST_FILE"
echo "Backups mantidos por ${RETENTION_DAYS} dia(s)."
