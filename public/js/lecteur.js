/* =========================================================
   151 MUSIC CHANNEL — Lecteur du direct (page d'accueil)
   Le flux est défini dans data/site.json → "direct".
   ========================================================= */
(function () {
  const lecteur = document.getElementById("lecteur");
  if (!lecteur) return;

  const type = lecteur.dataset.type;
  const url = lecteur.dataset.url;
  const $ = (id) => document.getElementById(id);
  const video = $("video");
  const btnSon = $("btnSon");
  const grosPlay = $("grosPlay");
  const message = $("messageLecteur");
  const curseur = $("curseurVolume");
  const btnLive = $("btnLive");
  let hls = null;

  /* ---------- Lecteur intégré (YouTube Live, Dailymotion…) ---------- */
  if (type === "youtube" || type === "iframe") {
    const iframe = document.createElement("iframe");
    iframe.src = type === "youtube"
      ? "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(url) + "?autoplay=1&mute=1&playsinline=1&rel=0"
      : url;
    iframe.title = "151 Music Channel en direct";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.loading = "eager";
    video.replaceWith(iframe);
    lecteur.classList.add("externe");
    return;
  }

  /* ---------- Flux HLS (.m3u8) ---------- */
  function demarrer() {
    clearTimeout(relance);
    message.hidden = true;
    lecteur.classList.add("charge");
    if (hls) { hls.destroy(); hls = null; }

    if (window.Hls && Hls.isSupported()) {
      hls = new Hls({ lowLatencyMode: true, liveDurationInfinity: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, lire);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); return; }
        indisponible();
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url; // Safari / iPhone lisent le HLS nativement
      video.addEventListener("loadedmetadata", lire, { once: true });
      video.addEventListener("error", indisponible, { once: true });
    } else {
      indisponible();
    }
  }

  function lire() {
    video.muted = true; // la lecture automatique n'est autorisée que sans le son
    const p = video.play();
    if (p && p.catch) p.catch(majEtat);
  }

  // Quand le signal manque (vMix arrêté, coupure), on réessaie tout seul toutes les 10 s
  let relance = null;
  function indisponible() {
    lecteur.classList.remove("charge");
    message.hidden = false;
    clearTimeout(relance);
    relance = setTimeout(demarrer, 10000);
  }

  /* ---------- État visuel ---------- */
  function majEtat() {
    lecteur.classList.toggle("en-pause", video.paused);
    lecteur.classList.toggle("muet", video.muted || video.volume === 0);
    grosPlay.hidden = !video.paused;
    btnSon.hidden = !video.muted || video.paused;
    $("btnLecture").setAttribute("aria-label", video.paused ? "Lecture" : "Pause");
    $("btnMuet").setAttribute("aria-label", video.muted ? "Activer le son" : "Couper le son");
    curseur.value = video.muted ? 0 : video.volume;
    majLive();
  }
  ["play", "pause", "volumechange"].forEach((e) => video.addEventListener(e, majEtat));
  video.addEventListener("waiting", () => lecteur.classList.add("charge"));
  ["playing", "canplay"].forEach((e) => video.addEventListener(e, () => lecteur.classList.remove("charge")));

  /* Indicateur LIVE : rouge quand on est sur le direct, gris si en pause ou en retard */
  function finDuDirect() {
    if (hls && hls.liveSyncPosition) return hls.liveSyncPosition;
    if (video.seekable.length) return video.seekable.end(video.seekable.length - 1);
    return null;
  }
  function majLive() {
    const fin = finDuDirect();
    const enRetard = fin !== null && isFinite(fin) && fin - video.currentTime > 30;
    btnLive.classList.toggle("decale", video.paused || enRetard);
  }
  btnLive.addEventListener("click", () => {
    const fin = finDuDirect();
    if (fin !== null && isFinite(fin)) video.currentTime = fin;
    video.play();
  });
  setInterval(majLive, 4000);

  /* ---------- Commandes ---------- */
  const basculer = () => (video.paused ? video.play() : video.pause());
  const activerSon = () => { video.muted = false; if (video.volume === 0) video.volume = 1; video.play(); };

  $("btnLecture").addEventListener("click", basculer);
  grosPlay.addEventListener("click", () => video.play());
  btnSon.addEventListener("click", activerSon);
  $("btnMuet").addEventListener("click", () => (video.muted ? activerSon() : (video.muted = true)));
  curseur.addEventListener("input", () => {
    video.volume = Number(curseur.value);
    video.muted = video.volume === 0;
  });
  video.addEventListener("click", basculer);
  video.addEventListener("dblclick", pleinEcran);

  function pleinEcran() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (lecteur.requestFullscreen) lecteur.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone
  }
  $("btnPleinEcran").addEventListener("click", pleinEcran);
  $("btnReessayer").addEventListener("click", demarrer);

  /* ---------- Agrandir (mode cinéma, comme sur YouTube) ----------
     Le lecteur prend toute la largeur de l'écran, sans quitter la page.
     Le choix est mémorisé pour la prochaine visite. */
  const section = lecteur.closest(".accueil");
  const btnCinema = $("btnCinema");
  function cinema(actif) {
    section.classList.toggle("cinema", actif);
    btnCinema.setAttribute("aria-pressed", String(actif));
    btnCinema.setAttribute("aria-label", actif ? "Réduire le lecteur" : "Agrandir le lecteur");
    btnCinema.title = actif ? "Réduire (t)" : "Agrandir (t)";
    try { localStorage.setItem("151-cinema", actif ? "1" : "0"); } catch (e) {}
  }
  const basculerCinema = () => {
    cinema(!section.classList.contains("cinema"));
    lecteur.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  btnCinema.addEventListener("click", basculerCinema);
  try { if (localStorage.getItem("151-cinema") === "1") cinema(true); } catch (e) {}

  /* Raccourcis clavier : espace/k = pause, m = son, f = plein écran, t = agrandir */
  document.addEventListener("keydown", (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if ((k === " " || k === "k") && (e.target === document.body || lecteur.contains(e.target))) { e.preventDefault(); basculer(); }
    else if (k === "m") video.muted ? activerSon() : (video.muted = true);
    else if (k === "f") pleinEcran();
    else if (k === "t") basculerCinema();
  });

  /* Les commandes s'effacent après 3 s d'inactivité */
  let minuteur;
  function reveiller() {
    lecteur.classList.remove("inactif");
    clearTimeout(minuteur);
    minuteur = setTimeout(() => { if (!video.paused) lecteur.classList.add("inactif"); }, 3000);
  }
  ["mousemove", "touchstart", "keydown", "focusin"].forEach((e) => lecteur.addEventListener(e, reveiller, { passive: true }));
  lecteur.addEventListener("mouseleave", () => { if (!video.paused) lecteur.classList.add("inactif"); });
  video.addEventListener("pause", reveiller);

  demarrer();
  majEtat();
  reveiller();
})();
