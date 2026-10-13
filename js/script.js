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

  // Diaporama du bloc d'accueil : une image toutes les 5 s, pause au survol
  var slider = document.querySelector(".hero-slider");
  if (slider) {
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
      timer = setInterval(function () { show(current + 1); }, 5000);
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
