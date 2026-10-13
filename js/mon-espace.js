// Espace client : liste des demandes du client connecté (création / modification),
// suivi du statut et dépôt de documents (stockage privé « documents »).

document.addEventListener("DOMContentLoaded", function () {
  var STATUTS = {
    nouveau: { nom: "Reçue", aide: "Votre demande a bien été reçue. Nous vous contactons rapidement." },
    en_cours: { nom: "En cours", aide: "HANKA GROUP traite votre dossier." },
    traite: { nom: "Terminée", aide: "Votre démarche est finalisée." },
    annule: { nom: "Annulée", aide: "Cette demande a été annulée." }
  };
  var TYPES_FICHIERS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  var TAILLE_MAX = 10 * 1024 * 1024;

  var conteneur = document.getElementById("espace-demandes");
  var erreurEl = document.getElementById("espace-erreur");
  var session = null;
  var documents = [];

  function echapper(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function erreur(message) {
    erreurEl.textContent = message || "";
    erreurEl.hidden = !message;
  }
  function taille(octets) {
    return octets > 1048576 ? (octets / 1048576).toFixed(1).replace(".", ",") + " Mo" : Math.ceil(octets / 1024) + " Ko";
  }

  // --- Accès : connecté obligatoire ; les admins vont dans leur espace ---
  hankaSession().then(function (s) {
    if (!s) { location.href = "connexion.html?retour=mon-espace.html"; return; }
    session = s;
    return hankaEstAdmin().then(function (admin) {
      if (admin) { location.href = "admin.html"; return; }
      var meta = s.user.user_metadata || {};
      document.getElementById("espace-bonjour").textContent = "Bonjour " + (meta.prenom || "");
      document.getElementById("espace-compte").textContent = s.user.email + (meta.telephone ? " · " + meta.telephone : "");
      document.getElementById("espace-chargement").hidden = true;
      document.getElementById("espace").hidden = false;
      charger();
    });
  });

  document.getElementById("btn-deconnexion").addEventListener("click", function () {
    hankaSb.auth.signOut().then(function () { location.href = "index.html"; });
  });

  // --- Chargement des demandes et des documents ---
  function charger() {
    erreur("");
    var uid = session.user.id;
    Promise.all([
      hankaSb.from("demandes_creation").select("*").eq("client_id", uid),
      hankaSb.from("demandes_modification").select("*").eq("client_id", uid),
      hankaSb.from("documents").select("*").eq("client_id", uid).order("created_at")
    ]).then(function (res) {
      var err = res.filter(function (r) { return r.error; })[0];
      if (err) return erreur("Impossible de charger vos demandes : " + err.error.message);
      documents = res[2].data || [];
      var demandes = res[0].data.map(function (d) { d.type = "creation"; return d; })
        .concat(res[1].data.map(function (d) { d.type = "modification"; return d; }))
        .sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      document.getElementById("espace-vide").hidden = demandes.length > 0;
      conteneur.innerHTML = demandes.map(carte).join("");
    });
  }

  function carte(d) {
    var statut = STATUTS[d.statut] || { nom: d.statut, aide: "" };
    var date = new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    var details = d.type === "creation"
      ? [
          ["Forme juridique", d.forme_juridique],
          ["Ville", d.ville],
          d.pack ? ["Pack", PACKS[d.pack].nom] : null,
          ["Prix", formaterFCFA(d.prix)]
        ]
      : [
          ["Forme actuelle", d.forme_actuelle],
          ["À modifier", (d.changements || []).map(function (c) { return CHANGEMENTS_POSSIBLES[c] ? CHANGEMENTS_POSSIBLES[c].nom : c; }).join(", ")],
          ["Tarif", "Sur devis"]
        ];
    var docs = documents.filter(function (x) { return x.demande_type === d.type && x.demande_id === d.id; });
    var cloturee = d.statut === "traite" || d.statut === "annule";

    return '<article class="espace-demande statut-' + d.statut + '">' +
      '<div class="espace-demande-tete">' +
        "<div><h3>" + (d.type === "creation" ? "Création d'entreprise" : "Modification d'entreprise") + "</h3>" +
        '<p class="admin-sub">Référence ' + (d.type === "creation" ? "#" : "M") + d.numero + " · envoyée le " + date + "</p></div>" +
        '<span class="espace-statut" title="' + echapper(statut.aide) + '">' + statut.nom + "</span>" +
      "</div>" +
      '<p class="espace-statut-aide">' + echapper(statut.aide) + "</p>" +
      '<dl class="espace-details">' + details.filter(Boolean).map(function (l) {
        return "<div><dt>" + l[0] + "</dt><dd>" + echapper(l[1]) + "</dd></div>";
      }).join("") + "</dl>" +
      '<div class="espace-docs">' +
        "<h4>Mes documents" + (docs.length ? " (" + docs.length + ")" : "") + "</h4>" +
        (docs.length ? "<ul>" + docs.map(function (doc) {
          return "<li><span>📄 " + echapper(doc.nom_fichier) + ' <small>' + taille(doc.taille) + "</small></span>" +
            '<span class="espace-doc-actions"><button type="button" class="lien-bouton" data-voir="' + doc.id + '">Voir</button>' +
            (cloturee ? "" : '<button type="button" class="lien-bouton lien-danger" data-supprimer="' + doc.id + '">Supprimer</button>') +
            "</span></li>";
        }).join("") + "</ul>" : '<p class="form-note">Aucun document pour le moment.</p>') +
        (cloturee ? "" :
          '<label class="espace-depot">' +
            '<input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" data-depot="' + d.type + ":" + d.id + '">' +
            "<span>＋ Ajouter des documents</span>" +
          "</label>" +
          '<p class="form-note">Pièce d\'identité, justificatif de domicile, statuts actuels... PDF ou photo, 10 Mo maximum par fichier.</p>') +
        '<p class="espace-depot-etat" data-etat="' + d.id + '" hidden></p>' +
      "</div>" +
    "</article>";
  }

  // --- Dépôt de documents ---
  conteneur.addEventListener("change", function (e) {
    var champ = e.target.closest("[data-depot]");
    if (!champ || !champ.files.length) return;
    var parts = champ.getAttribute("data-depot").split(":");
    var type = parts[0], id = parts[1];
    var etat = conteneur.querySelector('[data-etat="' + id + '"]');
    var fichiers = Array.prototype.slice.call(champ.files);

    var refuse = fichiers.filter(function (f) { return TYPES_FICHIERS.indexOf(f.type) === -1 || f.size > TAILLE_MAX; });
    if (refuse.length) {
      etat.textContent = "Fichier refusé : " + refuse.map(function (f) { return f.name; }).join(", ") + " (PDF, JPG, PNG ou WebP, 10 Mo maximum).";
      etat.hidden = false;
      champ.value = "";
      return;
    }

    champ.disabled = true;
    etat.textContent = "Envoi de " + fichiers.length + " document(s)...";
    etat.hidden = false;

    var envois = fichiers.map(function (f) {
      var propre = f.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80);
      var chemin = session.user.id + "/" + type + "-" + id + "/" + Date.now() + "-" + propre;
      return hankaSb.storage.from("documents").upload(chemin, f, { contentType: f.type }).then(function (r) {
        if (r.error) throw new Error(f.name + " : " + r.error.message);
        return hankaSb.from("documents").insert({
          client_id: session.user.id,
          demande_type: type,
          demande_id: id,
          nom_fichier: f.name.slice(0, 200),
          chemin: chemin,
          taille: f.size,
          type_mime: f.type
        }).then(function (r2) {
          if (r2.error) {
            hankaSb.storage.from("documents").remove([chemin]);
            throw new Error(f.name + " : " + r2.error.message);
          }
        });
      });
    });

    Promise.all(envois).then(charger).catch(function (err) {
      etat.textContent = "Envoi impossible — " + err.message;
      champ.disabled = false;
    });
  });

  // --- Voir / supprimer un document ---
  conteneur.addEventListener("click", function (e) {
    var voir = e.target.closest("[data-voir]");
    var suppr = e.target.closest("[data-supprimer]");
    if (!voir && !suppr) return;
    var idDoc = voir ? voir.getAttribute("data-voir") : suppr.getAttribute("data-supprimer");
    var doc = documents.filter(function (x) { return x.id === idDoc; })[0];
    if (!doc) return;

    if (voir) {
      // Ouvre la fenêtre tout de suite (évite le blocage des fenêtres surgissantes), puis y charge le lien
      var fenetre = window.open("", "_blank");
      hankaSb.storage.from("documents").createSignedUrl(doc.chemin, 300).then(function (r) {
        if (r.error) { if (fenetre) fenetre.close(); return erreur("Document indisponible : " + r.error.message); }
        if (fenetre) fenetre.location = r.data.signedUrl; else location.href = r.data.signedUrl;
      });
      return;
    }

    // Suppression en deux clics
    if (suppr.getAttribute("data-confirmer") !== "1") {
      suppr.setAttribute("data-confirmer", "1");
      suppr.textContent = "Confirmer ?";
      return;
    }
    suppr.disabled = true;
    hankaSb.storage.from("documents").remove([doc.chemin]).then(function () {
      return hankaSb.from("documents").delete().eq("id", doc.id);
    }).then(function (r) {
      if (r && r.error) return erreur("Suppression impossible : " + r.error.message);
      charger();
    });
  });
});
