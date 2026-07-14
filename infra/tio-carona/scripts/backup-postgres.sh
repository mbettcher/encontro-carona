#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/apps/tio-carona"
BACKUP_DIR="$APP_DIR/postgres/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

cd "$APP_DIR"

mkdir -p "$BACKUP_DIR"

docker compose --env-file .env -f docker-compose.yml exec -T tio-carona-postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  > "$BACKUP_DIR/encontro_carona-$TIMESTAMP.sql"

find "$BACKUP_DIR" -type f -name "encontro_carona-*.sql" -mtime +7 -delete

echo "Backup gerado em: $BACKUP_DIR/encontro_carona-$TIMESTAMP.sql"
