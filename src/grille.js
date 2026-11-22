/* =========================================================
   Calcul du programme en cours et du suivant
   à partir des horaires de /data/programmes.json
   (heures exprimées dans le fuseau horaire de la chaîne)
   ========================================================= */

const JOURS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const MINUTES_SEMAINE = 7 * 24 * 60;

/* Jour (1 = lundi … 7 = dimanche) et minute du jour dans le fuseau donné */
function maintenantDans(fuseau, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: fuseau, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  const jour = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday")) + 1;
  return { jour, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function enMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
}

/* Toutes les diffusions de la semaine, à plat, en minutes depuis lundi 00:00 */
function creneaux(programmes) {
  const liste = [];
  programmes.forEach((p) => {
    (p.diffusions || []).forEach((d) => {
      (d.jours || []).forEach((j) => {
        const debut = (j - 1) * 1440 + enMinutes(d.heure);
        liste.push({ programme: p, jour: j, heure: d.heure, debut, fin: debut + (Number(d.duree) || 60) });
      });
    });
  });
  return liste.sort((a, b) => a.debut - b.debut);
}

function enCoursEtSuivant(programmes, fuseau) {
  const tous = creneaux(programmes);
  if (!tous.length) return { enCours: null, suivant: null };

  const { jour, minutes } = maintenantDans(fuseau);
  const t = (jour - 1) * 1440 + minutes;

  const enCours = tous.find((c) => c.debut <= t && t < c.fin) || null;
  const suivant =
    tous.find((c) => c.debut > t && c !== enCours) ||
    tous[0]; // la semaine recommence
  return { enCours, suivant: suivant ? Object.assign({ semaineSuivante: suivant.debut <= t }, suivant) : null };
}

function libelleCreneau(c, jourActuel) {
  if (!c) return "";
  const jour = c.jour === jourActuel ? "Aujourd'hui" : JOURS[c.jour].replace(/^./, (l) => l.toUpperCase());
  return `${jour} à ${c.heure.replace(":", "h")}`;
}

module.exports = { enCoursEtSuivant, maintenantDans, libelleCreneau, JOURS, MINUTES_SEMAINE };
