// Page de connexion : connexion (clients, admins, collaborateurs) et inscription des clients.
// Après connexion, chacun est envoyé vers son espace : admin.html ou mon-espace.html.

document.addEventListener("DOMContentLoaded", function () {
  var vues = document.querySelectorAll("[data-vue]");
  var onglets = document.querySelectorAll("[data-auth]");

  function afficherVue(nom) {
    vues.forEach(function (v) { v.hidden = v.getAttribute("data-vue") !== nom; });
    onglets.forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-auth") === nom ? "true" : "false"); });
  }
  onglets.forEach(function (b) {
    b.addEventListener("click", function () { afficherVue(b.getAttribute("data-auth")); });
  });
  if (location.hash === "#inscription") afficherVue("inscription");

  function erreur(id, message) {
    var el = document.getElementById(id);
    el.textContent = message || "";
    el.hidden = !message;
  }

  // Redirection vers le bon espace selon le type de compte
  function orienter() {
    return hankaEstAdmin().then(function (admin) {
      var retour = new URLSearchParams(location.search).get("retour");
      location.href = admin ? "admin.html" : (retour && /^[a-z-]+\.html$/.test(retour) ? retour : "mon-espace.html");
    });
  }

  // Déjà connecté : on passe directement à son espace
  hankaSession().then(function (s) { if (s) orienter(); });

  // --- Connexion ---
  document.getElementById("form-connexion").addEventListener("submit", function (e) {
    e.preventDefault();
    erreur("c-erreur", "");
    var bouton = e.target.querySelector("button[type=submit]");
    bouton.disabled = true;
    hankaSb.auth.signInWithPassword({
      email: document.getElementById("c-email").value.trim(),
      password: document.getElementById("c-mdp").value
    }).then(function (res) {
      if (res.error) {
        bouton.disabled = false;
        return erreur("c-erreur", "Email ou mot de passe incorrect.");
      }
      orienter();
    });
  });

  // --- Inscription client ---
  document.getElementById("form-inscription").addEventListener("submit", function (e) {
    e.preventDefault();
    erreur("i-erreur", "");
    var val = function (id) { return document.getElementById(id).value.trim(); };
    var email = val("i-email").toLowerCase();
    var mdp = document.getElementById("i-mdp").value;

    if (!val("i-nom") || !val("i-prenom")) return erreur("i-erreur", "Merci d'indiquer votre nom et votre prénom.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return erreur("i-erreur", "L'adresse email n'est pas valide.");
    if (val("i-telephone") && !/^\+?[0-9 ]{8,20}$/.test(val("i-telephone"))) return erreur("i-erreur", "Le numéro de téléphone n'est pas valide.");
    if (mdp.length < 8) return erreur("i-erreur", "Le mot de passe doit faire au moins 8 caractères.");
    if (mdp !== document.getElementById("i-mdp2").value) return erreur("i-erreur", "Les deux mots de passe ne correspondent pas.");

    var bouton = e.target.querySelector("button[type=submit]");
    bouton.disabled = true;
    bouton.textContent = "Création du compte...";

    fetch(HANKA_CONFIG.supabaseUrl + "/functions/v1/inscription-client", {
      method: "POST",
      headers: hankaEntetes(null),
      body: JSON.stringify({
        nom: val("i-nom"),
        prenom: val("i-prenom"),
        telephone: val("i-telephone"),
        email: email,
        mot_de_passe: mdp,
        site_web: val("i-site")
      })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.d.ok) throw new Error((res.d && res.d.erreur) || "Inscription impossible.");
        return hankaSb.auth.signInWithPassword({ email: email, password: mdp });
      })
      .then(function (res) {
        if (res.error) throw new Error("Compte créé : connectez-vous avec votre email et votre mot de passe.");
        orienter();
      })
      .catch(function (err) {
        erreur("i-erreur", err.message);
        bouton.disabled = false;
        bouton.textContent = "Créer mon compte";
      });
  });
});
