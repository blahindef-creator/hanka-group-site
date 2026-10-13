// Section « Nos clients parlent de nous » : cartes vidéo défilantes + lecture dans une fenêtre.
// Les témoignages sont gérés depuis l'espace admin (onglet Témoignages) et lus dans la base ;
// la section reste masquée tant qu'aucun témoignage n'est publié.

document.addEventListener("DOMContentLoaded", function () {
  var section = document.getElementById("temoignages");
  if (!section || typeof HANKA_CONFIG === "undefined") return;

  fetch(HANKA_CONFIG.supabaseUrl + "/rest/v1/temoignages?select=nom,activite,service,video_url,affiche_url&publie=eq.true&order=ordre,created_at", {
    headers: { apikey: HANKA_CONFIG.supabaseAnonKey, Authorization: "Bearer " + HANKA_CONFIG.supabaseAnonKey }
  })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (lignes) {
      var liste = (lignes || []).map(function (l) {
        return { nom: l.nom, activite: l.activite, service: l.service, video: l.video_url, affiche: l.affiche_url };
      });
      if (liste.length) afficherTemoignages(section, liste);
    })
    .catch(function () { /* section laissée masquée */ });
});

function afficherTemoignages(section, TEMOIGNAGES) {
  var liste = document.getElementById("temoignages-liste");
  var modale = document.getElementById("video-modale");
  var lecteur = document.getElementById("video-lecteur");
  var dernierFocus = null;

  function echapper(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Identifiant d'une vidéo YouTube (youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID)
  function idYoutube(url) {
    var m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function affiche(t) {
    if (t.affiche) return t.affiche;
    var id = idYoutube(t.video);
    return id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "";
  }

  liste.innerHTML = TEMOIGNAGES.map(function (t, i) {
    var image = affiche(t);
    return '<li class="temoignage">' +
      '<button type="button" class="temoignage-video" data-index="' + i + '" aria-label="Voir le témoignage de ' + echapper(t.nom) + '">' +
      (image ? '<img src="' + echapper(image) + '" alt="" loading="lazy">' : '<span class="temoignage-sans-image">' + echapper((t.nom || "?").charAt(0)) + "</span>") +
      '<span class="temoignage-play" aria-hidden="true"></span>' +
      "</button>" +
      '<div class="temoignage-infos">' +
      "<strong>" + echapper(t.nom) + "</strong>" +
      (t.activite ? "<span>" + echapper(t.activite) + "</span>" : "") +
      (t.service ? '<span class="temoignage-service">' + echapper(t.service) + "</span>" : "") +
      "</div>" +
      "</li>";
  }).join("");
  section.hidden = false;

  // --- Défilement avec les flèches ---
  section.querySelector(".temoignages-nav").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sens]");
    if (!b) return;
    var carte = liste.querySelector(".temoignage");
    var pas = carte ? carte.getBoundingClientRect().width + 20 : 300;
    liste.scrollBy({ left: pas * Number(b.getAttribute("data-sens")), behavior: "smooth" });
  });

  // --- Lecture de la vidéo dans une fenêtre ---
  function ouvrir(t) {
    var id = idYoutube(t.video);
    lecteur.innerHTML = id
      ? '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="Témoignage de ' + echapper(t.nom) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
      : '<video src="' + echapper(t.video) + '" controls autoplay playsinline' + (t.affiche ? ' poster="' + echapper(t.affiche) + '"' : "") + "></video>";
    dernierFocus = document.activeElement;
    modale.hidden = false;
    document.body.style.overflow = "hidden";
    modale.querySelector(".video-modale-fermer").focus();
  }

  function fermer() {
    lecteur.innerHTML = ""; // arrête la vidéo
    modale.hidden = true;
    document.body.style.overflow = "";
    if (dernierFocus) dernierFocus.focus();
  }

  liste.addEventListener("click", function (e) {
    var b = e.target.closest("[data-index]");
    if (b) ouvrir(TEMOIGNAGES[Number(b.getAttribute("data-index"))]);
  });
  modale.addEventListener("click", function (e) {
    if (e.target.closest("[data-fermer]")) fermer();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modale.hidden) fermer();
  });
}
