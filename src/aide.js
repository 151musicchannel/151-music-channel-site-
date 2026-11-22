/* =========================================================
   Petites fonctions utilisées dans les gabarits (views)
   ========================================================= */
const contenu = require("./contenu");

/* Image ou visuel de remplacement aux couleurs de 151 */
function image(src, type) {
  return src || `/images/placeholders/${type}.svg`;
}

/* Identifiant YouTube à partir d'un lien (youtu.be, watch?v=, shorts, embed) */
function idYoutube(lien) {
  const m = String(lien || "").match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/* Miniature d'un clip : celle fournie, sinon celle de YouTube, sinon visuel 151 */
function miniatureClip(clip) {
  if (clip.miniature) return clip.miniature;
  const id = idYoutube(clip.lien);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : image("", "clip");
}

/* Nom de la plateforme du lien (pour le bouton) */
function plateforme(lien) {
  if (!lien) return null;
  if (/youtu/.test(lien)) return "YouTube";
  if (/dailymotion/.test(lien)) return "Dailymotion";
  if (/vimeo/.test(lien)) return "Vimeo";
  if (/tiktok/.test(lien)) return "TikTok";
  if (/facebook|fb\.watch/.test(lien)) return "Facebook";
  return "la plateforme";
}

function nomArtiste(slug) {
  const a = contenu.artiste(slug);
  return a ? a.nom : slug || "";
}

const fmtDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
function date(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  return isNaN(d) ? iso : fmtDate.format(d);
}

const fmtJour = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "UTC" });
const fmtMois = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
function dateBloc(iso) {
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d)) return { jour: "", mois: "" };
  return { jour: fmtJour.format(d), mois: fmtMois.format(d).replace(".", "") };
}

const JOURS_COURTS = ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
function horaires(programme) {
  return (programme.diffusions || []).map((d) => {
    const j = d.jours || [];
    let jours;
    if (j.length === 7) jours = "Tous les jours";
    else if (j.join() === "1,2,3,4,5") jours = "Du lundi au vendredi";
    else jours = j.map((x) => JOURS_COURTS[x]).join(", ");
    return `${jours} · ${String(d.heure).replace(":", "h")}`;
  });
}

module.exports = { image, miniatureClip, plateforme, nomArtiste, date, dateBloc, horaires, idYoutube };
