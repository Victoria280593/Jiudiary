#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo bash $0 <your-public-ip>"
  exit 1
fi

CLIENT_IP="${1:-}"
if [[ -z "$CLIENT_IP" ]]; then
  echo "Usage: sudo bash $0 <your-public-ip>"
  echo "Port 1433 will be opened only for this IP."
  exit 1
fi

command -v ufw >/dev/null 2>&1 || apt-get install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

if ! iptables -nL DOCKER-USER >/dev/null 2>&1; then
  echo "Docker's DOCKER-USER chain was not found. Start Docker and run this script again."
  exit 1
fi

iptables -C DOCKER-USER -p tcp -s "$CLIENT_IP" --dport 1433 -j ACCEPT 2>/dev/null ||
  iptables -I DOCKER-USER 1 -p tcp -s "$CLIENT_IP" --dport 1433 -j ACCEPT
iptables -C DOCKER-USER -p tcp --dport 1433 -j DROP 2>/dev/null ||
  iptables -A DOCKER-USER -p tcp --dport 1433 -j DROP

ufw status numbered
iptables -nL DOCKER-USER --line-numbers

if command -v netfilter-persistent >/dev/null 2>&1; then
  netfilter-persistent save
else
  echo "Install iptables-persistent to retain the DOCKER-USER rules after a reboot."
fi
