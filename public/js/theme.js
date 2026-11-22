/* =========================================================
   151 MUSIC CHANNEL — Préparation de la page
   Chargé dans <head> (sans defer). Le site n'a qu'un thème : clair.
   ========================================================= */
(function () {
  // Active les animations d'apparition (seulement si JavaScript tourne et si le
  // visiteur n'a pas demandé à réduire les animations)
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    document.documentElement.classList.add("anim");
  }
  // Nettoie un ancien choix de thème mémorisé (le mode sombre a été retiré)
  try { localStorage.removeItem("151-theme"); } catch (e) {}
})();
