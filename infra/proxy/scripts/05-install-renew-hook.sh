#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root ou com sudo: sudo $0"
  exit 1
fi

HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
HOOK_FILE="${HOOK_DIR}/restart-proxy-nginx.sh"

mkdir -p "${HOOK_DIR}"

cat > "${HOOK_FILE}" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
cd /opt/apps/proxy
docker compose restart proxy-nginx
HOOK

chmod +x "${HOOK_FILE}"

echo "Hook de renovação instalado em ${HOOK_FILE}"
echo "Teste com: sudo certbot renew --dry-run"
