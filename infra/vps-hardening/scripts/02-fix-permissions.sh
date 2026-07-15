#!/usr/bin/env bash
set -euo pipefail

APP_USER="${APP_USER:-deploy}"
APP_GROUP="${APP_GROUP:-deploy}"

if ! id "$APP_USER" >/dev/null 2>&1; then
  echo "Usuário '$APP_USER' não existe. Ajuste APP_USER ou crie o usuário antes."
  exit 1
fi

echo "Ajustando donos básicos para $APP_USER:$APP_GROUP..."
sudo chown -R "$APP_USER:$APP_GROUP" /opt/apps/tio-carona /opt/apps/proxy /opt/backups/tio-carona

echo "Protegendo arquivos .env..."
if [ -f /opt/apps/tio-carona/.env ]; then
  sudo chown "$APP_USER:$APP_GROUP" /opt/apps/tio-carona/.env
  sudo chmod 600 /opt/apps/tio-carona/.env
fi

echo "Protegendo backups..."
sudo chmod -R go-rwx /opt/backups/tio-carona || true

echo "Garantindo execução dos scripts..."
sudo chmod +x /opt/apps/tio-carona/scripts/*.sh 2>/dev/null || true
sudo chmod +x /opt/apps/proxy/scripts/*.sh 2>/dev/null || true

echo "Permissões ajustadas."
