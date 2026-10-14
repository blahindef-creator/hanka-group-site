// Section « À la une » de l'accueil : publicités / placements de produits gérés dans l'espace
// admin (onglet Publicités). Masquée tant qu'aucune publicité n'est publiée sur la période en cours.

(function () {
  var section = document.getElementById("pubs");
  if (!section || typeof HANKA_CONFIG === "undefined") return;

  function echapper(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var aujourdhui = new Date().toISOString().slice(0, 10);
  fetch(HANKA_CONFIG.supabaseUrl + "/rest/v1/publicites?select=titre,texte,image_url,lien_url,libelle_bouton" +
    "&publie=eq.true" +
    "&or=(date_debut.is.null,date_debut.lte." + aujourdhui + ")" +
    "&and=(or(date_fin.is.null,date_fin.gte." + aujourdhui + "))" +
    "&order=ordre,created_at", {
    headers: { apikey: HANKA_CONFIG.supabaseAnonKey, Authorization: "Bearer " + HANKA_CONFIG.supabaseAnonKey }
  })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (pubs) {
      if (!pubs || !pubs.length) return;
      var grille = document.getElementById("pubs-grille");
      grille.classList.toggle("pubs-une-seule", pubs.length === 1);
      grille.innerHTML = pubs.map(function (p) {
        var image = '<img src="' + echapper(p.image_url) + '" alt="' + echapper(p.titre || "Publicité") + '" loading="lazy">';
        var lien = p.lien_url
          ? '<a class="btn btn-primary btn-petit" href="' + echapper(p.lien_url) + '" target="_blank" rel="noopener sponsored">' + echapper(p.libelle_bouton || "En savoir plus") + " →</a>"
          : "";
        return '<article class="pub">' +
          (p.lien_url ? '<a class="pub-image" href="' + echapper(p.lien_url) + '" target="_blank" rel="noopener sponsored" tabindex="-1" aria-hidden="true">' + image + "</a>" : '<div class="pub-image">' + image + "</div>") +
          ((p.titre || p.texte || lien)
            ? '<div class="pub-texte">' +
                (p.titre ? "<h3>" + echapper(p.titre) + "</h3>" : "") +
                (p.texte ? "<p>" + echapper(p.texte) + "</p>" : "") +
                lien +
              "</div>"
            : "") +
          '<span class="pub-mention">Publicité</span>' +
        "</article>";
      }).join("");
      section.hidden = false;
    })
    .catch(function () { /* section laissée masquée */ });
})();
