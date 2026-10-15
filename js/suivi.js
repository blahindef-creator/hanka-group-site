// Suivi d'une demande sans compte : référence + téléphone ou email (fonction suivre_demande en base).

document.addEventListener("DOMContentLoaded", function () {
  var sb = window.supabase.createClient(HANKA_CONFIG.supabaseUrl, HANKA_CONFIG.supabaseAnonKey);
  var form = document.getElementById("form-suivi");
  var resultat = document.getElementById("s-resultat");
  var erreur = document.getElementById("s-erreur");

  var ETAPES = ["nouveau", "en_cours", "traite"];
  var STATUTS = {
    nouveau: { nom: "Reçue", aide: "Votre demande a bien été reçue. Nous vous contactons rapidement." },
    en_cours: { nom: "En cours", aide: "HANKA GROUP traite votre dossier." },
    traite: { nom: "Terminée", aide: "Votre démarche est finalisée." },
    annule: { nom: "Annulée", aide: "Cette demande a été annulée. Pour toute question, appelez-nous au +225 01 72 97 64 18." }
  };
  var TITRES = {
    creation: "Création d'entreprise",
    modification: "Modification d'entreprise",
    contact: "Message envoyé via le formulaire de contact"
  };

  function echapper(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Lien depuis l'écran de confirmation : suivi.html?ref=M3
  var params = new URLSearchParams(location.search);
  if (params.get("ref")) document.getElementById("s-ref").value = params.get("ref");

  function details(d) {
    if (d.type === "creation") {
      return [
        ["Forme juridique", d.forme_juridique],
        ["Ville", d.ville],
        d.pack && PACKS[d.pack] ? ["Pack", PACKS[d.pack].nom] : null,
        ["Prix", formaterFCFA(d.prix)]
      ];
    }
    if (d.type === "modification") {
      return [
        ["Forme actuelle", d.forme_actuelle],
        ["À modifier", (d.changements || []).map(function (c) { return CHANGEMENTS_POSSIBLES[c] ? CHANGEMENTS_POSSIBLES[c].nom : c; }).join(", ")]
      ];
    }
    return [["Service", d.service || "—"]];
  }

  // Frise Reçue → En cours → Terminée (ou mention Annulée)
  function frise(statut) {
    if (statut === "annule") return "";
    var atteint = ETAPES.indexOf(statut);
    return '<ol class="suivi-etapes">' + ETAPES.map(function (e, i) {
      return '<li class="' + (i <= atteint ? "fait" : "") + (i === atteint ? " actuel" : "") + '">' + STATUTS[e].nom + "</li>";
    }).join("") + "</ol>";
  }

  function afficher(d) {
    var statut = STATUTS[d.statut] || { nom: d.statut, aide: "" };
    var date = new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    resultat.innerHTML =
      '<article class="espace-demande statut-' + echapper(d.statut) + '">' +
        '<div class="espace-demande-tete">' +
          "<div><h2>" + echapper(TITRES[d.type]) + "</h2>" +
          '<p class="admin-sub">Référence ' + echapper(d.reference) + " · envoyée le " + date + "</p></div>" +
          '<span class="espace-statut">' + echapper(statut.nom) + "</span>" +
        "</div>" +
        frise(d.statut) +
        '<p class="espace-statut-aide">' + echapper(statut.aide) + "</p>" +
        '<dl class="espace-details">' + details(d).filter(Boolean).map(function (l) {
          return "<dt>" + echapper(l[0]) + "</dt><dd>" + echapper(l[1]) + "</dd>";
        }).join("") + "</dl>" +
      "</article>" +
      '<p class="auth-aide"><button type="button" class="lien-bouton" id="s-autre">Suivre une autre demande</button></p>';
    form.hidden = true;
    resultat.hidden = false;
    document.getElementById("s-autre").addEventListener("click", function () {
      resultat.hidden = true;
      form.hidden = false;
      form.reset();
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    erreur.hidden = true;
    var ref = document.getElementById("s-ref").value.trim();
    var contact = document.getElementById("s-contact").value.trim();
    if (!ref || !contact) {
      erreur.textContent = "Merci d'indiquer la référence et votre téléphone ou email.";
      erreur.hidden = false;
      return;
    }
    var bouton = form.querySelector("button[type=submit]");
    bouton.disabled = true;
    sb.rpc("suivre_demande", { p_reference: ref, p_contact: contact }).then(function (res) {
      bouton.disabled = false;
      if (res.error) {
        erreur.textContent = "Le suivi est momentanément indisponible. Réessayez plus tard ou appelez-nous au +225 01 72 97 64 18.";
        erreur.hidden = false;
        return;
      }
      if (!res.data) {
        erreur.textContent = "Aucune demande ne correspond. Vérifiez la référence et utilisez le même téléphone ou email que lors de votre demande.";
        erreur.hidden = false;
        return;
      }
      afficher(res.data);
    });
  });
});
