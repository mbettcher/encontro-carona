#!/usr/bin/env bash
set -euo pipefail

SWAP_FILE="${SWAP_FILE:-/swapfile}"
SWAP_SIZE="${SWAP_SIZE:-2G}"

if swapon --show | grep -q "$SWAP_FILE"; then
  echo "Swap $SWAP_FILE já está ativo."
  swapon --show
  exit 0
fi

if [ -f "$SWAP_FILE" ]; then
  echo "Arquivo $SWAP_FILE já existe. Tentando ativar..."
else
  echo "Criando swap $SWAP_FILE com tamanho $SWAP_SIZE..."
  sudo fallocate -l "$SWAP_SIZE" "$SWAP_FILE"
fi

sudo chmod 600 "$SWAP_FILE"
sudo mkswap "$SWAP_FILE"
sudo swapon "$SWAP_FILE"

if ! grep -q "^$SWAP_FILE" /etc/fstab; then
  echo "$SWAP_FILE none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
fi

sudo sysctl vm.swappiness=10
if ! grep -q '^vm.swappiness=' /etc/sysctl.conf; then
  echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf >/dev/null
else
  sudo sed -i 's/^vm.swappiness=.*/vm.swappiness=10/' /etc/sysctl.conf
fi

free -h
swapon --show
