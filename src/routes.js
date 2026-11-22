/* =========================================================
   Routes (adresses des pages)
   ========================================================= */
const express = require("express");
const rateLimit = require("express-rate-limit");

const contenu = require("./contenu");
const grille = require("./grille");
const contact = require("./contact");

const router = express.Router();

/* ---------- Accueil ---------- */
router.get("/", (req, res) => {
  const site = contenu.site();
  const programmes = contenu.programmes();
  const { enCours, suivant } = grille.enCoursEtSuivant(programmes, site.fuseauHoraire);
  const { jour } = grille.maintenantDans(site.fuseauHoraire);

  res.render("pages/accueil", {
    seo: { titre: null, description: site.description },
    enCours,
    suivant,
    libelleSuivant: grille.libelleCreneau(suivant, jour),
    aLaUne: contenu.aLaUne(),
    clips: contenu.clips().slice(0, 12),
    // Top 10 : l'ordre du fichier clips.json fait le classement
    top10: contenu.clips().slice(0, 10),
    programmes,
    actualites: contenu.actualites().slice(0, 8),
    artistes: contenu.artistes().filter((a) => a.aLaUne).slice(0, 12),
  });
});

/* ---------- Programmes ---------- */
router.get("/programmes", (req, res) => {
  res.render("pages/programmes", {
    seo: { titre: "Programmes", description: "Toutes les émissions de 151 Music Channel : horaires, présentateurs et jours de diffusion." },
    programmes: contenu.programmes(),
    jours: grille.JOURS,
  });
});

/* ---------- Clips ---------- */
router.get("/clips", (req, res) => {
  const tous = contenu.clips();
  const categories = [...new Set(tous.map((c) => c.categorie).filter(Boolean))].sort();
  const categorie = categories.includes(req.query.categorie) ? req.query.categorie : null;
  res.render("pages/clips", {
    seo: { titre: "Clips musicaux", description: "Les clips musicaux mis en avant par 151 Music Channel." },
    clips: categorie ? tous.filter((c) => c.categorie === categorie) : tous,
    categories,
    categorie,
  });
});

/* ---------- Actualités ---------- */
router.get("/actualites", (req, res) => {
  res.render("pages/actualites", {
    seo: { titre: "Actualités", description: "Sorties, interviews, événements et annonces : toute l'actualité musicale de 151 Music Channel." },
    actualites: contenu.actualites(),
  });
});

router.get("/actualites/:slug", (req, res, next) => {
  const article = contenu.actualite(req.params.slug);
  if (!article) return next();
  res.render("pages/article", {
    seo: { titre: article.titre, description: article.resume, image: article.image, type: "article" },
    article,
    autres: contenu.actualites().filter((a) => a.slug !== article.slug).slice(0, 3),
    artiste: article.artiste ? contenu.artiste(article.artiste) : null,
  });
});

/* ---------- Artistes ---------- */
router.get("/artistes", (req, res) => {
  res.render("pages/artistes", {
    seo: { titre: "Artistes", description: "Les artistes mis en avant par 151 Music Channel." },
    artistes: contenu.artistes(),
  });
});

router.get("/artistes/:slug", (req, res, next) => {
  const artiste = contenu.artiste(req.params.slug);
  if (!artiste) return next();
  res.render("pages/artiste", {
    seo: { titre: artiste.nom, description: artiste.presentation, image: artiste.photo, type: "profile" },
    artiste,
    clips: contenu.clips().filter((c) => c.artiste === artiste.slug),
    actualites: contenu.actualites().filter((a) => a.artiste === artiste.slug),
  });
});

/* ---------- Événements ---------- */
router.get("/evenements", (req, res) => {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const tous = contenu.evenements();
  res.render("pages/evenements", {
    seo: { titre: "Événements", description: "Concerts, festivals et événements auxquels participe 151 Music Channel." },
    aVenir: tous.filter((e) => (e.dateFin || e.date) >= aujourdhui),
    passes: tous.filter((e) => (e.dateFin || e.date) < aujourdhui).reverse(),
  });
});

/* ---------- À propos ---------- */
router.get("/a-propos", (req, res) => {
  res.render("pages/a-propos", {
    seo: { titre: "À propos", description: "Histoire, mission et vision de 151 Music Channel, la chaîne de télévision musicale." },
  });
});

/* ---------- Contact ---------- */
function afficherContact(res, extra = {}) {
  res.render("pages/contact", {
    seo: { titre: "Contact", description: "Contactez l'équipe de 151 Music Channel." },
    jeton: contact.creerJeton(),
    valeurs: {},
    erreurs: {},
    envoye: false,
    erreurEnvoi: false,
    ...extra,
  });
}

router.get("/contact", (req, res) => afficherContact(res, { envoye: req.query.envoye === "1" }));

const limiteContact = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).render("pages/contact", {
      seo: { titre: "Contact", description: "Contactez l'équipe de 151 Music Channel.", noindex: true },
      jeton: contact.creerJeton(),
      valeurs: req.body || {},
      erreurs: { global: "Trop de messages envoyés. Réessayez dans quelques minutes." },
      envoye: false,
      erreurEnvoi: false,
    }),
});

router.post("/contact", limiteContact, async (req, res, next) => {
  try {
    // Robot détecté : on fait semblant que tout va bien, sans rien envoyer
    if (contact.estUnRobot(req.body)) return res.redirect(303, "/contact?envoye=1");

    const { valeurs, erreurs } = contact.valider(req.body);
    if (Object.keys(erreurs).length) {
      res.status(400);
      return afficherContact(res, { valeurs, erreurs });
    }

    try {
      await contact.envoyer(valeurs, contenu.site().contact.email);
    } catch (e) {
      console.error("Envoi du message impossible :", e.message);
      res.status(502);
      return afficherContact(res, { valeurs, erreurEnvoi: true });
    }
    res.redirect(303, "/contact?envoye=1");
  } catch (e) {
    next(e);
  }
});

/* ---------- Mentions légales ---------- */
router.get("/mentions-legales", (req, res) => {
  res.render("pages/mentions-legales", {
    seo: { titre: "Mentions légales", description: "Mentions légales et politique de confidentialité du site 151 Music Channel." },
  });
});

/* ---------- Référencement ---------- */
router.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(`User-agent: *\nAllow: /\n\nSitemap: ${res.locals.siteUrl}/sitemap.xml\n`);
});

router.get("/sitemap.xml", (req, res) => {
  const base = res.locals.siteUrl;
  const pages = ["/", "/programmes", "/clips", "/actualites", "/artistes", "/evenements", "/a-propos", "/contact", "/mentions-legales"];
  const urls = [
    ...pages.map((p) => ({ loc: base + p })),
    ...contenu.actualites().map((a) => ({ loc: `${base}/actualites/${a.slug}`, lastmod: a.date })),
    ...contenu.artistes().map((a) => ({ loc: `${base}/artistes/${a.slug}` })),
  ];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n") +
    "\n</urlset>\n";
  res.type("application/xml").send(xml);
});

module.exports = router;
