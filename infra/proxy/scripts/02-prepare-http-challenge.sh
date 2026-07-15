#!/usr/bin/env bash
set -euo pipefail

PROXY_DIR="/opt/apps/proxy"
CONF_DIR="${PROXY_DIR}/nginx/conf.d"
HTML_DIR="${PROXY_DIR}/nginx/html"

mkdir -p "${CONF_DIR}" "${HTML_DIR}" "${PROXY_DIR}/nginx/logs"

cp "${CONF_DIR}/cdm-http.conf" "${CONF_DIR}/default.conf"

cd "${PROXY_DIR}"
docker compose config >/dev/null
docker compose up -d

echo "ok-cdm" > "${HTML_DIR}/health-check-cdm.txt"

docker compose restart proxy-nginx

echo "Teste local: curl -i http://localhost/health-check-cdm.txt"
echo "Teste externo: http://cdm.dev.br/health-check-cdm.txt"
