# 151 Music Channel — Site officiel

Site de la chaîne de télévision musicale 151 Music Channel.
Node.js + Express, pages rendues côté serveur (EJS), contenus dans des fichiers JSON.

## Lancer le site

```bash
npm install
npm start
```

Le site est alors sur http://localhost:8151. Pendant le développement, `npm run dev` recharge le serveur à chaque modification.

Avant la mise en ligne, copiez `.env.example` en `.env` et remplissez-le (adresse du site, clé secrète, e-mail).

## Modifier les contenus

Tous les contenus sont dans le dossier `data/`. Il suffit de modifier le fichier, sans redémarrer le serveur.

| Fichier | Contenu |
|---|---|
| `data/site.json` | Lien du direct, coordonnées, textes « À propos », mentions légales, fuseau horaire |
| `data/programmes.json` | Émissions et horaires (jours : 1 = lundi … 7 = dimanche) |
| `data/clips.json` | Clips et leur lien externe (YouTube, etc.) |
| `data/actualites.json` | Articles (le `slug` donne l'adresse : `/actualites/mon-article`) |
| `data/artistes.json` | Fiches artistes |
| `data/evenements.json` | Événements (dates au format `AAAA-MM-JJ`) |

- **Images** : déposez-les dans `public/images/` et indiquez le chemin, par exemple `"/images/artistes/nom.jpg"`. Sans image, un visuel aux couleurs de la chaîne s'affiche.
- **Clips YouTube** : si `miniature` est vide, la miniature YouTube est récupérée automatiquement à partir du lien.
- **Liens entre contenus** : le champ `artiste` d'un clip ou d'un article contient le `slug` de l'artiste.

## Brancher le direct

Dans `data/site.json`, partie `direct` :

- `"type": "hls"` avec `"url"` qui pointe vers le flux `.m3u8`. C'est le format recommandé, lu par le lecteur 151.
- `"type": "youtube"` avec `"url"` contenant l'identifiant de la vidéo YouTube Live.
- `"type": "iframe"` avec `"url"` contenant un lien d'intégration (Dailymotion, Vimeo…).

Tant que `url` est vide, le lecteur affiche « Le direct arrive bientôt ». Aucun faux direct n'est diffusé.
Si le flux coupe, le lecteur affiche un message avec un bouton « Réessayer ».

## Formulaire de contact

- Les champs sont validés dans le navigateur, puis de nouveau sur le serveur.
- Plusieurs protections bloquent les robots : un champ piège invisible, un délai minimum signé, et une limite de 5 messages par 15 minutes pour chaque adresse IP.
- Si SMTP est configuré dans `.env`, les messages partent par e-mail. Sinon, ils sont enregistrés dans `storage/messages.jsonl`, un dossier qui n'est pas accessible depuis le web.

## Mise en ligne

- Le site a besoin d'un hébergement Node.js 18 ou plus récent : VPS, Render, Railway, o2switch avec Node, etc.
- Mettez `NODE_ENV=production` et `SITE_URL=https://votre-domaine` dans le `.env`.
- Le HTTPS est assuré par l'hébergeur. Le site redirige automatiquement vers HTTPS en production.
- Le plan du site est généré à l'adresse `/sitemap.xml`, et `/robots.txt` est fourni.
