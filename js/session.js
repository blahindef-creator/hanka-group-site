// Session Supabase partagée par les pages publiques (connexion, espace client, parcours).
// Nécessite supabase-js et js/config.js chargés avant ce fichier.

var hankaSb = window.supabase.createClient(HANKA_CONFIG.supabaseUrl, HANKA_CONFIG.supabaseAnonKey);

// Session en cours (renouvelée automatiquement si besoin), ou null
function hankaSession() {
  return hankaSb.auth.getSession().then(function (r) { return r.data.session; });
}

// true si le compte connecté est un administrateur ou collaborateur
function hankaEstAdmin() {
  return hankaSb.rpc("est_admin").then(function (r) { return r.data === true; });
}

// En-têtes d'appel des fonctions du site : jeton du client connecté, sinon clé publique
function hankaEntetes(session) {
  return {
    "Content-Type": "application/json",
    "apikey": HANKA_CONFIG.supabaseAnonKey,
    "Authorization": "Bearer " + (session ? session.access_token : HANKA_CONFIG.supabaseAnonKey)
  };
}

// Parcours Créer / Modifier : pré-remplit les coordonnées du client connecté
// et indique si la demande sera ajoutée à son espace. Renvoie la session (ou null).
function hankaParcoursCompte() {
  var note = document.getElementById("wizard-connecte");
  var page = location.pathname.split("/").pop() || "index.html";
  return hankaSession().then(function (s) {
    if (!s) {
      if (note) {
        note.innerHTML = 'Vous avez un compte ? <a href="connexion.html?retour=' + page + '">Connectez-vous</a> pour suivre cette demande dans votre espace client.';
        note.hidden = false;
      }
      return null;
    }
    var meta = s.user.user_metadata || {};
    var remplir = function (id, valeur) {
      var champ = document.getElementById(id);
      if (champ && !champ.value && valeur) champ.value = valeur;
    };
    remplir("nom", meta.nom);
    remplir("prenom", meta.prenom);
    remplir("telephone", meta.telephone);
    remplir("email", s.user.email);
    if (note) {
      note.textContent = "Connecté en tant que " + s.user.email + " : cette demande sera ajoutée à votre espace client.";
      note.classList.add("wizard-connecte-ok");
      note.hidden = false;
    }
    return s;
  });
}

// Écran final des parcours : lien vers l'espace client, ou invitation à créer un compte
function hankaFinParcours(rattacheeAuCompte) {
  var el = document.getElementById("done-compte");
  if (!el) return;
  el.innerHTML = rattacheeAuCompte
    ? 'Suivez son avancement et déposez vos documents dans <a href="mon-espace.html">votre espace client</a>.'
    : 'Pour suivre vos prochaines demandes en ligne, <a href="connexion.html#inscription">créez votre espace client</a>.';
  el.hidden = false;
}
