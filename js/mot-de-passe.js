// Mot de passe oublié : envoi du lien de réinitialisation par email (Supabase Auth),
// puis choix du nouveau mot de passe quand on revient par ce lien.

// Lu tout de suite : Supabase efface l'adresse après avoir lu le lien
var hankaRetourLien = new URLSearchParams(location.hash.slice(1));

document.addEventListener("DOMContentLoaded", function () {
  var formDemande = document.getElementById("form-demande");
  var formNouveau = document.getElementById("form-nouveau");

  function message(id, texte) {
    var el = document.getElementById(id);
    el.textContent = texte || "";
    el.hidden = !texte;
  }

  // Les collaborateurs ne réinitialisent pas eux-mêmes leur mot de passe : c'est l'administrateur principal qui le fait
  function afficherNouveau(session) {
    hankaSb.from("admins").select("role").ilike("email", session.user.email).maybeSingle().then(function (r) {
      if (r.data && r.data.role === "collaborateur") {
        hankaSb.auth.signOut();
        formDemande.hidden = false;
        formNouveau.hidden = true;
        return message("d-erreur", "Votre mot de passe de collaborateur est géré par l'administratrice principale de HANKA GROUP. Demandez-lui de vous en attribuer un nouveau.");
      }
      afficherFormulaireNouveau(session);
    });
  }

  function afficherFormulaireNouveau(session) {
    formDemande.hidden = true;
    formNouveau.hidden = false;
    document.getElementById("n-compte").textContent = "Compte : " + session.user.email + ". Choisissez votre nouveau mot de passe.";
  }

  // Lien expiré ou déjà utilisé
  if (hankaRetourLien.get("error")) {
    message("d-erreur", "Ce lien n'est plus valable (il expire au bout d'une heure et ne sert qu'une fois). Demandez-en un nouveau ci-dessous.");
  }

  // Arrivée par le lien reçu par email
  hankaSb.auth.onAuthStateChange(function (evt, session) {
    if (evt === "PASSWORD_RECOVERY" && session) afficherNouveau(session);
  });
  if (hankaRetourLien.get("type") === "recovery") {
    hankaSession().then(function (s) { if (s) afficherNouveau(s); });
  }

  // --- 1. Demande du lien ---
  var params = new URLSearchParams(location.search);
  if (params.get("email")) document.getElementById("d-email").value = params.get("email");

  formDemande.addEventListener("submit", function (e) {
    e.preventDefault();
    message("d-erreur", "");
    message("d-succes", "");
    var email = document.getElementById("d-email").value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return message("d-erreur", "L'adresse email n'est pas valide.");

    var bouton = formDemande.querySelector("button[type=submit]");
    bouton.disabled = true;
    hankaSb.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + location.pathname.replace(/[^/]*$/, "") + "mot-de-passe.html"
    }).then(function (res) {
      bouton.disabled = false;
      if (res.error && /rate|seconds/i.test(res.error.message)) {
        return message("d-erreur", "Trop de demandes rapprochées. Patientez une minute puis réessayez.");
      }
      if (res.error) return message("d-erreur", "Envoi impossible pour le moment. Réessayez plus tard ou appelez-nous au +225 01 72 97 64 18.");
      // Même message que le compte existe ou non (on ne révèle pas quels emails sont inscrits)
      message("d-succes", "Si un compte existe pour " + email + ", un email vient de lui être envoyé. Ouvrez-le et cliquez sur le lien (pensez à regarder dans les spams).");
    });
  });

  // --- 2. Nouveau mot de passe ---
  formNouveau.addEventListener("submit", function (e) {
    e.preventDefault();
    message("n-erreur", "");
    var mdp = document.getElementById("n-mdp").value;
    if (mdp.length < 8) return message("n-erreur", "Le mot de passe doit faire au moins 8 caractères.");
    if (mdp !== document.getElementById("n-mdp2").value) return message("n-erreur", "Les deux mots de passe ne correspondent pas.");

    var bouton = formNouveau.querySelector("button[type=submit]");
    bouton.disabled = true;
    hankaSb.auth.updateUser({ password: mdp, data: { doit_changer_mdp: false } }).then(function (res) {
      if (res.error) {
        bouton.disabled = false;
        return message("n-erreur", /different|same/i.test(res.error.message)
          ? "Le nouveau mot de passe doit être différent de l'ancien."
          : "Modification impossible : " + res.error.message);
      }
      hankaEstAdmin().then(function (admin) {
        location.href = admin ? "admin.html" : "mon-espace.html";
      });
    });
  });
});
