// Page Services : affiche, pour chaque service, les photos téléversées par les admins
// (1 à 7, onglet Visuels). Un service sans photo téléversée garde ses images d'origine.

(function () {
  var zones = document.querySelectorAll("[data-galerie]");
  if (!zones.length || typeof HANKA_CONFIG === "undefined") return;

  var NOMS = {
    creation: "Création d'entreprise",
    modification: "Modification d'entreprise",
    formation: "Formation certifiante",
    procedures: "Procédures administratives",
    immobilier: "Immobilier",
    communication: "Communication digitale"
  };

  function echapper(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  fetch(HANKA_CONFIG.supabaseUrl + "/rest/v1/photos_services?select=service,url&order=service,ordre,created_at", {
    headers: { apikey: HANKA_CONFIG.supabaseAnonKey, Authorization: "Bearer " + HANKA_CONFIG.supabaseAnonKey }
  })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (photos) {
      var parService = {};
      (photos || []).forEach(function (p) { (parService[p.service] = parService[p.service] || []).push(p.url); });

      zones.forEach(function (zone) {
        var service = zone.getAttribute("data-galerie");
        var urls = parService[service];
        if (!urls || !urls.length) return; // pas de photo téléversée : images d'origine

        var nom = NOMS[service] || "Service";
        var ancien = zone.querySelector(".hero-slider");
        if (ancien && ancien.hankaArreter) ancien.hankaArreter();

        if (urls.length === 1) {
          zone.innerHTML = '<img class="service-photo" src="' + echapper(urls[0]) + '" alt="' + echapper(nom) + '">';
          return;
        }
        zone.innerHTML = '<div class="hero-slider service-slider" aria-roledescription="carrousel" aria-label="' + echapper(nom) + ' en images">' +
          urls.map(function (url, i) {
            return '<div class="hero-slide' + (i === 0 ? " is-active" : "") + '"><img src="' + echapper(url) + '" alt="' + echapper(nom) + " — photo " + (i + 1) + '"></div>';
          }).join("") +
          '<div class="hero-dots" role="tablist" aria-label="Choisir une image"></div></div>';
        if (window.hankaDiaporama) window.hankaDiaporama(zone.querySelector(".hero-slider"));
      });
    })
    .catch(function () { /* on garde les images d'origine */ });
})();
