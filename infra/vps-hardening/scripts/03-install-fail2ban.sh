#!/usr/bin/env bash
set -euo pipefail

sudo apt update
sudo apt install -y fail2ban

sudo mkdir -p /etc/fail2ban/jail.d
sudo cp /opt/apps/vps-hardening/fail2ban/sshd.local /etc/fail2ban/jail.d/sshd.local

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

sudo fail2ban-client status
sudo fail2ban-client status sshd || true
