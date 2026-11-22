/* =========================================================
   151 MUSIC CHANNEL — Serveur du site officiel
   Lancer :  npm start   (ou npm run dev pour recharger auto)
   ========================================================= */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const express = require("express");
const helmet = require("helmet");
const compression = require("compression");

const contenu = require("./src/contenu");
const routes = require("./src/routes");
const aide = require("./src/aide");

const app = express();
// Numéro de version des fichiers de style et de script (nouveau à chaque redémarrage du site)
const VERSION = Date.now().toString(36);
const PORT = Number(process.env.PORT) || 8151;
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1); // derrière l'hébergeur / reverse proxy (HTTPS)
app.disable("x-powered-by");

/* ---------- Sécurité ---------- */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        // Le flux du direct peut venir d'un autre serveur (CDN de diffusion)
        mediaSrc: ["'self'", "blob:", "https:"],
        connectSrc: ["'self'", "https:"],
        frameSrc: ["https://www.youtube.com", "https://www.youtube-nocookie.com", "https://www.dailymotion.com", "https://player.vimeo.com"],
        workerSrc: ["'self'", "blob:"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

/* Redirection vers HTTPS en production */
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.secure) return next();
    res.redirect(301, "https://" + req.headers.host + req.originalUrl);
  });
}

app.use(compression());
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

/* ---------- Fichiers statiques ---------- */
const unJour = process.env.NODE_ENV === "production" ? "7d" : 0;
app.use(express.static(path.join(__dirname, "public"), { maxAge: unJour }));
app.use("/vendor", express.static(path.join(__dirname, "node_modules/hls.js/dist"), { maxAge: unJour }));
/* Flux du direct produit en local par « npm run direct » (vMix → ffmpeg → HLS) */
app.use("/direct", express.static(path.join(__dirname, "storage/direct"), {
  setHeaders: (res) => res.setHeader("Cache-Control", "no-store"),
}));

/* ---------- Variables disponibles dans toutes les pages ---------- */
app.use((req, res, next) => {
  res.locals.site = contenu.site();
  res.locals.siteUrl = SITE_URL;
  res.locals.cheminActuel = req.path;
  res.locals.annee = new Date().getFullYear();
  res.locals.aide = aide;
  res.locals.v = VERSION; // change à chaque mise en ligne : force les navigateurs à recharger style et scripts
  next();
});

app.use(routes);

/* ---------- 404 et erreurs ---------- */
app.use((req, res) => {
  res.status(404).render("pages/404", { seo: { titre: "Page introuvable", description: "Cette page n'existe pas.", noindex: true } });
});
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render("pages/404", {
    seo: { titre: "Erreur", description: "Une erreur est survenue.", noindex: true },
    erreurServeur: true,
  });
});

// En production, HOST=127.0.0.1 : seul Caddy (HTTPS) parle au site
const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`151 Music Channel en ligne sur http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT} (${process.env.NODE_ENV || "development"})`);
});
