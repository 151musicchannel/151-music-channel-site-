/* =========================================================
   151 MUSIC CHANNEL — Récepteur du direct (test en local)

   Reçoit le stream envoyé par vMix (RTMP) et le transforme en flux HLS
   que le lecteur du site sait lire : /direct/index.m3u8
   Utilise ffmpeg (doit être installé sur le PC).

   Lancer :  npm run direct
   Dans vMix : Stream → Settings → Destination « Custom RTMP Server »
     URL :  rtmp://<adresse de ce PC>:1935/live
     Clé :  la valeur DIRECT_CLE du fichier .env (créée automatiquement)
   ========================================================= */
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");

const RACINE = path.join(__dirname, "..");
const FICHIER_ENV = path.join(RACINE, ".env");
require("dotenv").config({ path: FICHIER_ENV, quiet: true });

const PORT_RTMP = Number(process.env.DIRECT_PORT_RTMP) || 1935;
const FFMPEG = process.env.FFMPEG_CHEMIN || "ffmpeg";
const SORTIE = path.join(RACINE, "storage", "direct");

/* ---------- Clé de streaming : créée une fois, gardée dans .env ---------- */
let cle = process.env.DIRECT_CLE;
if (!cle) {
  cle = "151-" + crypto.randomBytes(8).toString("hex");
  fs.appendFileSync(FICHIER_ENV, `${fs.existsSync(FICHIER_ENV) ? "\n" : ""}# Clé de streaming du direct (vMix)\nDIRECT_CLE=${cle}\n`);
}

/* ---------- Adresses de ce PC sur le réseau local ---------- */
const adresses = Object.values(os.networkInterfaces()).flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i.address);

function viderSortie() {
  fs.mkdirSync(SORTIE, { recursive: true });
  for (const f of fs.readdirSync(SORTIE)) fs.rmSync(path.join(SORTIE, f), { force: true });
}

function afficherInfos() {
  console.log("\n==============================================");
  console.log(" 151 Music Channel — récepteur du direct prêt");
  console.log("==============================================");
  console.log(" Dans vMix : Stream → Settings → Custom RTMP Server");
  console.log("   URL (vMix sur ce PC)       : rtmp://localhost:" + PORT_RTMP + "/live");
  adresses.forEach((a) => console.log("   URL (vMix sur un autre PC) : rtmp://" + a + ":" + PORT_RTMP + "/live"));
  console.log("   Clé de stream              : " + cle);
  console.log(" Le direct apparaîtra sur http://localhost:8151");
  console.log("==============================================\n");
}

/* ---------- ffmpeg écoute le RTMP et écrit le HLS ----------
   À chaque fin de stream (vMix arrêté), on relance l'écoute. */
function ecouter() {
  viderSortie();
  const args = [
    "-hide_banner", "-loglevel", "warning",
    "-listen", "1", "-timeout", "-1",
    "-i", `rtmp://0.0.0.0:${PORT_RTMP}/live/${cle}`,
    // vMix envoie déjà du H.264 + AAC : on recopie sans réencoder (peu de CPU)
    "-c", "copy",
    "-f", "hls",
    "-hls_time", "2",
    "-hls_list_size", "6",
    "-hls_flags", "delete_segments+independent_segments+omit_endlist",
    "-hls_segment_filename", path.join(SORTIE, "segment_%05d.ts"),
    path.join(SORTIE, "index.m3u8"),
  ];
  const p = spawn(FFMPEG, args, { stdio: ["ignore", "inherit", "inherit"] });
  console.log(new Date().toLocaleTimeString("fr-FR") + " — en attente du stream de vMix…");
  p.on("error", (e) => {
    console.error("Impossible de lancer ffmpeg :", e.message, "\n→ Installez ffmpeg ou indiquez FFMPEG_CHEMIN dans .env");
    process.exit(1);
  });
  p.on("exit", () => {
    console.log(new Date().toLocaleTimeString("fr-FR") + " — stream terminé, nouvelle écoute dans 2 s");
    setTimeout(ecouter, 2000);
  });
  process.once("SIGINT", () => { p.kill(); process.exit(0); });
}

/* ---------- Un seul récepteur à la fois ----------
   Deux récepteurs lancés en même temps se volent le stream et effacent
   les fichiers l'un de l'autre : on vérifie que le port est libre. */
const net = require("net");
const test = net.createServer();
test.once("error", () => {
  console.error(`\nLe port ${PORT_RTMP} est déjà utilisé : un récepteur du direct tourne déjà.`);
  console.error("Fermez l'autre fenêtre (ou arrêtez-le dans l'application) avant d'en relancer un.\n");
  process.exit(1);
});
test.once("listening", () => test.close(() => { afficherInfos(); ecouter(); }));
test.listen({ port: PORT_RTMP, host: "0.0.0.0", exclusive: true });
