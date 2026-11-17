/* Greentech · tarifa por empresa de energía (estrato 4, agosto de 2026, según agregadores; confirmar en el recibo) */
(function () {
  var op = document.getElementById("operador"), t = document.getElementById("tarifa");
  if (!op || !t) return;
  op.addEventListener("change", function () {
    if (!op.value) return;
    t.value = op.value;
    t.dispatchEvent(new Event("input", { bubbles: true }));
  });
  t.addEventListener("input", function (e) { if (e.isTrusted) op.value = ""; });
})();
