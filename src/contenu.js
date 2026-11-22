/* =========================================================
   Lecture des contenus (dossier /data)
   Pour modifier le site : éditer les fichiers JSON de /data.
   Les fichiers sont relus automatiquement quand ils changent.
   ========================================================= */
const fs = require("fs");
const path = require("path");

const DOSSIER = path.join(__dirname, "..", "data");
const cache = new Map();

function lire(nom) {
  const fichier = path.join(DOSSIER, nom + ".json");
  const { mtimeMs } = fs.statSync(fichier);
  const enCache = cache.get(nom);
  if (enCache && enCache.mtimeMs === mtimeMs) return enCache.donnees;
  const donnees = JSON.parse(fs.readFileSync(fichier, "utf8"));
  cache.set(nom, { mtimeMs, donnees });
  return donnees;
}

const parDateDesc = (a, b) => String(b.date).localeCompare(String(a.date));

module.exports = {
  site: () => lire("site"),
  programmes: () => lire("programmes"),
  aLaUne: () => lire("a-la-une"),
  clips: () => lire("clips"),
  actualites: () => lire("actualites").slice().sort(parDateDesc),
  artistes: () => lire("artistes"),
  evenements: () => lire("evenements").slice().sort((a, b) => String(a.date).localeCompare(String(b.date))),

  actualite: (slug) => lire("actualites").find((a) => a.slug === slug),
  artiste: (slug) => lire("artistes").find((a) => a.slug === slug),
};
