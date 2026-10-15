// HANKA GROUP — comportements simples côté client (menu mobile + validation de base)

document.addEventListener("DOMContentLoaded", function () {

  // Déjà connecté (session enregistrée dans le navigateur) : « Se connecter » devient « Mon espace »
  try {
    var session = JSON.parse(localStorage.getItem("sb-caassokvbuuppimftcik-auth-token") || "null");
    if (session && session.access_token) {
      document.querySelectorAll(".nav-connexion").forEach(function (lien) {
        lien.lastChild.textContent = "Mon espace";
        lien.setAttribute("aria-label", "Mon espace");
      });
    }
  } catch (e) { /* stockage indisponible : on garde « Se connecter » */ }
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      var expanded = nav.classList.contains("open");
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  // Diaporamas (accueil, services) : une image toutes les 3 s, pause au survol.
  // window.hankaDiaporama sert aussi aux galeries créées après chargement (js/galeries.js).
  window.hankaDiaporama = function (slider) {
    var slides = slider.querySelectorAll(".hero-slide");
    var dotsBox = slider.querySelector(".hero-dots");
    var current = 0;
    var timer = null;

    var show = function (index) {
      slides[current].classList.remove("is-active");
      dotsBox.children[current].setAttribute("aria-selected", "false");
      current = (index + slides.length) % slides.length;
      slides[current].classList.add("is-active");
      dotsBox.children[current].setAttribute("aria-selected", "true");
    };
    var start = function () {
      stop();
      timer = setInterval(function () { show(current + 1); }, 3000);
    };
    var stop = function () {
      if (timer) clearInterval(timer);
    };

    slides.forEach(function (slide, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Image " + (i + 1));
      dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
      dot.addEventListener("click", function () { show(i); start(); });
      dotsBox.appendChild(dot);
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    start();
    slider.hankaArreter = stop;
  };
  document.querySelectorAll(".hero-slider").forEach(window.hankaDiaporama);

  // Formulaire de contact : le message est enregistré pour l'espace admin (onglet Demandes > Messages)
  var form = document.querySelector(".contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var val = function (id) { return form.querySelector("#" + id).value.trim(); };
      var erreur = document.getElementById("contact-erreur");
      var montrer = function (m) { erreur.textContent = m || ""; erreur.hidden = !m; };

      if (!val("nom") || !val("email") || !val("message")) return montrer("Merci de remplir votre nom, votre email et votre message.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val("email"))) return montrer("L'adresse email n'est pas valide.");
      if (val("telephone") && !/^\+?[0-9 ]{8,20}$/.test(val("telephone"))) return montrer("Le numéro de téléphone n'est pas valide (chiffres uniquement).");
      if (typeof HANKA_CONFIG === "undefined") return montrer("Envoi impossible pour le moment. Appelez-nous au +225 01 72 97 64 18.");
      montrer("");

      var bouton = form.querySelector("button[type=submit]");
      bouton.disabled = true;
      bouton.textContent = "Envoi en cours...";
      fetch(HANKA_CONFIG.supabaseUrl + "/functions/v1/creer-demande", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": HANKA_CONFIG.supabaseAnonKey,
          "Authorization": "Bearer " + HANKA_CONFIG.supabaseAnonKey
        },
        body: JSON.stringify({
          type: "contact",
          nom: val("nom"),
          email: val("email"),
          telephone: val("telephone") || null,
          service: val("service") || null,
          message: val("message"),
          site_web: val("site_web")
        })
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok || !res.d.ok) throw new Error();
          form.hidden = true;
          var merci = document.getElementById("contact-merci");
          if (res.d.numero) {
            document.getElementById("contact-ref").textContent = "Référence de votre message : C" + res.d.numero;
            hankaLienSuivi("contact-suivi", "C" + res.d.numero);
          }
          merci.hidden = false;
          merci.focus();
        })
        .catch(function () {
          montrer("L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez, ou appelez-nous au +225 01 72 97 64 18.");
          bouton.disabled = false;
          bouton.textContent = "Envoyer ma demande";
        });
    });
  }
});

// Après une demande : lien vers la page de suivi, référence déjà remplie (suivi sans compte)
function hankaLienSuivi(id, reference) {
  var p = document.getElementById(id);
  if (!p) return;
  p.innerHTML = 'Notez cette référence : elle vous permet de <a href="suivi.html?ref=' + encodeURIComponent(reference) + '">suivre votre demande</a> à tout moment, sans créer de compte.';
  p.hidden = false;
}
