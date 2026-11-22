# Mise à jour automatique du site avec GitHub

Une fois installé : vous modifiez le site sur le PC, vous l'envoyez sur GitHub,
et **https://151musicchannel.tv est mis à jour tout seul en 1 minute environ**.

```
PC (modification + test)  →  git push  →  GitHub  →  serveur OVH mis à jour
```

Remplacez `VOTRE-COMPTE` par votre nom d'utilisateur GitHub.

---

## Partie 1 — Créer le dépôt sur GitHub (une seule fois)

1. Créez un compte sur **github.com** (gratuit).
2. En haut à droite : **+** → **New repository**.
3. Remplissez :
   - **Repository name** : `151-music-channel`
   - **Private** ✅ (très important : le code ne doit pas être public)
   - **Ne cochez rien** d'autre (pas de README, pas de .gitignore, pas de licence)
4. **Create repository**.

---

## Partie 2 — Envoyer le site du PC vers GitHub (une seule fois)

💻 PC (PowerShell) :
```
cd "C:\Users\X421\Downloads\club-des-Grizzly-2.3-main\club-des-Grizzly-2.3-main\151-music-channel"
git remote add origin https://github.com/VOTRE-COMPTE/151-music-channel.git
git push -u origin main
```
La première fois, une fenêtre s'ouvre pour **se connecter à GitHub** dans le navigateur : acceptez.
Sur la page du dépôt GitHub, les fichiers du site apparaissent.

---

## Partie 3 — Autoriser le serveur à lire le dépôt (une seule fois)

🖥️ Serveur — créer une clé réservée à GitHub :
```
ssh-keygen -t ed25519 -f ~/.ssh/github_151 -N "" -C "serveur-151"
cat ~/.ssh/github_151.pub
```
Copiez la ligne affichée (elle commence par `ssh-ed25519`).

Sur GitHub : dépôt **151-music-channel** → **Settings** → **Deploy keys** → **Add deploy key**
- **Title** : `Serveur OVH`
- **Key** : collez la ligne
- **Allow write access** : ❌ laisser **décoché** (le serveur lit seulement)
- **Add key**

🖥️ Serveur — dire à SSH d'utiliser cette clé pour GitHub :
```
printf 'Host github.com\n  IdentityFile ~/.ssh/github_151\n  IdentitiesOnly yes\n' >> ~/.ssh/config
chmod 600 ~/.ssh/config
ssh -T git@github.com
```
Répondez `yes`. Message attendu : *« Hi VOTRE-COMPTE/151-music-channel! You've successfully authenticated »*.

---

## Partie 4 — Relier le dossier du site au dépôt (une seule fois)

🖥️ Serveur :
```
cd /var/www/151-music-channel
git init -b main
git remote add origin git@github.com:VOTRE-COMPTE/151-music-channel.git
git fetch origin
git reset --hard origin/main
pm2 reload 151-site
```
Le `.env`, le dossier `storage/` et `node_modules/` ne sont pas sur GitHub : ils restent intacts sur le serveur.

---

## Partie 5 — Autoriser GitHub à mettre à jour le serveur (une seule fois)

🖥️ Serveur — créer la clé que GitHub utilisera pour se connecter :
```
ssh-keygen -t ed25519 -f ~/.ssh/actions_151 -N "" -C "github-actions-151"
cat ~/.ssh/actions_151.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/actions_151
```
La dernière commande affiche la **clé privée** : tout le bloc de
`-----BEGIN OPENSSH PRIVATE KEY-----` à `-----END OPENSSH PRIVATE KEY-----` (inclus). Copiez-le.

Sur GitHub : dépôt → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Créez ces 3 secrets :

| Name | Secret |
|---|---|
| `SERVEUR_HOTE` | `178.32.38.100` |
| `SERVEUR_USER` | `ubuntu` |
| `SERVEUR_CLE` | le bloc de la clé privée copié juste avant |

> ⚠️ Cette clé privée ne doit être collée **que** dans ce secret GitHub. Ne l'envoyez à personne, ni par message ni en capture.

---

## Partie 6 — Premier essai

1. Sur GitHub : dépôt → onglet **Actions** → **Mise en ligne** → **Run workflow** → **Run workflow**.
2. Après 20 à 60 secondes, une **coche verte** ✅ apparaît : la mise en ligne automatique fonctionne.
   - Croix rouge ❌ : cliquez dessus pour voir le message d'erreur (et envoyez-le au développeur).

---

## Au quotidien : modifier le site

1. 💻 Modifiez sur le PC (contenus dans `data/`, style, pages…).
2. 💻 Vérifiez en local : `npm start` puis http://localhost:8151.
3. 💻 Envoyez :
   ```
   cd "C:\Users\X421\Downloads\club-des-Grizzly-2.3-main\club-des-Grizzly-2.3-main\151-music-channel"
   git add -A
   git commit -m "Ajout des clips de la semaine"
   git push
   ```
   (Le message après `-m` décrit en quelques mots ce que vous avez changé.)
4. Environ 1 minute plus tard, c'est en ligne sur **https://151musicchannel.tv**.
   Suivi en direct : onglet **Actions** du dépôt GitHub.

### Ce qui se passe sur le serveur à chaque envoi
- Le code et les contenus sont remplacés par la nouvelle version.
- Si des modules ont changé, ils sont réinstallés.
- Le site redémarre **sans coupure visible**.
- Le **direct vMix n'est pas coupé**, sauf si le fichier du récepteur (`scripts/direct-local.js`) a été modifié.
- Le `.env` (clés, mots de passe) n'est **jamais** touché.

### Règles importantes
- **Les contenus se modifient sur le PC, puis `git push`.** Toute modification faite directement sur le serveur sera **écrasée** au prochain envoi.
- Ne mettez **jamais** le fichier `.env` sur GitHub (il est déjà exclu automatiquement).
- En cas d'erreur mise en ligne : revenir à la version précédente sur le PC avec
  ```
  git revert HEAD
  git push
  ```

### Relancer une mise à jour à la main (🖥️ Serveur)
```
bash /var/www/151-music-channel/deploiement/mettre-a-jour.sh
```
