#!/usr/bin/env bash
# =========================================================
# 151 MUSIC CHANNEL — Préparation d'un VPS OVHcloud (Ubuntu 24.04)
# À lancer UNE fois, connecté avec l'utilisateur ubuntu :
#   sudo bash installer-serveur.sh
# Installe : mises à jour, pare-feu, Node.js 22, ffmpeg, PM2, Caddy.
# =========================================================
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script avec sudo :  sudo bash installer-serveur.sh"; exit 1
fi
# Utilisateur qui fera tourner le site (ubuntu chez OVH)
UTILISATEUR="${SUDO_USER:-ubuntu}"

echo "==> Mises à jour du système (quelques minutes)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y && apt-get upgrade -y

echo "==> Outils de base + ffmpeg (réception du direct vMix)"
apt-get install -y curl ca-certificates gnupg ufw ffmpeg debian-keyring debian-archive-keyring apt-transport-https

echo "==> Pare-feu : SSH (22), web (80/443) et direct vMix (1935)"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 1935/tcp
ufw --force enable

echo "==> Node.js 22 (version LTS)"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "==> PM2 (garde le site et le direct allumés en permanence)"
npm install -g pm2

echo "==> Caddy (HTTPS automatique et gratuit)"
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update -y && apt-get install -y caddy
mkdir -p /var/log/caddy && chown caddy:caddy /var/log/caddy

echo "==> Dossier du site (appartient à $UTILISATEUR)"
mkdir -p /var/www/151-music-channel
chown -R "$UTILISATEUR:$UTILISATEUR" /var/www/151-music-channel
chmod 755 /var/www /var/www/151-music-channel

echo
echo "================ Serveur prêt ================"
echo "Node.js : $(node -v)   npm : $(npm -v)"
echo "ffmpeg  : $(ffmpeg -version | head -1 | cut -d' ' -f3)"
echo "Caddy   : $(caddy version | cut -d' ' -f1)"
ufw status | sed -n '1,12p'
echo "Étape suivante du guide : envoyer les fichiers du site."
