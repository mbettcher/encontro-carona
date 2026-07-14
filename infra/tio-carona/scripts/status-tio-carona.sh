#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/apps/tio-carona}"
cd "$APP_DIR"

echo "== Containers =="
docker compose ps

echo
echo "== Uso de disco =="
df -h /

echo
echo "== Volumes/uso Docker =="
docker system df

echo
echo "== Últimas linhas do backend =="
docker logs --tail=80 tio-carona-backend || true
