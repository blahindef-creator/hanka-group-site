// Espace admin : connexion (email + mot de passe Supabase) et suivi des demandes.
// La base n'autorise la lecture qu'aux emails listés dans la table « admins ».

document.addEventListener("DOMContentLoaded", function () {
  var sb = window.supabase.createClient(HANKA_CONFIG.supabaseUrl, HANKA_CONFIG.supabaseAnonKey);

  var STATUTS = { nouveau: "Nouvelle", en_cours: "En cours", traite: "Traitée", annule: "Annulée" };
  var demandes = [];
  var filtre = "";

  function nomsChangements(d) {
    return (d.changements || []).map(function (c) {
      return CHANGEMENTS_POSSIBLES[c] ? CHANGEMENTS_POSSIBLES[c].nom : c;
    }).join(", ");
  }

  // Les deux types de demandes : colonnes propres à chacun (affichage et exports)
  var TYPES = {
    creation: {
      table: "demandes_creation",
      prefixe: "#",
      titre: "Demandes de création d'entreprise",
      fichier: "creations",
      entetes: ["Forme", "Ville", "Pack", "Prix"],
      cellules: function (d) {
        return [
          echapper(d.forme_juridique),
          echapper(d.ville),
          d.pack ? echapper(PACKS[d.pack].nom) : "—",
          '<span class="nowrap">' + formaterFCFA(d.prix) + "</span>"
        ];
      },
      colonnesExport: ["Forme juridique", "Ville", "Pack", "Prix (FCFA)"],
      largeursExport: [22, 16, 16, 12],
      valeursExport: function (d) {
        return [d.forme_juridique, d.ville, d.pack ? PACKS[d.pack].nom : "", d.prix];
      }
    },
    modification: {
      table: "demandes_modification",
      prefixe: "M",
      titre: "Demandes de modification d'entreprise",
      fichier: "modifications",
      entetes: ["Forme actuelle", "À modifier", "Explication"],
      cellules: function (d) {
        return [
          echapper(d.forme_actuelle),
          echapper(nomsChangements(d)),
          '<div class="cellule-texte">' + echapper(d.commentaire).replace(/\n/g, "<br>") + "</div>"
        ];
      },
      colonnesExport: ["Forme actuelle", "À modifier", "Explication"],
      largeursExport: [20, 28, 50],
      valeursExport: function (d) {
        return [d.forme_actuelle, nomsChangements(d), d.commentaire];
      }
    }
  };
  var typeCourant = "creation";
  function type() { return TYPES[typeCourant]; }

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
    formations: document.getElementById("vue-formations"),
    temoignages: document.getElementById("vue-temoignages"),
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
    if (nom === "temoignages") chargerTemoignages();
    if (nom === "formations") chargerSessions();
  }

  onglets.addEventListener("click", function (e) {
    var b = e.target.closest("[data-onglet]");
    if (b) afficherOnglet(b.getAttribute("data-onglet"));
  });

  function afficher(session) {
    var id = session ? session.user.id : null;
    if (id === utilisateurCourant) return; // simple rafraîchissement du jeton ou mise à jour du profil
    utilisateurCourant = id;

    if (!session) return afficherEspace(null);
    // Seuls les admins et collaborateurs entrent ici ; un compte client va dans son espace
    vueConnexion.hidden = true;
    sb.rpc("est_admin").then(function (r) {
      if (r.data === true) afficherEspace(session);
      else location.replace("mon-espace.html");
    });
  }

  function afficherEspace(session) {
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
  // Nombre de nouvelles demandes de chaque type, affiché sur les boutons Créations / Modifications
  function compterNouvelles() {
    Object.keys(TYPES).forEach(function (cle) {
      sb.from(TYPES[cle].table).select("id", { count: "exact", head: true }).eq("statut", "nouveau")
        .then(function (r) {
          var span = document.querySelector('[data-type="' + cle + '"] span');
          if (span) span.textContent = r.count ? r.count + " nouvelle(s)" : "";
        });
    });
  }

  function charger() {
    erreurDemandes.hidden = true;
    document.getElementById("titre-demandes").textContent = type().titre;
    document.querySelectorAll(".admin-types button").forEach(function (b) {
      b.setAttribute("aria-selected", b.getAttribute("data-type") === typeCourant ? "true" : "false");
    });
    compterNouvelles();
    var typeCharge = typeCourant;
    sb.from(type().table).select("*").order("created_at", { ascending: false })
      .then(function (res) {
        if (typeCharge !== typeCourant) return; // l'utilisateur a changé de type entre-temps
        if (res.error) {
          erreurDemandes.textContent = "Impossible de charger les demandes : " + res.error.message;
          erreurDemandes.hidden = false;
          return;
        }
        demandes = res.data || [];
        rendre();
        chargerDocuments(typeCharge);
      });
  }

  // Documents déposés par les clients sur les demandes affichées
  var documentsParDemande = {};
  function chargerDocuments(typeCharge) {
    documentsParDemande = {};
    var ids = demandes.map(function (d) { return d.id; });
    if (!ids.length) return;
    sb.from("documents").select("id, demande_id, nom_fichier, chemin, taille")
      .eq("demande_type", typeCharge).in("demande_id", ids).order("created_at")
      .then(function (res) {
        if (res.error || typeCharge !== typeCourant) return;
        res.data.forEach(function (doc) {
          (documentsParDemande[doc.demande_id] = documentsParDemande[doc.demande_id] || []).push(doc);
        });
        rendre();
      });
  }

  function celluleDocuments(d) {
    var docs = documentsParDemande[d.id] || [];
    var compte = d.client_id ? '<span class="badge-compte" title="Demande envoyée depuis un compte client">Compte client</span>' : "";
    if (!docs.length) return compte || '<span class="admin-sub">—</span>';
    return compte + '<ul class="admin-docs">' + docs.map(function (doc) {
      return '<li><button type="button" class="lien-bouton" data-doc="' + echapper(doc.chemin) + '">📄 ' + echapper(doc.nom_fichier) + "</button></li>";
    }).join("") + "</ul>";
  }

  // Ouverture d'un document (lien temporaire de 5 minutes, stockage privé)
  document.getElementById("liste-demandes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-doc]");
    if (!b) return;
    var fenetre = window.open("", "_blank");
    sb.storage.from("documents").createSignedUrl(b.getAttribute("data-doc"), 300).then(function (r) {
      if (r.error) {
        if (fenetre) fenetre.close();
        erreurDemandes.textContent = "Document indisponible : " + r.error.message;
        erreurDemandes.hidden = false;
        return;
      }
      if (fenetre) fenetre.location = r.data.signedUrl; else location.href = r.data.signedUrl;
    });
  });

  function rendre() {
    document.querySelectorAll(".admin-filtres button").forEach(function (b) {
      var f = b.getAttribute("data-filtre");
      var n = f ? demandes.filter(function (d) { return d.statut === f; }).length : demandes.length;
      b.querySelector("span").textContent = "(" + n + ")";
      b.setAttribute("aria-selected", f === filtre ? "true" : "false");
    });

    var liste = demandes.filter(function (d) { return !filtre || d.statut === filtre; });
    document.getElementById("admin-vide").hidden = liste.length > 0;

    document.getElementById("entete-demandes").innerHTML = "<tr>" +
      ["N°", "Date", "Client", "Contact", "Documents"].concat(type().entetes, ["Statut", "Note"])
        .map(function (t) { return "<th>" + t + "</th>"; }).join("") + "</tr>";

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
        "<td>" + type().prefixe + d.numero + "</td>" +
        "<td>" + date + "</td>" +
        "<td><strong>" + echapper(d.prenom + " " + d.nom) + "</strong></td>" +
        "<td>" + contact + "</td>" +
        "<td>" + celluleDocuments(d) + "</td>" +
        type().cellules(d).map(function (c) { return "<td>" + c + "</td>"; }).join("") +
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

  document.querySelector(".admin-types").addEventListener("click", function (e) {
    var b = e.target.closest("[data-type]");
    if (!b || b.getAttribute("data-type") === typeCourant) return;
    typeCourant = b.getAttribute("data-type");
    filtre = "";
    demandes = [];
    rendre();
    charger();
  });

  // --- Export des demandes affichées (filtre en cours respecté) ---
  var LIBS = {
    xlsx: ["https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"],
    pdf: [
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"
    ]
  };
  function colonnesExport() {
    return ["N°", "Date", "Prénom", "Nom", "Téléphone", "Email"].concat(type().colonnesExport, ["Statut", "Note"]);
  }
  function largeursExport() {
    return [6, 16, 14, 14, 16, 26].concat(type().largeursExport, [10, 30]);
  }

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
          type().prefixe + d.numero,
          new Date(d.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
          d.prenom,
          d.nom,
          d.telephone || "",
          d.email || ""
        ].concat(type().valeursExport(d), [
          STATUTS[d.statut] || d.statut,
          d.note_admin || ""
        ]);
      });
  }

  function nomFichier(ext) {
    var jour = new Date().toISOString().slice(0, 10);
    return "demandes-hanka-" + type().fichier + (filtre ? "-" + filtre : "") + "-" + jour + "." + ext;
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
      var texte = [colonnesExport()].concat(lignes).map(function (l) { return l.map(cellule).join(";"); }).join("\r\n");
      telecharger(new Blob(["﻿" + texte], { type: "text/csv;charset=utf-8" }), nomFichier("csv"));
    },
    xlsx: function (lignes) {
      return chargerScripts(LIBS.xlsx).then(function () {
        var feuille = XLSX.utils.aoa_to_sheet([colonnesExport()].concat(lignes));
        feuille["!cols"] = largeursExport().map(function (w) { return { wch: w }; });
        var classeur = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(classeur, feuille, "Demandes");
        XLSX.writeFile(classeur, nomFichier("xlsx"));
      });
    },
    pdf: function (lignes) {
      return chargerScripts(LIBS.pdf).then(function () {
        var doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        var colonnes = colonnesExport();
        var iPrix = colonnes.indexOf("Prix (FCFA)");
        var total = iPrix === -1 ? null : lignes.reduce(function (s, l) { return s + l[iPrix]; }, 0);
        doc.setFontSize(16);
        doc.text("HANKA GROUP — " + type().titre, 40, 40);
        doc.setFontSize(9);
        doc.setTextColor(90);
        doc.text(
          "Export du " + new Date().toLocaleString("fr-FR") +
          " · Filtre : " + (filtre ? STATUTS[filtre] : "toutes") +
          " · " + lignes.length + " demande(s)" +
          (total === null ? "" : " · Total : " + formaterFCFA(total)),
          40, 58
        );
        doc.autoTable({
          startY: 72,
          head: [colonnes],
          body: lignes.map(function (l) {
            var copie = l.slice();
            if (iPrix !== -1) copie[iPrix] = formaterFCFA(copie[iPrix]);
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
    sb.from(type().table).update(champs).eq("id", id).then(function (res) {
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

  // --- Témoignages vidéo (accueil) ---
  var BUCKET = "temoignages";
  var TAILLE_MAX = 50 * 1024 * 1024;
  var temoignages = [];
  var listeTemoi = document.getElementById("temoi-admin-liste");
  var erreurTemoi = document.getElementById("temoi-erreur");

  function idYoutube(url) {
    var m = String(url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function afficheDe(t) {
    if (t.affiche_url) return t.affiche_url;
    var id = idYoutube(t.video_url);
    return id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "";
  }

  function montrerErreurTemoi(message) {
    erreurTemoi.textContent = message;
    erreurTemoi.hidden = !message;
  }

  function chargerTemoignages() {
    montrerErreurTemoi("");
    sb.from("temoignages").select("*").order("ordre").order("created_at").then(function (res) {
      if (res.error) return montrerErreurTemoi("Impossible de charger les témoignages : " + res.error.message);
      temoignages = res.data || [];
      rendreTemoignages();
    });
  }

  function rendreTemoignages() {
    document.getElementById("temoi-vide").hidden = temoignages.length > 0;
    listeTemoi.innerHTML = temoignages.map(function (t, i) {
      var image = afficheDe(t);
      return '<li class="temoi-admin' + (t.publie ? "" : " temoi-masque") + '">' +
        '<a class="temoi-admin-image" href="' + echapper(t.video_url) + '" target="_blank" rel="noopener" title="Voir la vidéo">' +
        (image ? '<img src="' + echapper(image) + '" alt="">' : "<span>▶</span>") + "</a>" +
        '<div class="temoi-admin-infos"><strong>' + echapper(t.nom) + "</strong>" +
        (t.activite ? "<span>" + echapper(t.activite) + "</span>" : "") +
        (t.service ? '<span class="temoignage-service">' + echapper(t.service) + "</span>" : "") +
        '<span class="temoi-etat">' + (t.publie ? "● Publié sur le site" : "○ Masqué") + "</span></div>" +
        '<div class="temoi-admin-actions">' +
        '<button type="button" class="btn btn-ghost btn-petit" data-temoi-monter="' + i + '"' + (i === 0 ? " disabled" : "") + ' aria-label="Monter">↑</button>' +
        '<button type="button" class="btn btn-ghost btn-petit" data-temoi-descendre="' + i + '"' + (i === temoignages.length - 1 ? " disabled" : "") + ' aria-label="Descendre">↓</button>' +
        '<button type="button" class="btn btn-ghost btn-petit" data-temoi-publier="' + i + '">' + (t.publie ? "Masquer" : "Publier") + "</button>" +
        '<button type="button" class="btn btn-ghost btn-petit" data-temoi-supprimer="' + i + '">Supprimer</button>' +
        "</div></li>";
    }).join("");
  }

  // Chemin de fichier dans le stockage à partir de son URL publique (pour la suppression)
  function cheminStockage(url) {
    var repere = "/storage/v1/object/public/" + BUCKET + "/";
    var i = String(url || "").indexOf(repere);
    return i === -1 ? null : decodeURIComponent(url.slice(i + repere.length));
  }

  listeTemoi.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var i;

    if (b.hasAttribute("data-temoi-monter") || b.hasAttribute("data-temoi-descendre")) {
      i = Number(b.getAttribute("data-temoi-monter") || b.getAttribute("data-temoi-descendre"));
      var j = b.hasAttribute("data-temoi-monter") ? i - 1 : i + 1;
      var deplace = temoignages.splice(i, 1)[0];
      temoignages.splice(j, 0, deplace);
      rendreTemoignages();
      // Renumérote l'ordre de toute la liste
      Promise.all(temoignages.map(function (t, k) {
        t.ordre = k;
        return sb.from("temoignages").update({ ordre: k }).eq("id", t.id);
      })).then(function (res) {
        var err = res.filter(function (r) { return r.error; })[0];
        if (err) montrerErreurTemoi("Ordre non enregistré : " + err.error.message);
      });
      return;
    }

    if (b.hasAttribute("data-temoi-publier")) {
      var t = temoignages[Number(b.getAttribute("data-temoi-publier"))];
      b.disabled = true;
      sb.from("temoignages").update({ publie: !t.publie }).eq("id", t.id).then(function (res) {
        if (res.error) { b.disabled = false; return montrerErreurTemoi("Modification impossible : " + res.error.message); }
        t.publie = !t.publie;
        rendreTemoignages();
      });
      return;
    }

    if (b.hasAttribute("data-temoi-supprimer")) {
      // Confirmation en deux clics, sans boîte de dialogue
      if (b.getAttribute("data-confirmer") !== "1") {
        b.setAttribute("data-confirmer", "1");
        b.textContent = "Confirmer la suppression ?";
        b.classList.add("btn-danger");
        return;
      }
      var cible = temoignages[Number(b.getAttribute("data-temoi-supprimer"))];
      b.disabled = true;
      sb.from("temoignages").delete().eq("id", cible.id).then(function (res) {
        if (res.error) { b.disabled = false; return montrerErreurTemoi("Suppression impossible : " + res.error.message); }
        var fichiers = [cheminStockage(cible.video_url), cheminStockage(cible.affiche_url)].filter(Boolean);
        if (fichiers.length) sb.storage.from(BUCKET).remove(fichiers);
        chargerTemoignages();
      });
    }
  });

  // Choix de la source vidéo : fichier ou YouTube
  document.querySelectorAll('input[name="temoi-source"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var youtube = document.querySelector('input[name="temoi-source"]:checked').value === "youtube";
      document.getElementById("temoi-bloc-fichier").hidden = youtube;
      document.getElementById("temoi-bloc-youtube").hidden = !youtube;
    });
  });

  // Image de couverture tirée de la vidéo (une image prise à 1 seconde)
  function couvertureDepuisVideo(fichier) {
    return new Promise(function (ok) {
      var video = document.createElement("video");
      var url = URL.createObjectURL(fichier);
      var fini = false;
      var terminer = function (blob) {
        if (fini) return;
        fini = true;
        URL.revokeObjectURL(url);
        ok(blob);
      };
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = url;
      video.addEventListener("loadeddata", function () {
        video.currentTime = Math.min(1, (video.duration || 2) / 2);
      });
      video.addEventListener("seeked", function () {
        try {
          var cote = Math.min(video.videoWidth, video.videoHeight);
          var canvas = document.createElement("canvas");
          canvas.width = canvas.height = Math.min(cote, 720);
          canvas.getContext("2d").drawImage(
            video,
            (video.videoWidth - cote) / 2, (video.videoHeight - cote) / 2, cote, cote,
            0, 0, canvas.width, canvas.height
          );
          canvas.toBlob(terminer, "image/jpeg", 0.85);
        } catch (err) {
          terminer(null);
        }
      });
      video.addEventListener("error", function () { terminer(null); });
      setTimeout(function () { terminer(null); }, 15000); // format non lisible par le navigateur
    });
  }

  function televerser(fichier, prefixe) {
    var ext = (fichier.name && fichier.name.split(".").pop().toLowerCase()) || (fichier.type === "image/jpeg" ? "jpg" : "bin");
    var chemin = prefixe + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    return sb.storage.from(BUCKET).upload(chemin, fichier, { contentType: fichier.type, upsert: false }).then(function (res) {
      if (res.error) throw new Error(res.error.message);
      return sb.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl;
    });
  }

  document.getElementById("form-temoi").addEventListener("submit", function (e) {
    e.preventDefault();
    var succes = document.getElementById("temoi-succes");
    var bouton = document.getElementById("btn-temoi");
    succes.hidden = true;
    montrerErreurTemoi("");

    var nom = document.getElementById("temoi-nom").value.trim();
    var youtube = document.querySelector('input[name="temoi-source"]:checked').value === "youtube";
    var lien = document.getElementById("temoi-youtube").value.trim();
    var fichier = document.getElementById("temoi-fichier").files[0];
    var affiche = document.getElementById("temoi-affiche").files[0];

    if (!nom) return montrerErreurTemoi("Indiquez le nom du client.");
    if (youtube && !idYoutube(lien)) return montrerErreurTemoi("Le lien YouTube n'est pas reconnu. Copiez le lien de partage de la vidéo (ex. https://youtu.be/...).");
    if (!youtube && !fichier) return montrerErreurTemoi("Choisissez le fichier vidéo à téléverser.");
    if (!youtube && fichier.size > TAILLE_MAX) return montrerErreurTemoi("La vidéo fait " + Math.round(fichier.size / 1048576) + " Mo : le maximum est 50 Mo. Raccourcissez-la ou utilisez un lien YouTube.");
    if (affiche && affiche.size > 5 * 1048576) return montrerErreurTemoi("L'image de couverture doit faire moins de 5 Mo.");

    bouton.disabled = true;
    bouton.textContent = youtube ? "Enregistrement..." : "Envoi de la vidéo en cours... ne fermez pas la page";

    var urlVideo = youtube ? Promise.resolve(lien) : televerser(fichier, "video");
    var urlAffiche = affiche
      ? televerser(affiche, "couverture")
      : (youtube ? Promise.resolve(null) : couvertureDepuisVideo(fichier).then(function (blob) {
          return blob ? televerser(new File([blob], "couverture.jpg", { type: "image/jpeg" }), "couverture") : null;
        }));

    Promise.all([urlVideo, urlAffiche]).then(function (urls) {
      return sb.from("temoignages").insert({
        nom: nom,
        activite: document.getElementById("temoi-activite").value.trim() || null,
        service: document.getElementById("temoi-service").value || null,
        video_url: urls[0],
        affiche_url: urls[1],
        ordre: temoignages.length,
        publie: true
      }).then(function (res) {
        if (res.error) throw new Error(res.error.message);
      });
    }).then(function () {
      succes.textContent = "Témoignage ajouté et publié sur la page d'accueil.";
      succes.hidden = false;
      e.target.reset();
      document.getElementById("temoi-bloc-fichier").hidden = false;
      document.getElementById("temoi-bloc-youtube").hidden = true;
      chargerTemoignages();
    }).catch(function (err) {
      montrerErreurTemoi("Ajout impossible : " + err.message);
    }).then(function () {
      bouton.disabled = false;
      bouton.textContent = "Ajouter le témoignage";
    });
  });

  // --- Sessions de la formation certifiante (page Services) ---
  var sessionsFormation = [];
  var sessionEnEdition = null;
  var listeSessions = document.getElementById("sessions-admin-liste");
  var erreurSessions = document.getElementById("form-erreur");
  var formSession = document.getElementById("form-session");

  function montrerErreurSessions(message) {
    erreurSessions.textContent = message || "";
    erreurSessions.hidden = !message;
  }

  function periodeSession(s) {
    var opts = { weekday: "short", day: "numeric", month: "long", year: "numeric" };
    var debut = new Date(s.date_debut + "T12:00:00").toLocaleDateString("fr-FR", opts);
    if (!s.date_fin || s.date_fin === s.date_debut) return debut;
    return debut + " → " + new Date(s.date_fin + "T12:00:00").toLocaleDateString("fr-FR", opts);
  }

  function chargerSessions() {
    montrerErreurSessions("");
    sb.from("sessions_formation").select("*").order("date_debut", { ascending: false }).then(function (res) {
      if (res.error) return montrerErreurSessions("Impossible de charger les sessions : " + res.error.message);
      sessionsFormation = res.data || [];
      rendreSessions();
    });
  }

  function rendreSessions() {
    var aujourdhui = new Date().toISOString().slice(0, 10);
    document.getElementById("sessions-admin-vide").hidden = sessionsFormation.length > 0;
    listeSessions.innerHTML = sessionsFormation.map(function (s, i) {
      var passee = (s.date_fin || s.date_debut) < aujourdhui;
      var etat = passee ? "○ Terminée (plus affichée)" : (s.publie ? "● Affichée sur le site" : "○ Masquée");
      var debut = new Date(s.date_debut + "T12:00:00");
      return '<li class="temoi-admin' + (passee || !s.publie ? " temoi-masque" : "") + '">' +
        '<div class="session-date session-date-admin"><strong>' + debut.getDate() + "</strong><span>" +
          debut.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "") + "</span></div>" +
        '<div class="temoi-admin-infos"><strong>' + echapper(periodeSession(s)) + "</strong>" +
          [s.horaires, s.lieu, s.places ? s.places + " places" : "", s.note].filter(Boolean).map(function (x) {
            return "<span>" + echapper(x) + "</span>";
          }).join("") +
          '<span class="temoi-etat">' + etat + "</span></div>" +
        '<div class="temoi-admin-actions">' +
          '<button type="button" class="btn btn-ghost btn-petit" data-session-modifier="' + i + '">Modifier</button>' +
          (passee ? "" : '<button type="button" class="btn btn-ghost btn-petit" data-session-publier="' + i + '">' + (s.publie ? "Masquer" : "Afficher") + "</button>") +
          '<button type="button" class="btn btn-ghost btn-petit" data-session-supprimer="' + i + '">Supprimer</button>' +
        "</div></li>";
    }).join("");
  }

  function reinitialiserFormSession() {
    sessionEnEdition = null;
    formSession.reset();
    document.getElementById("titre-form-session").textContent = "Ajouter une session";
    document.getElementById("btn-session").textContent = "Publier la session";
    document.getElementById("btn-session-annuler").hidden = true;
  }

  listeSessions.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;

    if (b.hasAttribute("data-session-modifier")) {
      var s = sessionsFormation[Number(b.getAttribute("data-session-modifier"))];
      sessionEnEdition = s.id;
      document.getElementById("session-debut").value = s.date_debut;
      document.getElementById("session-fin").value = s.date_fin || "";
      document.getElementById("session-horaires").value = s.horaires || "";
      document.getElementById("session-places").value = s.places || "";
      document.getElementById("session-lieu").value = s.lieu || "";
      document.getElementById("session-note").value = s.note || "";
      document.getElementById("titre-form-session").textContent = "Modifier la session";
      document.getElementById("btn-session").textContent = "Enregistrer les modifications";
      document.getElementById("btn-session-annuler").hidden = false;
      formSession.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (b.hasAttribute("data-session-publier")) {
      var cible = sessionsFormation[Number(b.getAttribute("data-session-publier"))];
      b.disabled = true;
      sb.from("sessions_formation").update({ publie: !cible.publie }).eq("id", cible.id).then(function (res) {
        if (res.error) { b.disabled = false; return montrerErreurSessions("Modification impossible : " + res.error.message); }
        chargerSessions();
      });
      return;
    }

    if (b.hasAttribute("data-session-supprimer")) {
      if (b.getAttribute("data-confirmer") !== "1") {
        b.setAttribute("data-confirmer", "1");
        b.textContent = "Confirmer la suppression ?";
        b.classList.add("btn-danger");
        return;
      }
      var aSupprimer = sessionsFormation[Number(b.getAttribute("data-session-supprimer"))];
      b.disabled = true;
      sb.from("sessions_formation").delete().eq("id", aSupprimer.id).then(function (res) {
        if (res.error) { b.disabled = false; return montrerErreurSessions("Suppression impossible : " + res.error.message); }
        if (sessionEnEdition === aSupprimer.id) reinitialiserFormSession();
        chargerSessions();
      });
    }
  });

  document.getElementById("btn-session-annuler").addEventListener("click", reinitialiserFormSession);

  formSession.addEventListener("submit", function (e) {
    e.preventDefault();
    var succes = document.getElementById("session-succes");
    succes.hidden = true;
    montrerErreurSessions("");
    var val = function (id) { return document.getElementById(id).value.trim(); };
    var debut = val("session-debut");
    var fin = val("session-fin");
    if (!debut) return montrerErreurSessions("Indiquez la date de début.");
    if (fin && fin < debut) return montrerErreurSessions("La date de fin doit être après la date de début.");

    var donnees = {
      date_debut: debut,
      date_fin: fin || null,
      horaires: val("session-horaires") || null,
      lieu: val("session-lieu") || null,
      places: val("session-places") ? Number(val("session-places")) : null,
      note: val("session-note") || null
    };
    var bouton = document.getElementById("btn-session");
    bouton.disabled = true;
    var requete = sessionEnEdition
      ? sb.from("sessions_formation").update(donnees).eq("id", sessionEnEdition)
      : sb.from("sessions_formation").insert(Object.assign({ publie: true }, donnees));
    var modification = !!sessionEnEdition;

    requete.then(function (res) {
      bouton.disabled = false;
      if (res.error) return montrerErreurSessions("Enregistrement impossible : " + res.error.message);
      reinitialiserFormSession();
      succes.textContent = modification ? "Session modifiée." : "Session publiée : elle apparaît sur la page Services.";
      succes.hidden = false;
      chargerSessions();
    });
  });
});
