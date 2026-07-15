#!/usr/bin/env bash
set -euo pipefail

PROXY_DIR="/opt/apps/proxy"
CONF_DIR="${PROXY_DIR}/nginx/conf.d"
CERT_FILE="/etc/letsencrypt/live/cdm.dev.br/fullchain.pem"
KEY_FILE="/etc/letsencrypt/live/cdm.dev.br/privkey.pem"

if [[ ! -f "${CERT_FILE}" || ! -f "${KEY_FILE}" ]]; then
  echo "Certificado não encontrado em /etc/letsencrypt/live/cdm.dev.br. Emita primeiro com 03-issue-cert-cdm.sh"
  exit 1
fi

cp "${CONF_DIR}/cdm-ssl.conf" "${CONF_DIR}/default.conf"

cd "${PROXY_DIR}"
docker compose config >/dev/null
docker compose restart proxy-nginx

echo "SSL habilitado para https://cdm.dev.br"
