/* =========================================================
   151 MUSIC CHANNEL — Accueil : carrousel « À la une » et rangées
   ========================================================= */
(function () {
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Carrousel ---------- */
  const piste = document.getElementById("unePiste");
  if (piste) {
    const diapos = [...piste.children];
    const points = [...document.querySelectorAll("#unePoints button")];
    const cadre = piste.parentElement;
    let actuelle = 0;
    let minuteur = null;

    const aller = (i) => {
      actuelle = (i + diapos.length) % diapos.length;
      piste.scrollTo({ left: diapos[actuelle].offsetLeft, behavior: reduit ? "auto" : "smooth" });
    };
    const majPoints = () => points.forEach((p, i) => p.setAttribute("aria-current", i === actuelle ? "true" : "false"));

    // La diapositive visible est suivie pendant le défilement (doigt, souris, flèches)
    piste.addEventListener("scroll", () => {
      const i = Math.round(piste.scrollLeft / piste.clientWidth);
      if (i !== actuelle) { actuelle = i; majPoints(); }
    }, { passive: true });

    const prec = document.getElementById("unePrec");
    const suiv = document.getElementById("uneSuiv");
    if (prec) prec.addEventListener("click", () => { aller(actuelle - 1); relancer(); });
    if (suiv) suiv.addEventListener("click", () => { aller(actuelle + 1); relancer(); });
    points.forEach((p, i) => p.addEventListener("click", () => { aller(i); relancer(); }));

    // Défilement automatique toutes les 6 s, en pause au survol ou au toucher
    function demarrer() { if (!reduit && diapos.length > 1) minuteur = setInterval(() => aller(actuelle + 1), 6000); }
    function arreter() { clearInterval(minuteur); minuteur = null; }
    function relancer() { arreter(); demarrer(); }
    cadre.addEventListener("mouseenter", arreter);
    cadre.addEventListener("mouseleave", demarrer);
    cadre.addEventListener("focusin", arreter);
    cadre.addEventListener("focusout", demarrer);
    piste.addEventListener("touchstart", arreter, { passive: true });
    document.addEventListener("visibilitychange", () => (document.hidden ? arreter() : demarrer()));
    majPoints();
    demarrer();
  }

  /* ---------- Rangées défilantes : flèches précédent / suivant ---------- */
  document.querySelectorAll(".rangee").forEach((rangee) => {
    const pisteR = rangee.querySelector(".rangee__piste");
    const fleches = rangee.querySelectorAll(".rangee__fleche");
    if (!pisteR || !fleches.length) return;

    const majFleches = () => {
      const max = pisteR.scrollWidth - pisteR.clientWidth - 2;
      fleches[0].disabled = pisteR.scrollLeft <= 2;
      fleches[1].disabled = pisteR.scrollLeft >= max;
    };
    fleches.forEach((f) => f.addEventListener("click", () => {
      pisteR.scrollBy({ left: Number(f.dataset.sens) * pisteR.clientWidth * 0.8, behavior: reduit ? "auto" : "smooth" });
    }));
    pisteR.addEventListener("scroll", majFleches, { passive: true });
    window.addEventListener("resize", majFleches);
    majFleches();
  });
})();
