#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/apps/tio-carona}"
cd "$APP_DIR"

echo "Executando manutenção Docker segura."
echo "Esta rotina remove imagens/cache não usados, sem remover volumes."

docker image prune -f
docker builder prune -f --filter "until=168h"

echo
echo "Uso atual do Docker:"
docker system df
