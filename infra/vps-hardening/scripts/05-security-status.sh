#!/usr/bin/env bash
set -euo pipefail

echo "=== UFW ==="
sudo ufw status verbose || true

echo
 echo "=== Fail2ban ==="
sudo fail2ban-client status || true
sudo fail2ban-client status sshd || true

echo
 echo "=== SSH config efetiva ==="
sudo sshd -T | grep -E '^(port|permitrootlogin|passwordauthentication|pubkeyauthentication|maxauthtries|x11forwarding|clientaliveinterval|clientalivecountmax)' || true

echo
 echo "=== Portas públicas ==="
ss -tulpn | grep -E ':(22|80|443)\b' || true

echo
 echo "=== Permissões .env ==="
ls -la /opt/apps/tio-carona/.env 2>/dev/null || true

echo
 echo "=== Renovação certificados ==="
sudo systemctl list-timers | grep -i certbot || true
sudo certbot certificates 2>/dev/null || true
