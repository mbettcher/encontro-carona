#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root ou com sudo: sudo $0"
  exit 1
fi

apt update
apt install -y snapd
snap install core
snap refresh core

if command -v certbot >/dev/null 2>&1; then
  echo "Certbot já encontrado em: $(command -v certbot)"
else
  snap install --classic certbot
  ln -sf /snap/bin/certbot /usr/bin/certbot
fi

certbot --version
