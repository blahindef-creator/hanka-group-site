// Remplace les photos du site par celles choisies dans l'espace admin (onglet Visuels).
// Sans remplacement enregistré, l'image d'origine de la page reste affichée.

(function () {
  var images = document.querySelectorAll("img[data-visuel]");
  if (!images.length || typeof HANKA_CONFIG === "undefined") return;

  fetch(HANKA_CONFIG.supabaseUrl + "/rest/v1/visuels?select=cle,url", {
    headers: { apikey: HANKA_CONFIG.supabaseAnonKey, Authorization: "Bearer " + HANKA_CONFIG.supabaseAnonKey }
  })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (lignes) {
      var urls = {};
      (lignes || []).forEach(function (l) { urls[l.cle] = l.url; });
      images.forEach(function (img) {
        var url = urls[img.getAttribute("data-visuel")];
        if (url && img.getAttribute("src") !== url) img.src = url;
      });
    })
    .catch(function () { /* on garde les images d'origine */ });
})();
