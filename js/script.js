// HANKA GROUP — comportements simples côté client (menu mobile + validation de base)

document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      var expanded = nav.classList.contains("open");
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  var form = document.querySelector(".contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = form.querySelector("#nom").value.trim();
      var email = form.querySelector("#email").value.trim();
      var message = form.querySelector("#message").value.trim();

      if (!name || !email || !message) {
        alert("Merci de remplir au moins votre nom, votre email et votre message.");
        return;
      }

      var subject = encodeURIComponent("Demande via le site — " + name);
      var body = encodeURIComponent(message + "\n\nEmail : " + email);
      window.location.href = "mailto:hanekatehe@gmail.com?subject=" + subject + "&body=" + body;
    });
  }
});
