/* =========================================================
   151 MUSIC CHANNEL — Scripts communs à toutes les pages
   ========================================================= */
(function () {
  /* ---------- Menu mobile ---------- */
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  if (burger && menu) {
    const fermer = () => { menu.classList.remove("ouvert"); burger.setAttribute("aria-expanded", "false"); };
    burger.addEventListener("click", () => {
      const ouvert = menu.classList.toggle("ouvert");
      burger.setAttribute("aria-expanded", String(ouvert));
    });
    menu.addEventListener("click", (e) => { if (e.target.tagName === "A") fermer(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") fermer(); });
  }

  /* ---------- Apparition des éléments au défilement ---------- */
  if (document.documentElement.classList.contains("anim")) {
    const cibles = document.querySelectorAll(
      ".section__tete, .section > .conteneur > .titre-section, .grille > *, .une, .rangee__tete, .rangee__piste, .evenement, .apropos__bloc, .objectifs li, .appel, .fiche__grille > *, .contact > *, .article .conteneur > *"
    );
    // Décalage en cascade des cartes d'une même grille
    cibles.forEach((el) => {
      el.classList.add("a-reveler");
      const parent = el.parentElement;
      if (parent.classList.contains("grille") || parent.classList.contains("objectifs") || parent.classList.contains("evenements")) {
        const i = Array.prototype.indexOf.call(parent.children, el);
        el.style.setProperty("--delai", Math.min(i, 6) * 0.08 + "s");
      }
    });
    const nettoyer = (el) => {
      // Une fois apparu, l'élément retrouve ses effets de survol normaux
      el.classList.remove("a-reveler", "visible");
      el.style.removeProperty("--delai");
    };
    const obs = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add("visible");
        obs.unobserve(el);
        el.addEventListener("transitionend", function fin(ev) {
          if (ev.target !== el || ev.propertyName !== "opacity") return;
          el.removeEventListener("transitionend", fin);
          nettoyer(el);
        });
        setTimeout(() => nettoyer(el), 1600); // sécurité si l'événement ne vient pas
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    cibles.forEach((el) => obs.observe(el));
  }

  /* ---------- Sous-menu « Plus » ---------- */
  const btnPlus = document.getElementById("btnPlus");
  if (btnPlus) {
    const bloc = btnPlus.parentElement;
    const basculer = (ouvrir) => {
      bloc.classList.toggle("ouvert", ouvrir);
      btnPlus.setAttribute("aria-expanded", String(ouvrir));
    };
    btnPlus.addEventListener("click", (e) => { e.stopPropagation(); basculer(!bloc.classList.contains("ouvert")); });
    document.addEventListener("click", (e) => { if (!bloc.contains(e.target)) basculer(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { basculer(false); } });
  }

  /* ---------- Validation du formulaire de contact (côté navigateur) ----------
     Le serveur revalide toujours : ceci sert seulement au confort du visiteur. */
  const form = document.getElementById("formContact");
  if (form) {
    const messages = {
      nom: "Indiquez votre nom.",
      email: "Indiquez une adresse e-mail valide.",
      sujet: "Indiquez le sujet de votre message.",
      message: "Votre message doit faire au moins 10 caractères.",
    };
    const verifier = (champ) => {
      const bloc = champ.closest(".champ");
      const erreur = bloc.querySelector(".champ__erreur");
      const valide = champ.value.trim().length > 0 && champ.checkValidity();
      bloc.classList.toggle("champ--erreur", !valide);
      erreur.textContent = valide ? "" : messages[champ.name];
      if (valide) champ.removeAttribute("aria-invalid");
      else { champ.setAttribute("aria-invalid", "true"); champ.setAttribute("aria-describedby", erreur.id); }
      return valide;
    };
    const champs = [...form.querySelectorAll("input[required], textarea[required]")];
    champs.forEach((c) => c.addEventListener("blur", () => { if (c.value) verifier(c); }));
    champs.forEach((c) => c.addEventListener("input", () => { if (c.closest(".champ--erreur")) verifier(c); }));
    form.addEventListener("submit", (e) => {
      const invalides = champs.filter((c) => !verifier(c));
      if (invalides.length) { e.preventDefault(); invalides[0].focus(); return; }
      const bouton = form.querySelector("button[type=submit]");
      bouton.disabled = true;
      bouton.textContent = "Envoi en cours…";
    });
  }
})();
