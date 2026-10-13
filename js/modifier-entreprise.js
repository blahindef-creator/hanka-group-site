// Parcours « Modifier mon entreprise » : forme actuelle, éléments à modifier + commentaire,
// coordonnées, puis récapitulatif et envoi du ticket.

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("form-modification");
  if (!form) return;

  // Client connecté : coordonnées pré-remplies et demande ajoutée à son espace
  hankaParcoursCompte();

  var etat = { etape: 1, forme: "" };

  var panneaux = form.querySelectorAll(".wizard-panel");
  var pastilles = document.querySelectorAll(".wizard-steps li");
  var formeList = document.getElementById("forme-list");
  var choixList = document.getElementById("choix-list");
  var recap = document.getElementById("recap");
  var btnEnvoyer = document.getElementById("btn-envoyer");

  function champ(id) { return document.getElementById(id).value.trim(); }

  function echapper(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function erreur(cle, message) {
    var el = form.querySelector('[data-error="' + cle + '"]');
    el.textContent = message || "";
    el.hidden = !message;
    return !message;
  }

  function changementsCoches() {
    return [].slice.call(choixList.querySelectorAll("input:checked")).map(function (c) { return c.value; });
  }

  function afficherEtape(n, sansDefilement) {
    etat.etape = n;
    panneaux.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== String(n); });
    pastilles.forEach(function (li) {
      var s = Number(li.getAttribute("data-step"));
      li.classList.toggle("is-current", s === n);
      li.classList.toggle("is-done", typeof n === "number" ? s < n : true);
    });
    if (n === 4) rendreRecap();
    var cible = form.querySelector('[data-panel="' + n + '"]');
    if (cible && !sansDefilement) cible.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // --- Étape 1 : forme juridique actuelle ---
  FORMES_JURIDIQUES.forEach(function (forme) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "forme-btn";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", "false");
    b.textContent = forme;
    b.addEventListener("click", function () {
      etat.forme = forme;
      formeList.querySelectorAll(".forme-btn").forEach(function (x) {
        x.setAttribute("aria-checked", x === b ? "true" : "false");
      });
      afficherEtape(2);
    });
    formeList.appendChild(b);
  });

  // --- Étape 2 : éléments à modifier (plusieurs choix possibles) ---
  Object.keys(CHANGEMENTS_POSSIBLES).forEach(function (code) {
    var c = CHANGEMENTS_POSSIBLES[code];
    var label = document.createElement("label");
    label.className = "choix-carte";
    label.innerHTML =
      '<input type="checkbox" name="changements" value="' + code + '">' +
      '<span class="choix-texte"><strong>' + echapper(c.nom) + "</strong><small>" + echapper(c.aide) + "</small></span>";
    choixList.appendChild(label);
  });

  // --- Navigation ---
  form.addEventListener("click", function (e) {
    if (e.target.closest("[data-prev]")) afficherEtape(etat.etape - 1);
    if (e.target.closest("[data-next]") && valider(etat.etape)) afficherEtape(etat.etape + 1);
  });

  function valider(n) {
    if (n === 2) {
      if (!changementsCoches().length) return erreur(2, "Cochez au moins un élément à modifier.");
      if (champ("commentaire").length < 5) return erreur(2, "Expliquez en quelques mots la modification souhaitée.");
      return erreur(2, "");
    }
    if (n === 3) {
      var tel = champ("telephone");
      var mail = champ("email");
      if (!champ("nom") || !champ("prenom")) return erreur(3, "Merci d'indiquer votre nom et votre prénom.");
      if (!tel && !mail) return erreur(3, "Indiquez au moins un numéro de téléphone ou un email.");
      if (tel && !/^\+?[0-9 ]{8,20}$/.test(tel)) return erreur(3, "Le numéro de téléphone n'est pas valide (chiffres uniquement, ex. 07 01 02 03 04).");
      if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return erreur(3, "L'adresse email n'est pas valide.");
      return erreur(3, "");
    }
    return true;
  }

  // --- Étape 4 : récapitulatif ---
  function rendreRecap() {
    var lignes = [
      ["Forme actuelle", etat.forme],
      ["À modifier", changementsCoches().map(function (c) { return CHANGEMENTS_POSSIBLES[c].nom; }).join(", ")],
      ["Votre explication", champ("commentaire")],
      ["Nom", champ("prenom") + " " + champ("nom")],
      ["Contact", [champ("telephone"), champ("email")].filter(Boolean).join(" · ")]
    ];
    recap.innerHTML =
      "<h3>Récapitulatif</h3><dl>" +
      lignes.map(function (l) { return "<dt>" + l[0] + "</dt><dd>" + echapper(l[1]).replace(/\n/g, "<br>") + "</dd>"; }).join("") +
      "</dl>" +
      '<p class="recap-prix">Tarif : <strong class="recap-devis">sur devis</strong> — HANKA GROUP vous recontacte pour chiffrer votre modification.</p>';
  }

  // --- Envoi ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (etat.etape !== 4) return;

    var erreurEnvoi = form.querySelector('[data-error="envoi"]');
    erreurEnvoi.hidden = true;
    btnEnvoyer.disabled = true;
    btnEnvoyer.textContent = "Envoi en cours...";

    // Session relue au moment de l'envoi (le jeton est renouvelé automatiquement)
    hankaSession().then(function (sessionActuelle) {
      return fetch(HANKA_CONFIG.supabaseUrl + "/functions/v1/creer-demande", {
      method: "POST",
      headers: hankaEntetes(sessionActuelle),
      body: JSON.stringify({
        type: "modification",
        forme_actuelle: etat.forme,
        changements: changementsCoches(),
        commentaire: champ("commentaire"),
        nom: champ("nom"),
        prenom: champ("prenom"),
        telephone: champ("telephone") || null,
        email: champ("email") || null,
        site_web: champ("site_web")
      })
      });
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.data.ok) throw new Error(res.data && res.data.erreur);
        if (res.data.numero) {
          document.getElementById("done-ref").textContent = "Référence de votre demande : M" + res.data.numero;
        }
        hankaFinParcours(res.data.compte);
        afficherEtape("fin");
        form.querySelector('[data-panel="fin"]').focus();
      })
      .catch(function () {
        erreurEnvoi.textContent = "L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez, ou appelez-nous au +225 01 72 97 64 18.";
        erreurEnvoi.hidden = false;
        btnEnvoyer.disabled = false;
        btnEnvoyer.textContent = "Envoyer ma demande";
      });
  });

  afficherEtape(1, true);
});
