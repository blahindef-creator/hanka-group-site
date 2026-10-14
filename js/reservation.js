// Formation certifiante : prochaines sessions (publiées par les admins) et réservation
// d'une place via WhatsApp, avec le message déjà rédigé (le client l'envoie lui-même).

document.addEventListener("DOMContentLoaded", function () {
  var NUMERO_WHATSAPP = "2250172976418"; // +225 01 72 97 64 18, sans « + » ni espaces
  var modale = document.getElementById("resa-modale");
  if (!modale) return;

  var champNom = document.getElementById("resa-nom");
  var choixSession = document.getElementById("resa-session");
  var blocSession = document.getElementById("resa-bloc-session");
  var lien = document.getElementById("resa-whatsapp");
  var sessions = [];
  var dernierFocus = null;

  function echapper(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // « du 12 au 14 novembre 2026 », « le 12 novembre 2026 »
  function periode(s) {
    var opts = { day: "numeric", month: "long", year: "numeric" };
    var debut = new Date(s.date_debut + "T12:00:00");
    if (!s.date_fin || s.date_fin === s.date_debut) return "le " + debut.toLocaleDateString("fr-FR", opts);
    var fin = new Date(s.date_fin + "T12:00:00");
    var memeMois = debut.getMonth() === fin.getMonth() && debut.getFullYear() === fin.getFullYear();
    return "du " + (memeMois ? debut.getDate() : debut.toLocaleDateString("fr-FR", opts)) + " au " + fin.toLocaleDateString("fr-FR", opts);
  }

  function libelle(s) {
    return periode(s) + (s.horaires ? ", " + s.horaires : "") + (s.lieu ? " — " + s.lieu : "");
  }

  // --- Prochaines sessions publiées ---
  if (typeof HANKA_CONFIG !== "undefined") {
    var aujourdhui = new Date().toISOString().slice(0, 10);
    fetch(HANKA_CONFIG.supabaseUrl + "/rest/v1/sessions_formation?select=id,date_debut,date_fin,horaires,lieu,places,note" +
      "&publie=eq.true&or=(date_debut.gte." + aujourdhui + ",date_fin.gte." + aujourdhui + ")&order=date_debut", {
      headers: { apikey: HANKA_CONFIG.supabaseAnonKey, Authorization: "Bearer " + HANKA_CONFIG.supabaseAnonKey }
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (liste) {
        sessions = liste || [];
        afficherSessions();
      })
      .catch(function () { /* on garde le message « dates bientôt annoncées » */ });
  }

  function afficherSessions() {
    var ul = document.getElementById("sessions-liste");
    document.getElementById("sessions-vide").hidden = sessions.length > 0;
    ul.innerHTML = sessions.map(function (s) {
      var debut = new Date(s.date_debut + "T12:00:00");
      return '<li class="session">' +
        '<div class="session-date"><strong>' + debut.getDate() + "</strong><span>" +
          debut.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "") + "</span></div>" +
        '<div class="session-infos"><strong>' + echapper(periode(s).replace(/^./, function (c) { return c.toUpperCase(); })) + "</strong>" +
          (s.horaires ? "<span>🕘 " + echapper(s.horaires) + "</span>" : "") +
          (s.lieu ? "<span>📍 " + echapper(s.lieu) + "</span>" : "") +
          (s.places ? "<span>👥 " + s.places + " places</span>" : "") +
          (s.note ? '<span class="session-note">' + echapper(s.note) + "</span>" : "") +
        "</div>" +
        '<button type="button" class="btn btn-ghost btn-petit" data-ouvrir-reservation data-session="' + s.id + '">Réserver</button>' +
      "</li>";
    }).join("");

    choixSession.innerHTML = sessions.map(function (s) {
      return '<option value="' + s.id + '">' + echapper(libelle(s)) + "</option>";
    }).join("") + '<option value="">Je ne sais pas encore / prochaine session</option>';
    blocSession.hidden = !sessions.length;
  }

  // --- Message WhatsApp ---
  function majLien() {
    var nom = champNom.value.trim();
    var session = sessions.filter(function (s) { return s.id === choixSession.value; })[0];
    var message = "Bonjour HANKA GROUP, je souhaite réserver ma place à la Formation certifiante en marchés publics (réservation : 10 000 FCFA)." +
      (session ? "\nSession : " + libelle(session) : "") +
      (nom ? "\nNom : " + nom : "") +
      "\nMerci de me confirmer ma place et les modalités de paiement.";
    lien.href = "https://wa.me/" + NUMERO_WHATSAPP + "?text=" + encodeURIComponent(message);
  }

  function ouvrir(idSession) {
    dernierFocus = document.activeElement;
    if (sessions.length) choixSession.value = idSession || sessions[0].id;
    majLien();
    modale.hidden = false;
    document.body.style.overflow = "hidden";
    champNom.focus();
  }

  function fermer() {
    modale.hidden = true;
    document.body.style.overflow = "";
    if (dernierFocus) dernierFocus.focus();
  }

  // Boutons « Réserve ta place » (y compris ceux des sessions, ajoutés après chargement)
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ouvrir-reservation]");
    if (b) ouvrir(b.getAttribute("data-session"));
  });
  modale.addEventListener("click", function (e) {
    if (e.target.closest("[data-fermer-reservation]")) fermer();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modale.hidden) fermer();
  });
  champNom.addEventListener("input", majLien);
  choixSession.addEventListener("change", majLien);
  lien.addEventListener("click", majLien);
});
