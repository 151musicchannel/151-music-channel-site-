# Mise en ligne de 151 Music Channel sur OVHcloud (VPS)

Guide complet, de la commande du serveur jusqu'au direct vMix sur le vrai site.
Comptez environ **1 h 30** la première fois (hors délai de livraison du VPS et de propagation du domaine).

Dans tout le guide, remplacez :
- `VOTRE-DOMAINE.com` par le vrai nom de domaine (ex. `151musicchannel.com`)
- `IP-DU-VPS` par l'adresse IPv4 du serveur (ex. `51.75.123.45`)

Les commandes marquées **💻 PC** se tapent dans **PowerShell** sur votre ordinateur Windows.
Les commandes marquées **🖥️ Serveur** se tapent dans la connexion SSH au VPS.

---

## Phase 1 — Commander chez OVHcloud

### 1.1 Créer le compte
Sur **ovhcloud.com** → **Mon compte** (en haut à droite) → **Créer un compte**.
Renseignez les vraies informations de la chaîne (elles servent aussi pour les mentions légales et la facturation).

### 1.2 Commander le VPS
**ovhcloud.com/fr/vps** → offre **VPS-2** → **Commander**.

| Écran de commande | Ce qu'il faut choisir |
|---|---|
| Modèle | **VPS-2** (4 vCores, 8 Go RAM, 75 Go NVMe, 1 Gb/s, trafic illimité) |
| Localisation | **Europe → France** (Gravelines, Roubaix ou Strasbourg) |
| Image | **Distribution seule → Ubuntu → 24.04** (pas d'application préinstallée, pas de panneau de contrôle) |
| Clé SSH | Laissez vide si vous ne savez pas : OVH enverra un mot de passe |
| Options | **Sauvegarde automatique** incluse : suffisante pour démarrer |
| Engagement | 12 mois ou plus = moins cher (vérifiez le prix au renouvellement) |

Payez. La livraison prend **de quelques minutes à quelques heures**.

### 1.3 Récupérer les accès
Vous recevez un **e-mail « Votre VPS est prêt »** avec :
- l'**adresse IPv4** du serveur → notez-la (`IP-DU-VPS`)
- l'**utilisateur** : **`ubuntu`** (et non `root`)
- le **mot de passe**, ou un lien pour le définir

On retrouve tout dans l'espace client : **ovh.com/manager → Bare Metal Cloud → Serveurs privés virtuels → votre VPS**.

### 1.4 Le nom de domaine
**ovhcloud.com → Noms de domaine** → recherchez le nom voulu → commandez-le.
(L'offre peut inclure une petite **adresse e-mail MX Plan** : on s'en sert à la phase 3.)

---

## Phase 2 — Faire pointer le domaine vers le VPS

Espace client → **Web Cloud → Noms de domaine → VOTRE-DOMAINE.com → onglet « Zone DNS »**.

1. Cherchez les lignes de type **A** et **AAAA** pour le domaine nu (vide) et pour `www`.
   OVH en crée parfois par défaut vers ses hébergements web : **modifiez-les** ou **supprimez-les**.
   ⚠️ Supprimez en particulier les **AAAA** (IPv6) qui ne pointent pas vers votre VPS, sinon le certificat HTTPS échouera.
2. Ajoutez (ou modifiez) avec **« Ajouter une entrée » → A** :

| Type | Sous-domaine | Cible | TTL |
|---|---|---|---|
| A | *(laisser vide)* | `IP-DU-VPS` | par défaut |
| A | `www` | `IP-DU-VPS` | par défaut |

La propagation prend de **quelques minutes à 24 h**. Pour vérifier (💻 PC) :
```
nslookup VOTRE-DOMAINE.com
```
→ doit afficher `IP-DU-VPS`.

---

## Phase 3 — L'adresse e-mail du formulaire de contact

Espace client → **Web Cloud → E-mails** (ou **Noms de domaine → VOTRE-DOMAINE.com → E-mails**).
1. Créez **`contact@VOTRE-DOMAINE.com`** et choisissez son mot de passe.
2. Notez ces réglages, ils iront dans le `.env` du serveur (phase 7) :

| Réglage | Valeur |
|---|---|
| Serveur d'envoi (SMTP) | `ssl0.ovh.net` |
| Port | `465` (SSL) |
| Identifiant | l'adresse complète `contact@VOTRE-DOMAINE.com` |
| Mot de passe | celui de la boîte mail |

> Les enregistrements MX de la zone DNS (phase 2) ne doivent **pas** être supprimés : ils servent aux e-mails.

---

## Phase 4 — Première connexion au serveur

💻 PC (PowerShell) :
```
ssh ubuntu@IP-DU-VPS
```
- Première fois : tapez `yes` pour accepter l'empreinte du serveur.
- Entrez le mot de passe (rien ne s'affiche pendant la saisie, c'est normal).
- Si OVH demande de **changer le mot de passe** : saisissez l'actuel, puis deux fois le nouveau, puis reconnectez-vous.

Vous êtes connecté quand l'invite ressemble à `ubuntu@vps-xxxx:~$`.
Pour quitter le serveur : `exit`.

> En cas de blocage : espace client → votre VPS → **KVM** ouvre une console directement dans le navigateur.

---

## Phase 5 — Installer les logiciels sur le serveur (une seule fois)

💻 PC — envoyer le script d'installation :
```
scp "C:\Users\X421\Downloads\club-des-Grizzly-2.3-main\club-des-Grizzly-2.3-main\151-music-channel\deploiement\installer-serveur.sh" ubuntu@IP-DU-VPS:~/
```

🖥️ Serveur — le lancer :
```
sudo bash ~/installer-serveur.sh
```

Le script installe, en 5 à 10 minutes :
- les mises à jour d'Ubuntu ;
- le **pare-feu** avec les ports **22** (SSH), **80/443** (site) et **1935** (direct vMix) ouverts ;
- **Node.js 22**, **ffmpeg**, **PM2** et **Caddy** (HTTPS) ;
- le dossier du site `/var/www/151-music-channel`.

À la fin il affiche « Serveur prêt » et les versions installées.

> **Firewall Network OVH** (espace client → IP → Firewall) : désactivé par défaut, rien à faire.
> Si vous l'activez un jour, autorisez les ports TCP **22, 80, 443 et 1935**.

---

## Phase 6 — Envoyer le site sur le serveur

💻 PC — créer l'archive du site (sans les fichiers locaux) et l'envoyer :
```
cd "C:\Users\X421\Downloads\club-des-Grizzly-2.3-main\club-des-Grizzly-2.3-main\151-music-channel"
tar -czf ..\151-site.tar.gz --exclude=node_modules --exclude=storage/direct --exclude=storage/messages.jsonl --exclude=.env .
scp ..\151-site.tar.gz ubuntu@IP-DU-VPS:~/
```

🖥️ Serveur — décompresser et installer :
```
cd /var/www/151-music-channel
tar -xzf ~/151-site.tar.gz
npm ci --omit=dev
mkdir -p storage/direct
ls
```
→ vous devez voir `server.js`, `data`, `public`, `views`, `scripts`…

---

## Phase 7 — Les réglages de production (fichier .env)

🖥️ Serveur — générer deux secrets :
```
cd /var/www/151-music-channel
cp deploiement/env.production.exemple .env
openssl rand -hex 32
echo "151-$(openssl rand -hex 8)"
```
Gardez les deux résultats affichés, puis ouvrez le fichier :
```
nano .env
```
Remplissez :

| Ligne | Valeur |
|---|---|
| `SITE_URL=` | `https://VOTRE-DOMAINE.com` |
| `FORM_SECRET=` | le 1er résultat (64 caractères) |
| `DIRECT_CLE=` | le 2e résultat (`151-…`) : **la clé de stream vMix du vrai site** |
| `SMTP_USER=` / `SMTP_FROM=` / `CONTACT_TO=` | `contact@VOTRE-DOMAINE.com` |
| `SMTP_PASS=` | le mot de passe de la boîte mail (phase 3) |

Enregistrer : **Ctrl + O** puis **Entrée**. Quitter : **Ctrl + X**.
Protéger le fichier :
```
chmod 600 .env
```

---

## Phase 8 — Les contenus officiels

🖥️ Serveur :
```
nano data/site.json
```
- `"direct"` → `"url": "/direct/index.m3u8"` : **à laisser tel quel** (le lecteur lit le direct reçu de vMix).
- `"contact"` → e-mail, téléphone, adresse officiels de la chaîne.
- `"mentionsLegales"` → éditeur (la société), directeur de la publication, et l'hébergeur :
  **OVH SAS**, avec l'adresse et le téléphone indiqués dans les mentions légales du site ovhcloud.com.

Les émissions, clips, artistes, actualités et événements sont dans les autres fichiers de `data/` (voir `README.md`).

---

## Phase 9 — Démarrer le site et le récepteur du direct

🖥️ Serveur :
```
cd /var/www/151-music-channel
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
`pm2 startup` affiche une ligne qui commence par `sudo env PATH=...` : **copiez-la et exécutez-la**.
Elle relance automatiquement le site et le direct si le serveur redémarre.

Vérifier :
```
pm2 status
```
→ `151-site` et `151-direct` doivent être **online**.
```
pm2 logs 151-direct --lines 20
```
→ affiche l'URL et la clé à mettre dans vMix. (Sortir des journaux : **Ctrl + C**.)

---

## Phase 10 — Le HTTPS (cadenas) avec Caddy

💻 PC — envoyer la configuration :
```
scp "C:\Users\X421\Downloads\club-des-Grizzly-2.3-main\club-des-Grizzly-2.3-main\151-music-channel\deploiement\Caddyfile" ubuntu@IP-DU-VPS:~/
```

🖥️ Serveur — l'installer avec votre domaine (remplacez `151musicchannel.com` par le vôtre) :
```
sed -i 's/VOTRE-DOMAINE.com/151musicchannel.com/g' ~/Caddyfile
sudo mv ~/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager
```
→ « active (running) ».

Ouvrez **https://VOTRE-DOMAINE.com** : le site s'affiche avec le **cadenas**.
Caddy obtient le certificat tout seul, **à condition que la phase 2 soit propagée**. Si ce n'est pas encore le cas, attendez puis :
```
sudo systemctl reload caddy
```

---

## Phase 11 — Brancher vMix sur le vrai site

Dans vMix : **Stream → ⚙ → Destination : Custom RTMP Server**

| Champ | Valeur |
|---|---|
| URL | `rtmp://IP-DU-VPS:1935/live` *(ou `rtmp://VOTRE-DOMAINE.com:1935/live`)* |
| Stream Name or Key | la valeur `DIRECT_CLE` du serveur *(commande : `grep DIRECT_CLE /var/www/151-music-channel/.env`)* |
| Quality | **H264 720p 2,5 Mbps AAC 128 kbps** |

**Save and Close**, puis **Stream**.
5 à 10 secondes plus tard, le direct apparaît sur https://VOTRE-DOMAINE.com.

- Plus besoin d'adresse `192.168.…` ni de pare-feu Windows : vMix envoie vers le serveur **par Internet**.
- La connexion de la régie doit offrir au moins **5 Mb/s en envoi (upload)**.
- Pour voir que vMix est bien reçu (🖥️ Serveur) : `pm2 logs 151-direct`.

---

## Phase 12 — Vérifications finales

- [ ] https://VOTRE-DOMAINE.com s'ouvre avec le cadenas ; `http://` redirige vers `https://`
- [ ] `www.VOTRE-DOMAINE.com` redirige vers `VOTRE-DOMAINE.com`
- [ ] Toutes les pages du menu s'ouvrent, sur ordinateur et téléphone
- [ ] Le direct s'affiche ; le son, **Agrandir** et le plein écran fonctionnent
- [ ] Le formulaire de contact envoie un e-mail à `contact@VOTRE-DOMAINE.com`
- [ ] https://VOTRE-DOMAINE.com/sitemap.xml affiche bien le domaine
- [ ] **Google Search Console** : ajouter le site et envoyer le sitemap
- [ ] Espace client OVH → VPS → **Sauvegardes** : vérifier qu'une sauvegarde existe

---

## Au quotidien

### Modifier un contenu (émission, clip, artiste, actualité…)
Avec **WinSCP** ou **FileZilla** (protocole **SFTP**, hôte `IP-DU-VPS`, utilisateur `ubuntu`, son mot de passe) :
ouvrez `/var/www/151-music-channel/data/`, modifiez le fichier JSON, enregistrez.
**Pas besoin de redémarrer** : le site relit les fichiers tout seul.
Les images vont dans `/var/www/151-music-channel/public/images/`.

### Mettre à jour le site (nouvelle version préparée en local)
Refaire la phase 6 (archive + envoi + `tar -xzf`), puis 🖥️ Serveur :
```
cd /var/www/151-music-channel && npm ci --omit=dev && pm2 restart all
```
L'archive ne contient pas le `.env` : les réglages du serveur ne sont pas écrasés.
⚠️ Elle contient le dossier `data/` local : si des contenus ont été modifiés directement sur le serveur, récupérez-les d'abord (WinSCP) pour ne pas les perdre.

### Commandes utiles (🖥️ Serveur)

| Besoin | Commande |
|---|---|
| État du site et du direct | `pm2 status` |
| Voir les journaux / erreurs | `pm2 logs` |
| Redémarrer tout | `pm2 restart all` |
| Voir la clé vMix | `grep DIRECT_CLE /var/www/151-music-channel/.env` |
| Espace disque | `df -h` |
| Mises à jour de sécurité | `sudo apt update && sudo apt upgrade -y` (une fois par mois) |

### Si l'audience grandit
- Espace client → VPS → **Modifier l'offre** → **VPS-3** (2 Gb/s) : en un clic, sans réinstaller.
- Au-delà de quelques centaines de spectateurs simultanés : ajouter un **CDN** devant `/direct/` (on le fera ensemble).

### Sécurité
- Ne partagez jamais `DIRECT_CLE` : avec elle, n'importe qui pourrait diffuser sur votre site.
  Si elle fuit : changez-la dans `.env`, `pm2 restart 151-direct`, puis mettez la nouvelle dans vMix.
- Conseillé : se connecter avec une **clé SSH** plutôt qu'un mot de passe.

---

## En cas de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| `ssh` : « Connection timed out » | Mauvaise IP, VPS pas encore livré | Vérifier l'IP dans l'espace client ; essayer la console **KVM** |
| Le site ne s'ouvre pas en `https` | Domaine pas encore propagé, ou ancien enregistrement AAAA | `nslookup VOTRE-DOMAINE.com`, nettoyer la zone DNS (phase 2), puis `sudo systemctl reload caddy` |
| Page « 502 Bad Gateway » | Le site Node est arrêté | `pm2 status`, `pm2 logs 151-site`, `pm2 restart 151-site` |
| vMix : « Cannot open connection » | Port 1935 fermé, mauvaise IP | `sudo ufw status` (1935 doit être ALLOW), vérifier l'URL dans vMix |
| Le direct ne s'affiche pas mais vMix streame | Mauvaise clé | Comparer la clé vMix avec `grep DIRECT_CLE .env`, puis `pm2 logs 151-direct` |
| Le formulaire n'envoie pas d'e-mail | Mauvais réglages SMTP | Vérifier `SMTP_*` dans `.env`, `pm2 restart 151-site`, `pm2 logs 151-site` |
| Tout le site affiche « Une erreur est survenue » | Un fichier de `data/` contient une erreur de syntaxe JSON | Voir la contrainte n°13 ci-dessous |

---

## Contraintes à connaître et leurs solutions

Ces points ne sont pas des pannes, mais des limites ou des risques à anticiper. Pour chacun : ce qui peut arriver, et quoi faire.

### A. Le direct

**1. La connexion Internet de la régie**
- *Contrainte :* vMix doit envoyer le direct au serveur en continu. Avec une connexion faible ou instable (partage de connexion de téléphone, Wi-Fi saturé), l'image saccade, se fige ou se coupe pour **tous** les spectateurs.
- *Solution :*
  - Prévoir au moins **5 Mb/s en envoi (upload)** stables pour du 720p ; tester sur speedtest.net depuis le PC de la régie.
  - Brancher le PC vMix **en câble Ethernet**, pas en Wi-Fi.
  - Si la connexion est juste, baisser la qualité dans vMix (par ex. 720p à 1,5 Mbps) : mieux vaut une image un peu moins nette qu'un direct qui coupe.
  - Idéalement, une **connexion de secours** (2e box ou 4G/5G) pour la régie.

**2. Le décalage avec la télévision**
- *Contrainte :* le direct sur le site arrive avec **10 à 20 secondes de retard** par rapport à l'antenne. C'est normal avec la technologie utilisée (HLS) pour être compatible avec tous les navigateurs.
- *Solution :* rien à corriger. Le réduire à 2-5 secondes demanderait une autre technologie (WebRTC, ou un service spécialisé « faible latence »), plus coûteuse. Ne pas annoncer un direct « à la seconde près ».

**3. Les réglages de vMix**
- *Contrainte :* le récepteur recopie la vidéo sans la réencoder (pour économiser le serveur). Il faut donc que vMix envoie un format lisible par les navigateurs, sinon l'image ne s'affiche pas ou le son manque.
- *Solution :* dans vMix, garder une qualité **H264 + AAC** (ex. « H264 720p 2,5 Mbps AAC 128 kbps »). Dans les réglages avancés (⚙ à côté de Quality), mettre l'**intervalle d'images clés (Keyframe) à 2 secondes** : le direct démarre plus vite et coupe moins.

**4. Une seule qualité pour tout le monde**
- *Contrainte :* tous les spectateurs reçoivent la même qualité (celle envoyée par vMix). Un spectateur avec une connexion faible (mobile en 3G, zones rurales) peut voir le direct se mettre en pause pour charger.
- *Solution :*
  - À court terme : envoyer depuis vMix une qualité raisonnable (720p, 2 à 2,5 Mbps).
  - Plus tard : proposer **plusieurs qualités automatiques** (1080p / 720p / 480p) comme YouTube. Cela demande de réencoder sur le serveur (passer en **VPS-3** ou plus) ou d'utiliser un service de streaming. Le lecteur du site sait déjà changer de qualité tout seul.

**5. Le nombre de spectateurs en même temps**
- *Contrainte :* avec le **VPS-2 (1 Gb/s)**, le serveur peut diffuser le direct à environ **300 spectateurs simultanés** en 720p. Au-delà, le direct ralentit pour tout le monde.
- *Solution :* surveiller l'audience lors des grands événements. Passer en **VPS-3** (2 Gb/s, environ 600 spectateurs) en un clic, ou ajouter un **CDN** (Bunny.net, Cloudflare) devant le direct pour des milliers de spectateurs.

**6. La coupure du direct**
- *Contrainte :* si vMix s'arrête ou que la connexion de la régie tombe, le direct disparaît du site.
- *Solution :* déjà prévu : le lecteur affiche « Le direct est momentanément indisponible » et **réessaie tout seul toutes les 10 secondes**. Il suffit de relancer **Stream** dans vMix, les spectateurs retrouvent l'image sans recharger la page.

**7. La sécurité de la clé de stream**
- *Contrainte :* le direct part de vMix vers le serveur en RTMP, qui n'est **pas chiffré**. Toute personne qui connaît la clé `DIRECT_CLE` peut diffuser **n'importe quelle image** sur votre site.
- *Solution :* ne jamais partager la clé (ni par message, ni en capture d'écran). La changer si un doute existe (`.env`, puis `pm2 restart 151-direct`, puis mise à jour dans vMix). Pour plus tard : passer en **RTMPS** (chiffré) via un service de streaming.

**8. Les droits musicaux**
- *Contrainte :* diffuser des clips et de la musique sur Internet est soumis aux **droits d'auteur**. L'autorisation de diffuser à la télévision ne couvre pas toujours la diffusion en ligne.
- *Solution :* vérifier avec les **sociétés de gestion des droits** (par ex. le BUBEDRA au Bénin, la SACEM en France) et avec les labels que la diffusion **en ligne** est incluse dans les accords de la chaîne. C'est aussi pour cela qu'on a évité YouTube Live, qui coupe les directs en cas de musique protégée.

### B. Le serveur et le trafic

**9. Le coût réel**
- *Contrainte :* le prix affiché par OVH est souvent un prix de **première période** ; le **renouvellement** peut être plus cher. Le domaine et la boîte mail se renouvellent aussi chaque année.
- *Solution :* noter les dates de renouvellement, activer le **renouvellement automatique** dans l'espace client OVH (pour ne jamais perdre le domaine), et prévoir le budget annuel complet.

**10. Le disque qui se remplit**
- *Contrainte :* les journaux (logs) du site et du direct grossissent avec le temps.
- *Solution :* le direct efface déjà ses vieux morceaux de vidéo automatiquement. Pour les journaux, installer une fois la rotation automatique (🖥️ Serveur) :
  ```
  pm2 install pm2-logrotate
  ```
  Et vérifier de temps en temps l'espace : `df -h`.

**11. Les mises à jour de sécurité du serveur**
- *Contrainte :* un serveur jamais mis à jour devient vulnérable avec le temps.
- *Solution :* une fois par mois : `sudo apt update && sudo apt upgrade -y`, puis `sudo reboot` si demandé (le site et le direct redémarrent seuls grâce à PM2). Ou activer les mises à jour automatiques : `sudo apt install -y unattended-upgrades`.

**12. Les attaques**
- *Contrainte :* tout site public reçoit des tentatives d'intrusion (robots qui testent des mots de passe SSH, spam sur le formulaire).
- *Solution :* déjà en place : pare-feu (seuls les ports utiles sont ouverts), anti-DDoS inclus chez OVH, formulaire protégé contre les robots (champ piège, délai, 5 messages max par 15 min). À ajouter : connexion SSH par **clé** plutôt que mot de passe, et `sudo apt install -y fail2ban` (bloque les IP qui insistent).

### C. Les contenus

**13. Une erreur dans un fichier de contenu**
- *Contrainte :* les contenus sont des fichiers **JSON**. Une seule virgule oubliée, un guillemet manquant ou une virgule en trop après le dernier élément suffit à faire afficher « Une erreur est survenue » sur le site.
- *Solution :*
  - Toujours garder une **copie** du fichier avant de le modifier.
  - Vérifier le fichier avant de l'envoyer : copier son contenu sur **jsonlint.com** → « Validate JSON ».
  - En cas d'erreur sur le site : `pm2 logs 151-site` indique le fichier et la ligne en cause ; corriger, et le site repart tout seul.
  - Pour une gestion sans risque par une personne non technique : prévoir l'**espace d'administration** (phase 2 du cahier des charges).

**14. Écraser les contenus en mettant à jour**
- *Contrainte :* l'archive de mise à jour (phase 6) contient le dossier `data/` de votre PC. Si quelqu'un a modifié des contenus **directement sur le serveur**, ils seront remplacés par ceux du PC.
- *Solution :* choisir **un seul endroit** où l'on modifie les contenus (le serveur, ou le PC puis envoi). Avant chaque mise à jour, récupérer le dossier `data/` du serveur avec WinSCP.

**15. Les images trop lourdes**
- *Contrainte :* des photos prises au téléphone (5 à 10 Mo chacune) rendent les pages lentes, surtout sur mobile.
- *Solution :* avant de les mettre sur le site, les réduire à **1600 px de large maximum** et les compresser (par ex. avec **squoosh.app**, gratuit), idéalement en **WebP** ou JPEG de moins de **300 Ko**.

### D. Le domaine, l'e-mail et la visibilité

**16. Le délai de propagation du domaine**
- *Contrainte :* après avoir réglé la zone DNS, le domaine peut mettre **jusqu'à 24 h** à pointer vers le serveur, et le HTTPS ne peut pas s'activer avant.
- *Solution :* faire la phase 2 **dès l'achat du domaine**, et faire le reste pendant l'attente. Vérifier avec `nslookup VOTRE-DOMAINE.com`.

**17. Les e-mails du formulaire classés en spam**
- *Contrainte :* les messages envoyés par le site peuvent arriver dans les indésirables.
- *Solution :* utiliser l'adresse OVH du même domaine (c'est prévu), et vérifier dans la zone DNS OVH que les enregistrements **SPF** (et **DKIM** si proposé dans Web Cloud → E-mails) sont actifs. Ajouter l'adresse du site aux contacts de la boîte qui reçoit.

**18. Le référencement Google prend du temps**
- *Contrainte :* un nouveau site n'apparaît pas tout de suite dans Google : comptez **quelques jours à quelques semaines**.
- *Solution :* déclarer le site et le sitemap dans **Google Search Console** (phase 12), publier régulièrement des actualités, et faire des liens vers le site depuis les réseaux et l'antenne (« retrouvez-nous sur… »).

### E. Côté visiteurs

**19. Le son coupé au démarrage**
- *Contrainte :* tous les navigateurs **interdisent** de lancer une vidéo avec le son tout seul. Le direct démarre donc en muet.
- *Solution :* déjà prévu : un bouton **« Activer le son »** bien visible. C'est le même fonctionnement que YouTube, Facebook ou Instagram.

**20. Les anciens appareils**
- *Contrainte :* sur de très vieux téléphones ou navigateurs, le direct ou certaines animations peuvent ne pas fonctionner.
- *Solution :* le site fonctionne sur tous les navigateurs récents (Chrome, Safari, Firefox, Edge, Samsung Internet), et les iPhone lisent le direct nativement. Si le direct ne peut pas être lu, un message s'affiche plutôt qu'un écran noir.

**21. La version mise en cache après une mise à jour**
- *Contrainte :* après une mise à jour du site, certains visiteurs peuvent encore voir l'ancien style pendant quelques heures (leur navigateur garde une copie).
- *Solution :* demander un rechargement forcé (**Ctrl + F5** sur ordinateur). Pour les mises à jour importantes, on peut ajouter un numéro de version aux fichiers de style pour forcer le rafraîchissement : à demander au développeur.

**22. Les données personnelles (formulaire de contact)**
- *Contrainte :* le formulaire collecte des noms et des e-mails : c'est encadré par la loi (RGPD en Europe, lois locales ailleurs, ex. l'APDP au Bénin).
- *Solution :* la page **Mentions légales et confidentialité** l'explique déjà. Ne conserver les messages que le temps nécessaire, ne pas les transmettre à des tiers, et répondre aux demandes de suppression.
