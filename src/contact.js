/* =========================================================
   Formulaire de contact
   - validation côté serveur
   - anti-robots : champ piège invisible + délai minimum signé
   - limite d'envois par adresse IP (voir routes.js)
   - envoi par e-mail (SMTP) si configuré dans .env,
     sinon enregistrement dans storage/messages.jsonl
   ========================================================= */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const SECRET = process.env.FORM_SECRET || crypto.randomBytes(32).toString("hex");
const DELAI_MIN_MS = 3000;       // un humain met plus de 3 s à remplir le formulaire
const VALIDITE_MAX_MS = 2 * 60 * 60 * 1000; // jeton valable 2 h

/* Jeton horodaté et signé, placé dans un champ caché */
function creerJeton() {
  const ts = Date.now().toString();
  const sig = crypto.createHmac("sha256", SECRET).update(ts).digest("hex");
  return `${ts}.${sig}`;
}

function jetonValide(jeton) {
  const [ts, sig] = String(jeton || "").split(".");
  if (!ts || !sig) return false;
  const attendu = crypto.createHmac("sha256", SECRET).update(ts).digest("hex");
  if (sig.length !== attendu.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(attendu))) return false;
  const age = Date.now() - Number(ts);
  return age >= DELAI_MIN_MS && age <= VALIDITE_MAX_MS;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function nettoyer(v, max) {
  return String(v || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

function valider(corps) {
  const valeurs = {
    nom: nettoyer(corps.nom, 100),
    email: nettoyer(corps.email, 150),
    sujet: nettoyer(corps.sujet, 150),
    message: nettoyer(corps.message, 5000),
  };
  const erreurs = {};
  if (valeurs.nom.length < 2) erreurs.nom = "Indiquez votre nom.";
  if (!EMAIL_RE.test(valeurs.email)) erreurs.email = "Indiquez une adresse e-mail valide.";
  if (valeurs.sujet.length < 3) erreurs.sujet = "Indiquez le sujet de votre message.";
  if (valeurs.message.length < 10) erreurs.message = "Votre message doit faire au moins 10 caractères.";
  return { valeurs, erreurs };
}

/* Retourne true si la requête ressemble à un robot */
function estUnRobot(corps) {
  if (corps.site_web) return true;          // champ piège rempli
  if (!jetonValide(corps.jeton)) return true; // trop rapide, trop vieux ou falsifié
  return false;
}

let transport = null;
if (process.env.SMTP_HOST) {
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

async function envoyer(valeurs, destinataire) {
  if (transport) {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO || destinataire,
      replyTo: `"${valeurs.nom.replace(/"/g, "")}" <${valeurs.email}>`,
      subject: `[Site 151] ${valeurs.sujet}`,
      text: `Nom : ${valeurs.nom}\nE-mail : ${valeurs.email}\nSujet : ${valeurs.sujet}\n\n${valeurs.message}`,
    });
    return;
  }
  // Pas de SMTP configuré : on garde le message dans un fichier (dossier non public)
  const fichier = path.join(__dirname, "..", "storage", "messages.jsonl");
  fs.appendFileSync(fichier, JSON.stringify({ date: new Date().toISOString(), ...valeurs }) + "\n");
}

module.exports = { creerJeton, valider, estUnRobot, envoyer };
