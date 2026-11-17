/* Greentech · vitrina de la portada: recorre los componentes principales de la página.
   Avanza sola cada 6,5 s, se detiene con el cursor o el foco, y responde a clic, flechas y deslizamiento. */
(function () {
  "use strict";
  var raiz = document.querySelector(".vitrina");
  if (!raiz) return;
  var items = Array.prototype.slice.call(raiz.querySelectorAll(".vitrina-item"));
  var escenas = Array.prototype.slice.call(raiz.querySelectorAll(".escena"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var actual = 0, vueltas = 0;

  function mostrar(n, enfocar) {
    n = (n + items.length) % items.length;
    items.forEach(function (b, i) {
      var si = i === n;
      b.setAttribute("aria-selected", si);
      b.tabIndex = si ? 0 : -1;
      b.classList.remove("corriendo");
    });
    escenas.forEach(function (e, i) {
      if (i === n) {
        e.hidden = false; e.classList.remove("entra"); void e.offsetWidth; e.classList.add("entra");
        /* las ilustraciones SVG vuelven a empezar su animación cada vez que aparece la escena */
        e.querySelectorAll("img[data-reinicia]").forEach(function (img) { img.src = img.src.split("#")[0] + "#v" + (++vueltas); });
      }
      else { e.hidden = true; e.classList.remove("entra"); }
    });
    actual = n;
    if (enfocar) items[n].focus();
    if (!reduce) { void items[n].offsetWidth; items[n].classList.add("corriendo"); }
  }

  items.forEach(function (b, i) {
    b.addEventListener("click", function () { mostrar(i); });
    b.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); mostrar(actual + d, true); }
    });
    /* la barra de progreso marca el tiempo: al terminar pasa a la siguiente escena */
    b.querySelector(".vi-progreso").addEventListener("animationend", function () { if (i === actual) mostrar(actual + 1); });
  });

  /* pausa con el cursor, el foco o la pestaña oculta */
  function pausa(si) { raiz.classList.toggle("en-pausa", si); }
  raiz.addEventListener("mouseenter", function () { pausa(true); });
  raiz.addEventListener("mouseleave", function () { pausa(false); });
  raiz.addEventListener("focusin", function () { pausa(true); });
  raiz.addEventListener("focusout", function (e) { if (!raiz.contains(e.relatedTarget)) pausa(false); });
  document.addEventListener("visibilitychange", function () { pausa(document.hidden); });

  /* deslizar con el dedo en el escenario */
  var x0 = null, esc = raiz.querySelector(".vitrina-escenario");
  esc.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  esc.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
  });

  mostrar(0);
})();
