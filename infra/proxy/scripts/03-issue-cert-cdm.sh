#!/usr/bin/env bash
set -euo pipefail

DOMAIN="cdm.dev.br"
WEBROOT="/opt/apps/proxy/nginx/html"
EMAIL="${1:-}"

if [[ -z "${EMAIL}" ]]; then
  echo "Uso: sudo $0 seu-email@dominio.com"
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root ou com sudo: sudo $0 ${EMAIL}"
  exit 1
fi

certbot certonly \
  --webroot \
  --webroot-path "${WEBROOT}" \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email

certbot certificates
