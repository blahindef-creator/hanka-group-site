// Parcours « Créer mon entreprise » : 3 étapes + choix du pack, puis envoi du ticket.

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("form-creation");
  if (!form) return;

  var etat = { etape: 1, forme: "", ville: "", pack: "" };

  var panneaux = form.querySelectorAll(".wizard-panel");
  var pastilles = document.querySelectorAll(".wizard-steps li");
  var formeList = document.getElementById("forme-list");
  var selectVille = document.getElementById("ville");
  var packList = document.getElementById("pack-list");
  var recap = document.getElementById("recap");
  var caseConfirm = document.getElementById("confirm-prix");
  var btnEnvoyer = document.getElementById("btn-envoyer");

  function champ(id) { return document.getElementById(id).value.trim(); }

  function montrerErreur(cle) {
    var el = form.querySelector('[data-error="' + cle + '"]');
    if (el) el.hidden = false;
  }
  function masquerErreur(cle) {
    var el = form.querySelector('[data-error="' + cle + '"]');
    if (el) el.hidden = true;
  }

  function afficherEtape(n, sansDefilement) {
    etat.etape = n;
    panneaux.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== String(n); });
    pastilles.forEach(function (li) {
      var s = Number(li.getAttribute("data-step"));
      li.classList.toggle("is-current", s === n);
      li.classList.toggle("is-done", typeof n === "number" ? s < n : true);
    });
    if (n === 4) rendreEtape4();
    var cible = form.querySelector('[data-panel="' + n + '"]');
    if (cible && !sansDefilement) cible.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // --- Étape 1 : formes juridiques ---
  FORMES_JURIDIQUES.forEach(function (forme) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "forme-btn";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", "false");
    b.textContent = forme;
    b.addEventListener("click", function () {
      etat.forme = forme;
      if (!formeAvecPack(forme)) etat.pack = "";
      formeList.querySelectorAll(".forme-btn").forEach(function (x) {
        x.setAttribute("aria-checked", x === b ? "true" : "false");
      });
      masquerErreur(1);
      afficherEtape(2);
    });
    formeList.appendChild(b);
  });

  // --- Étape 2 : villes ---
  VILLES_CI.forEach(function (ville) {
    var o = document.createElement("option");
    o.value = ville;
    o.textContent = ville;
    selectVille.appendChild(o);
  });

  // --- Navigation ---
  form.addEventListener("click", function (e) {
    if (e.target.closest("[data-prev]")) afficherEtape(etat.etape - 1);
    if (e.target.closest("[data-next]") && valider(etat.etape)) afficherEtape(etat.etape + 1);
  });

  function valider(n) {
    if (n === 2) {
      etat.ville = selectVille.value;
      if (!etat.ville) { montrerErreur(2); return false; }
      masquerErreur(2);
      return true;
    }
    if (n === 3) {
      var msg = "";
      var tel = champ("telephone");
      var mail = champ("email");
      if (!champ("nom") || !champ("prenom")) msg = "Merci d'indiquer votre nom et votre prénom.";
      else if (!tel && !mail) msg = "Indiquez au moins un numéro de téléphone ou un email.";
      else if (tel && !/^\+?[0-9 ]{8,20}$/.test(tel)) msg = "Le numéro de téléphone n'est pas valide (chiffres uniquement, ex. 07 01 02 03 04).";
      else if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) msg = "L'adresse email n'est pas valide.";
      var el = form.querySelector('[data-error="3"]');
      el.textContent = msg;
      el.hidden = !msg;
      return !msg;
    }
    return true;
  }

  // --- Étape 4 : packs + récapitulatif ---
  function rendreEtape4() {
    packList.innerHTML = "";
    packList.hidden = !formeAvecPack(etat.forme);
    masquerErreur(4);

    if (formeAvecPack(etat.forme)) {
      ["pack1", "pack2"].forEach(function (cle) {
        var p = PACKS[cle];
        var carte = document.createElement("button");
        carte.type = "button";
        carte.className = "pack-card" + (p.badge ? " pack-card-premium" : "");
        carte.setAttribute("role", "radio");
        carte.setAttribute("aria-checked", etat.pack === cle ? "true" : "false");
        carte.innerHTML =
          (p.badge ? '<span class="pack-badge">' + p.badge + "</span>" : "") +
          '<span class="pack-nom">' + p.nom + "</span>" +
          '<span class="pack-prix">' + formaterFCFA(calculerPrix(etat.forme, etat.ville, cle)) + "</span>" +
          "<ul>" + p.avantages.map(function (a) { return "<li>" + a + "</li>"; }).join("") + "</ul>" +
          '<span class="pack-choisir">' + (etat.pack === cle ? "✓ Pack choisi" : "Choisir ce pack") + "</span>";
        carte.addEventListener("click", function () {
          etat.pack = cle;
          rendreEtape4();
        });
        packList.appendChild(carte);
      });
    }
    rendreRecap();
  }

  function rendreRecap() {
    var prix = calculerPrix(etat.forme, etat.ville, etat.pack);
    var contact = [champ("telephone"), champ("email")].filter(Boolean).join(" · ");
    var lignes = [
      ["Forme juridique", etat.forme],
      ["Ville", etat.ville],
      formeAvecPack(etat.forme) ? ["Pack", etat.pack ? PACKS[etat.pack].nom : "À choisir ci-dessus"] : null,
      ["Nom", champ("prenom") + " " + champ("nom")],
      ["Contact", contact]
    ].filter(Boolean);

    recap.innerHTML =
      "<h3>Récapitulatif</h3><dl>" +
      lignes.map(function (l) { return "<dt>" + l[0] + "</dt><dd>" + echapper(l[1]) + "</dd>"; }).join("") +
      "</dl>" +
      '<p class="recap-prix">' + (prix ? "Prix total : <strong>" + formaterFCFA(prix) + "</strong>" : "Choisissez un pack pour afficher le prix.") + "</p>";

    caseConfirm.disabled = !prix;
    if (!prix) caseConfirm.checked = false;
    btnEnvoyer.disabled = !(prix && caseConfirm.checked);
  }

  caseConfirm.addEventListener("change", rendreRecap);

  function echapper(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // --- Envoi ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (formeAvecPack(etat.forme) && !etat.pack) {
      montrerErreur(4);
      return;
    }
    if (!caseConfirm.checked) return;

    var erreurEnvoi = form.querySelector('[data-error="envoi"]');
    erreurEnvoi.hidden = true;
    btnEnvoyer.disabled = true;
    btnEnvoyer.textContent = "Envoi en cours...";

    fetch(HANKA_CONFIG.supabaseUrl + "/functions/v1/creer-demande", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": HANKA_CONFIG.supabaseAnonKey,
        "Authorization": "Bearer " + HANKA_CONFIG.supabaseAnonKey
      },
      body: JSON.stringify({
        forme_juridique: etat.forme,
        ville: etat.ville,
        pack: formeAvecPack(etat.forme) ? etat.pack : null,
        nom: champ("nom"),
        prenom: champ("prenom"),
        telephone: champ("telephone") || null,
        email: champ("email") || null,
        site_web: champ("site_web")
      })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.data.ok) throw new Error(res.data && res.data.erreur);
        if (res.data.numero) {
          document.getElementById("done-ref").textContent = "Référence de votre demande : n° " + res.data.numero;
        }
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
