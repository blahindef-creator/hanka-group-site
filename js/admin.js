// Espace admin : connexion (email + mot de passe Supabase) et suivi des demandes.
// La base n'autorise la lecture qu'aux emails listés dans la table « admins ».

document.addEventListener("DOMContentLoaded", function () {
  var sb = window.supabase.createClient(HANKA_CONFIG.supabaseUrl, HANKA_CONFIG.supabaseAnonKey);

  var STATUTS = { nouveau: "Nouvelle", en_cours: "En cours", traite: "Traitée", annule: "Annulée" };
  var demandes = [];
  var filtre = "";

  var vueConnexion = document.getElementById("vue-connexion");
  var vueDemandes = document.getElementById("vue-demandes");
  var btnDeconnexion = document.getElementById("btn-deconnexion");
  var corps = document.getElementById("liste-demandes");
  var erreurDemandes = document.getElementById("erreur-demandes");

  function echapper(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var onglets = document.getElementById("admin-onglets");
  var vues = {
    demandes: vueDemandes,
    compte: document.getElementById("vue-compte"),
    collaborateurs: document.getElementById("vue-collaborateurs")
  };
  var utilisateurCourant = null;
  var estPrincipal = false;

  function afficherOnglet(nom) {
    Object.keys(vues).forEach(function (k) { vues[k].hidden = k !== nom; });
    onglets.querySelectorAll("button").forEach(function (b) {
      if (b.getAttribute("data-onglet") === nom) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (nom === "collaborateurs") chargerAdmins();
  }

  onglets.addEventListener("click", function (e) {
    var b = e.target.closest("[data-onglet]");
    if (b) afficherOnglet(b.getAttribute("data-onglet"));
  });

  function afficher(session) {
    var id = session ? session.user.id : null;
    if (id === utilisateurCourant) return; // simple rafraîchissement du jeton ou mise à jour du profil
    utilisateurCourant = id;

    vueConnexion.hidden = !!session;
    onglets.hidden = !session;
    btnDeconnexion.hidden = !session;
    if (!session) {
      Object.keys(vues).forEach(function (k) { vues[k].hidden = true; });
      document.getElementById("alerte-mdp").hidden = true;
      return;
    }

    var meta = session.user.user_metadata || {};
    document.getElementById("admin-compte").textContent = "Connecté : " + session.user.email;
    document.getElementById("compte-infos").textContent = "Connecté : " + session.user.email + (meta.nom ? " (" + meta.nom + ")" : "");
    document.getElementById("alerte-mdp").hidden = !meta.doit_changer_mdp;

    // Rôle : seul l'administrateur principal voit l'onglet Collaborateurs
    estPrincipal = false;
    document.getElementById("onglet-collaborateurs").hidden = true;
    sb.from("admins").select("role").ilike("email", session.user.email).maybeSingle().then(function (r) {
      estPrincipal = !!(r.data && r.data.role === "principal");
      document.getElementById("onglet-collaborateurs").hidden = !estPrincipal;
      if (!vues.collaborateurs.hidden) {
        if (estPrincipal) chargerAdmins();
        else afficherOnglet("demandes");
      }
    });

    afficherOnglet(meta.doit_changer_mdp ? "compte" : "demandes");
    charger();
  }

  // --- Connexion ---
  document.getElementById("form-connexion").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("erreur-connexion");
    err.hidden = true;
    sb.auth.signInWithPassword({
      email: document.getElementById("admin-email").value.trim(),
      password: document.getElementById("admin-mdp").value
    }).then(function (res) {
      if (res.error) {
        err.textContent = "Email ou mot de passe incorrect.";
        err.hidden = false;
      }
    });
  });

  btnDeconnexion.addEventListener("click", function () { sb.auth.signOut(); });
  sb.auth.onAuthStateChange(function (_evt, session) { afficher(session); });

  // --- Chargement et affichage des demandes ---
  function charger() {
    erreurDemandes.hidden = true;
    sb.from("demandes_creation").select("*").order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) {
          erreurDemandes.textContent = "Impossible de charger les demandes : " + res.error.message;
          erreurDemandes.hidden = false;
          return;
        }
        demandes = res.data || [];
        if (!demandes.length) {
          // Lecture vide : soit aucune demande, soit compte non autorisé
          sb.rpc("est_admin").then(function (r) {
            if (r.data === false) {
              erreurDemandes.textContent = "Ce compte n'a pas accès aux demandes. Contactez l'administrateur du site.";
              erreurDemandes.hidden = false;
            }
          });
        }
        rendre();
      });
  }

  function rendre() {
    document.querySelectorAll(".admin-filtres button").forEach(function (b) {
      var f = b.getAttribute("data-filtre");
      var n = f ? demandes.filter(function (d) { return d.statut === f; }).length : demandes.length;
      b.querySelector("span").textContent = "(" + n + ")";
      b.setAttribute("aria-selected", f === filtre ? "true" : "false");
    });

    var liste = demandes.filter(function (d) { return !filtre || d.statut === filtre; });
    document.getElementById("admin-vide").hidden = liste.length > 0;

    corps.innerHTML = liste.map(function (d) {
      var date = new Date(d.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
      var contact = [
        d.telephone ? '<a href="tel:' + echapper(d.telephone.replace(/\s/g, "")) + '">' + echapper(d.telephone) + "</a>" : "",
        d.email ? '<a href="mailto:' + echapper(d.email) + '">' + echapper(d.email) + "</a>" : ""
      ].filter(Boolean).join("<br>");
      var options = Object.keys(STATUTS).map(function (s) {
        return '<option value="' + s + '"' + (s === d.statut ? " selected" : "") + ">" + STATUTS[s] + "</option>";
      }).join("");
      return '<tr class="statut-' + d.statut + '">' +
        "<td>#" + d.numero + "</td>" +
        "<td>" + date + "</td>" +
        "<td><strong>" + echapper(d.prenom + " " + d.nom) + "</strong></td>" +
        "<td>" + contact + "</td>" +
        "<td>" + echapper(d.forme_juridique) + "</td>" +
        "<td>" + echapper(d.ville) + "</td>" +
        "<td>" + (d.pack ? echapper(PACKS[d.pack].nom) : "—") + "</td>" +
        '<td class="nowrap">' + formaterFCFA(d.prix) + "</td>" +
        '<td><select data-statut="' + d.id + '" aria-label="Statut de la demande ' + d.numero + '">' + options + "</select></td>" +
        '<td><textarea data-note="' + d.id + '" rows="2" placeholder="Note interne...">' + echapper(d.note_admin || "") + "</textarea></td>" +
        "</tr>";
    }).join("");
  }

  document.querySelector(".admin-filtres").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    filtre = b.getAttribute("data-filtre");
    rendre();
  });

  document.getElementById("btn-actualiser").addEventListener("click", charger);

  // --- Export des demandes affichées (filtre en cours respecté) ---
  var LIBS = {
    xlsx: ["https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"],
    pdf: [
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"
    ]
  };
  var COLONNES = ["N°", "Date", "Prénom", "Nom", "Téléphone", "Email", "Forme juridique", "Ville", "Pack", "Prix (FCFA)", "Statut", "Note"];

  function chargerScripts(urls) {
    return urls.reduce(function (p, url) {
      return p.then(function () {
        if (document.querySelector('script[src="' + url + '"]')) return;
        return new Promise(function (ok, ko) {
          var s = document.createElement("script");
          s.src = url;
          s.onload = ok;
          s.onerror = function () { ko(new Error("Chargement impossible : " + url)); };
          document.head.appendChild(s);
        });
      });
    }, Promise.resolve());
  }

  function lignesExport() {
    return demandes
      .filter(function (d) { return !filtre || d.statut === filtre; })
      .map(function (d) {
        return [
          d.numero,
          new Date(d.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
          d.prenom,
          d.nom,
          d.telephone || "",
          d.email || "",
          d.forme_juridique,
          d.ville,
          d.pack ? PACKS[d.pack].nom : "",
          d.prix,
          STATUTS[d.statut] || d.statut,
          d.note_admin || ""
        ];
      });
  }

  function nomFichier(ext) {
    var jour = new Date().toISOString().slice(0, 10);
    return "demandes-hanka" + (filtre ? "-" + filtre : "") + "-" + jour + "." + ext;
  }

  function telecharger(blob, nom) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  var exporteurs = {
    csv: function (lignes) {
      // Séparateur « ; » et BOM UTF-8 : s'ouvre correctement dans Excel en français
      var cellule = function (v) {
        var s = String(v == null ? "" : v);
        return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      var texte = [COLONNES].concat(lignes).map(function (l) { return l.map(cellule).join(";"); }).join("\r\n");
      telecharger(new Blob(["﻿" + texte], { type: "text/csv;charset=utf-8" }), nomFichier("csv"));
    },
    xlsx: function (lignes) {
      return chargerScripts(LIBS.xlsx).then(function () {
        var feuille = XLSX.utils.aoa_to_sheet([COLONNES].concat(lignes));
        feuille["!cols"] = [6, 16, 14, 14, 16, 26, 22, 16, 16, 12, 10, 30].map(function (w) { return { wch: w }; });
        var classeur = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(classeur, feuille, "Demandes");
        XLSX.writeFile(classeur, nomFichier("xlsx"));
      });
    },
    pdf: function (lignes) {
      return chargerScripts(LIBS.pdf).then(function () {
        var doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        var total = lignes.reduce(function (s, l) { return s + l[9]; }, 0);
        doc.setFontSize(16);
        doc.text("HANKA GROUP — Demandes de création d'entreprise", 40, 40);
        doc.setFontSize(9);
        doc.setTextColor(90);
        doc.text(
          "Export du " + new Date().toLocaleString("fr-FR") +
          " · Filtre : " + (filtre ? STATUTS[filtre] : "toutes") +
          " · " + lignes.length + " demande(s) · Total : " + formaterFCFA(total),
          40, 58
        );
        doc.autoTable({
          startY: 72,
          head: [COLONNES],
          body: lignes.map(function (l) {
            var copie = l.slice();
            copie[0] = "#" + copie[0];
            copie[9] = formaterFCFA(copie[9]);
            return copie;
          }),
          styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
          headStyles: { fillColor: [6, 27, 74], textColor: 255 },
          alternateRowStyles: { fillColor: [247, 248, 251] },
          margin: { left: 40, right: 40 }
        });
        doc.save(nomFichier("pdf"));
      });
    }
  };

  document.querySelector(".admin-export").addEventListener("click", function (e) {
    var b = e.target.closest("[data-export]");
    if (!b) return;
    var lignes = lignesExport();
    if (!lignes.length) {
      erreurDemandes.textContent = "Aucune demande à exporter pour ce filtre.";
      erreurDemandes.hidden = false;
      return;
    }
    erreurDemandes.hidden = true;
    b.disabled = true;
    Promise.resolve(exporteurs[b.getAttribute("data-export")](lignes))
      .catch(function (err) {
        erreurDemandes.textContent = "Export impossible : " + err.message;
        erreurDemandes.hidden = false;
      })
      .then(function () { b.disabled = false; });
  });

  // --- Mise à jour du statut et de la note ---
  function enregistrer(id, champs, el) {
    el.disabled = true;
    sb.from("demandes_creation").update(champs).eq("id", id).then(function (res) {
      el.disabled = false;
      if (res.error) {
        erreurDemandes.textContent = "Modification non enregistrée : " + res.error.message;
        erreurDemandes.hidden = false;
        return;
      }
      demandes.forEach(function (d) { if (d.id === id) Object.assign(d, champs); });
      if (champs.statut) rendre();
    });
  }

  corps.addEventListener("change", function (e) {
    var id = e.target.getAttribute("data-statut");
    if (id) enregistrer(id, { statut: e.target.value }, e.target);
    var idNote = e.target.getAttribute("data-note");
    if (idNote) enregistrer(idNote, { note_admin: e.target.value.trim() || null }, e.target);
  });

  // --- Mon compte : changement de mot de passe ---
  document.getElementById("form-mdp").addEventListener("submit", function (e) {
    e.preventDefault();
    var nouveau = document.getElementById("mdp-nouveau").value;
    var confirmation = document.getElementById("mdp-confirmation").value;
    var err = document.getElementById("mdp-erreur");
    var ok = document.getElementById("mdp-succes");
    err.hidden = true;
    ok.hidden = true;

    if (nouveau.length < 8) { err.textContent = "Le mot de passe doit faire au moins 8 caractères."; err.hidden = false; return; }
    if (nouveau !== confirmation) { err.textContent = "Les deux mots de passe ne correspondent pas."; err.hidden = false; return; }

    var bouton = e.target.querySelector("button[type=submit]");
    bouton.disabled = true;
    sb.auth.updateUser({ password: nouveau, data: { doit_changer_mdp: false } }).then(function (res) {
      bouton.disabled = false;
      if (res.error) {
        err.textContent = /different|same/i.test(res.error.message)
          ? "Le nouveau mot de passe doit être différent de l'ancien."
          : "Modification impossible : " + res.error.message;
        err.hidden = false;
        return;
      }
      e.target.reset();
      ok.hidden = false;
      document.getElementById("alerte-mdp").hidden = true;
    });
  });

  // --- Collaborateurs (administrateur principal) ---
  var listeAdmins = document.getElementById("liste-admins");
  var erreurCollab = document.getElementById("collab-erreur");

  function appelerGestion(corpsRequete) {
    return sb.functions.invoke("gerer-admins", { body: corpsRequete }).then(function (res) {
      if (res.error) {
        // Le message d'erreur précis est dans le corps de la réponse
        var ctx = res.error.context;
        return (ctx && ctx.json ? ctx.json() : Promise.resolve({})).then(function (d) {
          throw new Error((d && d.erreur) || res.error.message);
        });
      }
      return res.data;
    });
  }

  function chargerAdmins() {
    if (!estPrincipal) return;
    erreurCollab.hidden = true;
    appelerGestion({ action: "lister" }).then(function (d) {
      listeAdmins.innerHTML = d.admins.map(function (a) {
        var principal = a.role === "principal";
        return "<tr>" +
          "<td>" + echapper(a.nom || "—") + "</td>" +
          "<td>" + echapper(a.email) + "</td>" +
          "<td>" + (principal ? "Administrateur principal" : "Collaborateur") + "</td>" +
          "<td>" + new Date(a.created_at).toLocaleDateString("fr-FR") + "</td>" +
          "<td>" + (principal ? "" : '<button type="button" class="btn btn-ghost btn-petit" data-retirer="' + echapper(a.email) + '">Retirer</button>') + "</td>" +
          "</tr>";
      }).join("");
    }).catch(function (err) {
      erreurCollab.textContent = "Impossible de charger les comptes : " + err.message;
      erreurCollab.hidden = false;
    });
  }

  listeAdmins.addEventListener("click", function (e) {
    var b = e.target.closest("[data-retirer]");
    if (!b) return;
    var email = b.getAttribute("data-retirer");
    // Confirmation en deux clics, sans boîte de dialogue
    if (b.getAttribute("data-confirmer") !== "1") {
      b.setAttribute("data-confirmer", "1");
      b.textContent = "Confirmer le retrait ?";
      b.classList.add("btn-danger");
      return;
    }
    b.disabled = true;
    appelerGestion({ action: "retirer", email: email }).then(chargerAdmins).catch(function (err) {
      erreurCollab.textContent = "Retrait impossible : " + err.message;
      erreurCollab.hidden = false;
      b.disabled = false;
    });
  });

  document.getElementById("btn-generer-mdp").addEventListener("click", function () {
    var lettres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    var octets = new Uint32Array(12);
    window.crypto.getRandomValues(octets);
    document.getElementById("collab-mdp").value = "Hanka-" + Array.prototype.map.call(octets, function (n) {
      return lettres[n % lettres.length];
    }).join("");
  });

  document.getElementById("form-collab").addEventListener("submit", function (e) {
    e.preventDefault();
    var succes = document.getElementById("collab-succes");
    succes.hidden = true;
    erreurCollab.hidden = true;
    var nom = document.getElementById("collab-nom").value.trim();
    var email = document.getElementById("collab-email").value.trim().toLowerCase();
    var mdp = document.getElementById("collab-mdp").value;
    var bouton = e.target.querySelector("button[type=submit]");
    bouton.disabled = true;

    appelerGestion({ action: "creer", nom: nom, email: email, mot_de_passe: mdp }).then(function (d) {
      succes.innerHTML = d.compte_existant
        ? "Accès admin donné à <strong>" + echapper(email) + "</strong> (compte déjà existant : son mot de passe actuel reste valable)."
        : "Compte créé. Identifiants à transmettre :<br>Email : <strong>" + echapper(email) + "</strong><br>Mot de passe provisoire : <strong>" + echapper(mdp) + "</strong><br>Adresse : " + echapper(location.href.split("#")[0]);
      succes.hidden = false;
      e.target.reset();
      chargerAdmins();
    }).catch(function (err) {
      erreurCollab.textContent = "Création impossible : " + err.message;
      erreurCollab.hidden = false;
    }).then(function () { bouton.disabled = false; });
  });
});
