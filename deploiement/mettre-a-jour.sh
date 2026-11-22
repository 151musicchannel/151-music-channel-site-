#!/usr/bin/env bash
# =========================================================
# 151 MUSIC CHANNEL — Mise à jour du site sur le serveur
# Lancé automatiquement par GitHub à chaque envoi (push) sur la branche main.
# Peut aussi être lancé à la main sur le serveur :
#   bash /var/www/151-music-channel/deploiement/mettre-a-jour.sh
# =========================================================
set -euo pipefail
cd /var/www/151-music-channel

AVANT=$(git rev-parse HEAD)
git fetch --quiet origin main
git reset --hard --quiet origin/main   # le .env et storage/ ne sont pas suivis par git : ils restent intacts
APRES=$(git rev-parse HEAD)

if [ "$AVANT" = "$APRES" ]; then
  echo "Déjà à jour ($APRES)."
  exit 0
fi

CHANGES=$(git diff --name-only "$AVANT" "$APRES")
echo "Mise à jour $AVANT → $APRES"
echo "$CHANGES" | sed 's/^/  · /'

# Nouveaux modules ? On les installe.
if echo "$CHANGES" | grep -qE '^package(-lock)?\.json$'; then
  echo "==> Installation des modules"
  npm ci --omit=dev
fi

# Le site redémarre sans coupure visible (quelques millisecondes)
echo "==> Redémarrage du site"
pm2 reload 151-site --update-env

# Le récepteur du direct ne redémarre QUE si son code a changé
# (sinon on couperait le direct de vMix pour rien)
if echo "$CHANGES" | grep -qE '^scripts/direct-local\.js$'; then
  echo "==> Le récepteur du direct a changé : redémarrage (le direct coupe quelques secondes)"
  pm2 restart 151-direct --update-env
fi

pm2 save --force > /dev/null
echo "Site à jour."
