#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

INSTALLER="$(mktemp)"
trap 'rm -f "$INSTALLER"' EXIT

curl --fail --show-error --silent --location https://dokploy.com/install.sh --output "$INSTALLER"
sh "$INSTALLER"

SERVER_IP="${1:-$(hostname -I | awk '{print $1}')}"
echo "Dokploy: http://${SERVER_IP}:3000"

