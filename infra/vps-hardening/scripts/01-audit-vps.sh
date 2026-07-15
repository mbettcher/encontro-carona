#!/usr/bin/env bash
set -euo pipefail

echo "=== Sistema ==="
lsb_release -a 2>/dev/null || cat /etc/os-release
uname -a

echo
 echo "=== Usuário atual ==="
id
whoami

echo
 echo "=== Uptime / carga ==="
uptime

echo
 echo "=== Memória ==="
free -h

echo
 echo "=== Disco ==="
df -h /

echo
 echo "=== Portas escutando ==="
ss -tulpn || true

echo
 echo "=== UFW ==="
sudo ufw status verbose || true

echo
 echo "=== Docker ==="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' || true

echo
 echo "=== Diretórios sensíveis ==="
ls -ld /opt/apps /opt/apps/tio-carona /opt/apps/proxy /opt/backups/tio-carona 2>/dev/null || true
ls -la /opt/apps/tio-carona/.env 2>/dev/null || true

echo
 echo "=== Certificados Certbot ==="
sudo certbot certificates 2>/dev/null || true
