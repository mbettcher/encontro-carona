#!/usr/bin/env bash
set -euo pipefail

SERVICE="${1:-backend}"

case "$SERVICE" in
  backend)
    docker logs -f --tail=200 tio-carona-backend
    ;;
  frontend)
    docker logs -f --tail=200 tio-carona-frontend
    ;;
  postgres|db)
    docker logs -f --tail=200 tio-carona-postgres
    ;;
  *)
    echo "Uso: $0 [backend|frontend|postgres]" >&2
    exit 1
    ;;
esac
