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

  function afficher(session) {
    vueConnexion.hidden = !!session;
    vueDemandes.hidden = !session;
    btnDeconnexion.hidden = !session;
    if (session) {
      document.getElementById("admin-compte").textContent = "Connecté : " + session.user.email;
      charger();
    }
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
});
