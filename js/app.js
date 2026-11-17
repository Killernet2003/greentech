/* Greentech · comportamiento de la página */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cop = function (n) { return "$" + Math.round(n).toLocaleString("es-CO"); };
  var num = function (n, d) { return Number(n).toLocaleString("es-CO", { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ---------- titular letra por letra ---------- */
  $$(".anim-letras").forEach(function (el) {
    var t = el.textContent; el.textContent = ""; el.setAttribute("aria-label", t);
    t.split("").forEach(function (ch, k) {
      var s = document.createElement("span"); s.className = "l"; s.style.setProperty("--k", k);
      s.setAttribute("aria-hidden", "true"); s.textContent = ch; el.appendChild(s);
    });
  });

  /* ---------- contadores de la carpeta frontal ---------- */
  function contar(el) {
    var fin = +el.dataset.cuenta, t0 = null, dur = reduce ? 1 : 1400;
    function paso(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(paso); }
    requestAnimationFrame(paso);
  }
  setTimeout(function () { $$("[data-cuenta]").forEach(contar); }, reduce ? 0 : 1100);

  /* ---------- entradas al hacer scroll ---------- */
  $$(".baldosa").forEach(function (b, i) { b.style.setProperty("--n", i % 3); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    $$(".revelar, #pie-marca").forEach(function (el) { io.observe(el); });
  } else { document.documentElement.classList.add("sin-js"); }

  /* ---------- pestañas genéricas ---------- */
  function pestanas(lista, alCambiar) {
    var tabs = $$("[role=tab]", lista);
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activar(i); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { e.preventDefault(); var j = (i + d + tabs.length) % tabs.length; activar(j); tabs[j].focus(); }
      });
    });
    function activar(i) {
      tabs.forEach(function (t, j) { t.setAttribute("aria-selected", i === j); t.tabIndex = i === j ? 0 : -1; });
      alCambiar(tabs[i], i);
    }
    return activar;
  }

  /* =================== CALCULADORA =================== */
  var GT = window.GT, estado = { modo: "recibo", kwhRecibo: null, tipo: "ongrid" };
  /* metas: fijan el % de ahorro y el tipo de sistema */
  var cajaMetas = $("#metas");
  GT.METAS.forEach(function (m, i) {
    cajaMetas.insertAdjacentHTML("beforeend", '<label class="meta"><input type="radio" name="meta" value="' + i + '"' + (i === 2 ? " checked" : "") + '><span>' + esc(m.n) + "</span></label>");
  });
  function elegirMeta(i) { var m = GT.METAS[i]; estado.tipo = m.tipo; $("#pct").value = m.pct; $("#pct").disabled = m.tipo === "offgrid"; }
  $$("input[name=meta]", cajaMetas).forEach(function (r) { r.addEventListener("change", function () { elegirMeta(+r.value); calcular(); }); });
  elegirMeta(2);
  var NOMBRE_TIPO = { ongrid: "On grid · conectado a la red", hibrido: "Híbrido · red + baterías", offgrid: "Off grid · aislado con baterías" };

  var selCiudad = $("#ciudad");
  GT.CIUDADES.forEach(function (c, i) { var o = new Option(c.n + " · " + num(c.hsp, 1) + " h sol", i); selCiudad.add(o); });

  pestanas($(".modos"), function (tab) {
    $$(".modo-panel").forEach(function (p) { p.hidden = p.id !== tab.getAttribute("aria-controls"); });
    estado.modo = tab.id.replace("t-", ""); calcular();
  });

  /* tabla de electrodomésticos */
  var cuerpo = $("#aparatos-cuerpo"), grupoAnt = "";
  GT.APARATOS.forEach(function (a) {
    if (a.g !== grupoAnt) { grupoAnt = a.g; cuerpo.insertAdjacentHTML("beforeend", '<tr class="grupo"><th colspan="4" scope="rowgroup">' + a.g + "</th></tr>"); }
    var horas = a.kwhDia ? '<td>—</td>' : '<td><input type="number" min="0" max="24" step="0.25" value="' + a.h + '" data-h="' + a.id + '" aria-label="Horas al día de ' + esc(a.n) + '"></td>';
    cuerpo.insertAdjacentHTML("beforeend", "<tr><th scope=\"row\">" + esc(a.n) + "</th>" +
      '<td><input type="number" min="0" max="50" step="1" value="' + a.c + '" data-c="' + a.id + '" aria-label="Cantidad de ' + esc(a.n) + '"></td>' + horas +
      '<td data-r="' + a.id + '">0</td></tr>');
    if (a.v === 220) cuerpo.lastElementChild.querySelector("th").insertAdjacentHTML("beforeend", ' <span class="v220">220 V</span>');
  });
  function usa220() { return GT.APARATOS.some(function (a) { return a.v === 220 && +($('[data-c="' + a.id + '"]').value || 0) > 0; }); }
  function kwhAparatos() {
    var total = 0;
    GT.APARATOS.forEach(function (a) {
      var c = +($('[data-c="' + a.id + '"]').value || 0);
      var k = a.kwhDia ? a.kwhDia * c * 30 : a.w * +($('[data-h="' + a.id + '"]').value || 0) * c * 30 / 1000;
      $('[data-r="' + a.id + '"]').textContent = num(k); total += k;
    });
    $("#aparatos-total").textContent = num(total) + " kWh/mes";
    return total;
  }

  /* lectura del recibo (OCR en el navegador con Tesseract.js) */
  var cargandoOCR = null;
  function cargarTesseract() {
    if (window.Tesseract) return Promise.resolve();
    if (cargandoOCR) return cargandoOCR;
    cargandoOCR = new Promise(function (ok, mal) {
      var s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      s.onload = ok; s.onerror = mal; document.head.appendChild(s);
    });
    return cargandoOCR;
  }
  function candidatos(texto) {
    var lineas = texto.split(/\n/), vistos = {}, out = [];
    lineas.forEach(function (l, i) {
      var ctx = (lineas[i - 1] || "") + " " + l + " " + (lineas[i + 1] || "");
      if (!/kwh|consumo|promedio|activa/i.test(ctx)) return;
      (l.match(/\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+/g) || []).forEach(function (m) {
        var v = parseFloat(m.replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
        if (v >= 30 && v <= 9000 && !vistos[v]) { vistos[v] = 1; out.push({ v: v, peso: /promedio/i.test(ctx) ? 2 : /kwh/i.test(l) ? 1 : 0 }); }
      });
    });
    return out.sort(function (a, b) { return b.peso - a.peso; }).slice(0, 6);
  }
  $("#foto-recibo").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var est = $("#ocr-estado"), ops = $("#ocr-opciones"), vista = $("#ocr-vista");
    vista.src = URL.createObjectURL(f); vista.hidden = false; ops.innerHTML = "";
    est.textContent = "Leyendo el recibo… puede tardar unos segundos.";
    cargarTesseract().then(function () {
      return window.Tesseract.recognize(f, "spa", { logger: function (m) { if (m.status === "recognizing text") est.textContent = "Leyendo el recibo… " + Math.round(m.progress * 100) + " %"; } });
    }).then(function (r) {
      var cs = candidatos(r.data.text || "");
      if (!cs.length) { est.textContent = "No encontramos el consumo en la foto. Escríbelo en «Promedio mensual»."; return; }
      est.textContent = "Elige tu consumo mensual en kWh:";
      cs.forEach(function (c, i) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = num(c.v) + " kWh"; b.setAttribute("aria-pressed", i === 0);
        b.addEventListener("click", function () { $$("button", ops).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); estado.kwhRecibo = c.v; $("#kwh-mes").value = Math.round(c.v); calcular(); });
        ops.appendChild(b);
      });
      estado.kwhRecibo = cs[0].v; $("#kwh-mes").value = Math.round(cs[0].v); calcular();
    }).catch(function () { est.textContent = "No pudimos leer la foto sin conexión. Escribe el dato en «Promedio mensual»."; });
  });

  function escenarioPara(kwp) { return kwp <= 3.9 ? 0 : kwp <= 7 ? 1 : kwp <= 11 ? 2 : -1; }

  function calcular() {
    var tablaKwh = kwhAparatos();
    var kwh = estado.modo === "aparatos" ? tablaKwh : estado.modo === "recibo" ? (estado.kwhRecibo || +$("#kwh-mes").value) : +$("#kwh-mes").value;
    kwh = Math.max(0, kwh || 0);
    var c = GT.CIUDADES[+selCiudad.value || 0], tarifa = +$("#tarifa").value || 0, pct = +$("#pct").value / 100;
    $("#pct-salida").textContent = Math.round(pct * 100);
    var kwpNec = kwh * pct / (c.hsp * 30 * GT.PR);
    var paneles = kwh > 0 ? Math.max(2, Math.ceil(kwpNec * 1000 / GT.PANEL_W / 2) * 2) : 0; // los paneles se instalan en pares
    var kwp = paneles * GT.PANEL_W / 1000, prod = GT.produccionMes(kwp, c.hsp);
    var e = escenarioPara(kwp), ahorroKwh = Math.min(prod, kwh), ahorro = ahorroKwh * tarifa;
    $("#r-paneles").textContent = paneles;
    $("#r-consumo").textContent = num(kwh) + " kWh/mes";
    $("#r-kwp").textContent = num(kwp, 2) + " kWp";
    $("#r-prod").textContent = num(prod) + " kWh/mes";
    $("#r-area").textContent = num(paneles * GT.PANEL_M2, 1) + " m²";
    var tipo = estado.tipo;
    $("#r-sistema").textContent = NOMBRE_TIPO[tipo];
    $("#r-ahorro").textContent = cop(ahorro) + " al mes";
    if (e >= 0) {
      var k = GT.ESCENARIOS[e][tipo], base = k.total / k.paneles;
      var inversion = Math.round(base * paneles / 100000) * 100000;
      $("#r-inv").textContent = k.inversor;
      $("#r-inversion").textContent = tipo === "hibrido" ? cop(inversion) + " · desde " + cop(GT.ESCENARIOS[e].etapas[0].precio) + " en la etapa 1" : cop(inversion);
      $("#r-retorno").textContent = ahorro > 0 ? num(inversion / (ahorro * 12), 1) + " años" : "—";
      $("#r-kit").textContent = "Ver " + k.nombre; $("#r-kit").href = "#kits"; $("#r-kit").dataset.esc = e;
    } else {
      $("#r-inv").textContent = "Varios inversores · proyecto a medida";
      $("#r-inversion").textContent = "Requiere visita"; $("#r-retorno").textContent = "—";
      $("#r-kit").textContent = "Pedir una propuesta a medida"; $("#r-kit").href = "#contacto"; delete $("#r-kit").dataset.esc;
    }
    var con = $("#conexion").value, pide240 = (e === 0 && tipo === "ongrid") || usa220(), aviso = "";
    if (con === "mono" && pide240) aviso = "Tu casa es monofásica (120 V) y este sistema trabaja a 120/240 V: hay que pedir al operador de red el cambio a acometida bifásica, o usar un inversor de salida 120 V. Lo revisamos en la visita.";
    else if (con === "nose") aviso = "Mira el contador: si llegan dos cables con corriente más el neutro, la casa es bifásica (120/240 V). Si no lo sabes, lo revisamos en la visita.";
    $("#r-conexion").textContent = aviso; $("#r-conexion").hidden = !aviso;
    estado.resumen = NOMBRE_TIPO[tipo] + ", " + num(kwh) + " kWh/mes, " + Math.round(pct * 100) + " % de ahorro, " + paneles + " paneles (" + num(kwp, 2) + " kWp) en " + c.n;
  }
  $$(".calc input, .calc select").forEach(function (el) { el.addEventListener("input", calcular); });
  $("#kwh-mes").addEventListener("input", function () { estado.kwhRecibo = null; });
  calcular();

  /* =================== ACORDEÓN =================== */
  var etapas = $$(".etapa");
  etapas.forEach(function (b) {
    b.addEventListener("click", function () {
      etapas.forEach(function (x) { x.classList.toggle("abierta", x === b); x.setAttribute("aria-expanded", x === b); });
    });
  });

  /* =================== EQUIPOS =================== */
  var EQ = window.EQUIPOS, listas = $("#indice-listas"), ficha = $("#ficha"), indice = $(".indice");
  var TIPOS = { micro: "Microinversor on grid", ongrid: "Inversor on grid", offgrid: "Inversor off grid", hibrido: "Inversor híbrido" };
  function filaTabla(etq, v) { return v === null || v === undefined || v === "" ? "" : "<tr><th scope=\"row\">" + etq + "</th><td>" + esc(Array.isArray(v) ? v.join(", ") : v) + "</td></tr>"; }
  function fichaHTML(x, clase) {
    var esPanel = clase === "panel", filas = "";
    if (clase === "bat") {
      filas = filaTabla("Energía", x.kwh != null ? num(x.kwh, 2) + " kWh" : null) + filaTabla("Voltaje", x.voltaje_nominal_v ? x.voltaje_nominal_v + " V · " + (x.capacidad_ah || "") + " Ah" : null) + filaTabla("Ciclos", x.ciclos) + filaTabla("Profundidad de descarga", x.dod != null ? x.dod + " %" : null) +
        filaTabla("Comunicación", x.comunicacion) + filaTabla("Garantía", x.garantia_anios != null ? x.garantia_anios + " años" : null) +
        filaTabla("Precio aprox.", x.precio_cop_aprox ? (typeof x.precio_cop_aprox === "number" ? cop(x.precio_cop_aprox) : x.precio_cop_aprox.valor ? cop(x.precio_cop_aprox.valor) : null) : null);
    } else if (esPanel) {
      filas = filaTabla("Potencia", potTxt(x.potencia_w)) + filaTabla("Tecnología", x.tecnologia) + filaTabla("Eficiencia", x.eficiencia != null ? x.eficiencia + " %" : null) +
        filaTabla("Bifacial", x.bifacial === true ? "Sí" : x.bifacial === false ? "No" : null) + filaTabla("Coef. temperatura", x.coef_temp_pmax != null ? x.coef_temp_pmax + " %/°C" : null) +
        filaTabla("Anti sombra", typeof x.anti_sombra === "object" && x.anti_sombra ? x.anti_sombra.explicacion || (x.anti_sombra.valor ? "Sí" : "No") : x.anti_sombra === true ? "Sí" : x.anti_sombra === false ? "No" : x.anti_sombra) +
        filaTabla("Anti polvo", typeof x.anti_polvo === "object" && x.anti_polvo ? x.anti_polvo.explicacion || (x.anti_polvo.valor ? "Sí" : "No") : x.anti_polvo) +
        filaTabla("Dimensiones", x.dimensiones_mm) + filaTabla("Peso", x.peso_kg != null ? x.peso_kg + " kg" : null) +
        filaTabla("Garantía de producto", x.garantia_producto_anios != null ? x.garantia_producto_anios + " años" : null) + filaTabla("Garantía de potencia", x.garantia_potencia) +
        filaTabla("Precio aprox.", x.precio_cop_aprox ? (typeof x.precio_cop_aprox === "number" ? cop(x.precio_cop_aprox) : x.precio_cop_aprox) : null);
    } else {
      filas = filaTabla("Potencia AC", x.potencia_ac_w != null ? num(x.potencia_ac_w) + " W" : null) + filaTabla("Salida", x.salida) + filaTabla("MPPT", x.mppt) +
        filaTabla("Entradas de paneles", x.entradas_paneles) + filaTabla("Voltaje DC máx.", x.vdc_max != null ? x.vdc_max + " V" : null) + filaTabla("Rango MPPT", x.rango_mppt) +
        filaTabla("Eficiencia máx.", x.eficiencia_max != null ? x.eficiencia_max + " %" : null) + filaTabla("Protección", x.proteccion_ip) + filaTabla("Monitoreo", x.monitoreo) +
        filaTabla("Certificaciones", x.certificaciones) + filaTabla("Garantía", x.garantia_anios != null ? x.garantia_anios + " años" : null) +
        filaTabla("Precio aprox.", x.precio_cop_aprox ? (typeof x.precio_cop_aprox === "number" ? cop(x.precio_cop_aprox) : x.precio_cop_aprox) : null);
    }
    var sello = "";
    if (clase === "inv") {
      var red = (x.certificaciones || []).filter(function (c) { return /UL\s*1741|62109/i.test(c); });
      sello = x.tipo === "offgrid"
        ? '<p class="sello sello-off">Off grid: no inyecta energía a la red, así que no necesita certificado de conexión del operador.</p>'
        : red.length ? '<p class="sello">Certificado para conexión a la red · ' + esc(red.join(" · ")) + "</p>"
        : '<p class="sello sello-falta">Su ficha no muestra UL 1741 ni IEC 62109: el operador de red puede no aprobarlo.</p>';
    }
    var vent = (x.ventajas || x.otras_ventajas || []).map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("");
    return "<h3>" + esc(x.marca + " " + x.modelo) + "</h3><p class=\"ficha-tipo\">" + (esPanel ? "Panel solar" : TIPOS[x.tipo] || "Inversor") + "</p>" + sello + "<table>" + filas + "</table>" +
      (vent ? "<ul>" + vent + "</ul>" : "") + (x.url_ficha ? '<p style="margin-top:16px"><a href="' + esc(x.url_ficha) + '" target="_blank" rel="noopener">Ficha técnica del fabricante</a></p>' : "");
  }
  function potTxt(v) { return v && typeof v === "object" ? (v.rango ? v.rango + " W" : "") + (v.modelo_650 ? " (" + v.modelo_650 + ")" : "") : v; }
  function valorFila(x, clase) {
    if (clase === "bat") return num(x.kwh, 2) + " kWh · " + (x.ciclos ? ((String(x.ciclos).match(/\d[\d.]*/) || [""])[0]) + " ciclos" : "");
    if (clase === "panel") { var pt = x.potencia_w && typeof x.potencia_w === "object" ? x.potencia_w.rango : x.potencia_w; return String(pt).replace(/~/g, "–") + " W · " + (x.garantia_producto_anios || "—") + " años"; }
    var cert = x.tipo !== "offgrid" && (x.certificaciones || []).some(function (c) { return /UL\s*1741|62109/i.test(c); });
    return (x.potencia_ac_w ? num(x.potencia_ac_w / 1000, 1) + " kW" : "") + " · " + (x.garantia_anios || "—") + " años" + (cert ? " · certificado red" : "");
  }
  function mostrar(x, clase, fila) {
    $$(".fila", listas).forEach(function (f) { f.classList.toggle("activa", f === fila); });
    if (window.matchMedia("(max-width:1000px)").matches) {
      var det = fila.nextElementSibling, abierto = !det.hidden;
      $$(".fila-ficha", listas).forEach(function (d) { d.hidden = true; });
      $$(".fila", listas).forEach(function (f) { f.setAttribute("aria-expanded", "false"); });
      if (!abierto) { det.innerHTML = fichaHTML(x, clase); det.hidden = false; fila.setAttribute("aria-expanded", "true"); }
      return;
    }
    ficha.classList.add("cambiando");
    setTimeout(function () { ficha.innerHTML = fichaHTML(x, clase); ficha.classList.remove("cambiando"); }, reduce ? 0 : 120);
  }
  if (!listas) { /* el catálogo de equipos ahora vive en el portal del equipo técnico */ }
  else if (EQ && (EQ.inversores || EQ.paneles)) {
    listas.innerHTML = "";
    var grupos = [
      ["Microinversores", (EQ.inversores || []).filter(function (x) { return x.tipo === "micro"; }), "inv"],
      ["Inversores on grid", (EQ.inversores || []).filter(function (x) { return x.tipo === "ongrid"; }), "inv"],
      ["Inversores híbridos", (EQ.inversores || []).filter(function (x) { return x.tipo === "hibrido"; }), "inv"],
      ["Inversores off grid", (EQ.inversores || []).filter(function (x) { return x.tipo === "offgrid"; }), "inv"],
      ["Paneles premium", EQ.paneles || [], "panel"],
      ["Baterías de 48 V", EQ.baterias || [], "bat"]
    ];
    var primero = null;
    grupos.forEach(function (g) {
      if (!g[1].length) return;
      var div = document.createElement("div"); div.innerHTML = '<h3 class="grupo-titulo">' + g[0] + "</h3>";
      g[1].forEach(function (x) {
        var b = document.createElement("button"); b.type = "button"; b.className = "fila"; b.setAttribute("aria-expanded", "false");
        b.innerHTML = '<span class="fila-nombre">' + esc(x.marca + " " + x.modelo) + '</span><span class="fila-valor">' + esc(valorFila(x, g[2])) + "</span>";
        var det = document.createElement("div"); det.className = "fila-ficha"; det.hidden = true;
        b.addEventListener("mouseenter", function () { if (!window.matchMedia("(max-width:1000px)").matches) { indice.classList.add("enfoque"); mostrar(x, g[2], b); } });
        b.addEventListener("focus", function () { if (!window.matchMedia("(max-width:1000px)").matches) mostrar(x, g[2], b); });
        b.addEventListener("click", function () { mostrar(x, g[2], b); });
        div.appendChild(b); div.appendChild(det);
        if (!primero) primero = [x, g[2], b];
      });
      listas.appendChild(div);
    });
    listas.addEventListener("mouseleave", function () { indice.classList.remove("enfoque"); });
    if (primero) ficha.innerHTML = fichaHTML(primero[0], primero[1]);
  } else {
    listas.innerHTML = '<p class="nota">El catálogo de equipos no está disponible en este momento.</p>';
  }

  /* =================== KITS =================== */
  var campos = $("#kits-campos");
  function pintarKits(tipo) {
    campos.innerHTML = GT.ESCENARIOS.map(function (e) {
      var k = e[tipo];
      var bat = k.baterias ? ", " + k.baterias + (k.baterias === 1 ? " batería" : " baterías") + " LiFePO4 de 51,2 V " + (k.bat10 ? "200" : "100") + " Ah (" + num(k.kwhBat, 1) + " kWh)" : ", sin baterías";
      var etapas = tipo !== "hibrido" ? "" : '<ol class="etapas-kit">' + e.etapas.map(function (s) {
        return '<li><span class="etapa-n">Etapa ' + s.n + '</span><span class="etapa-que">' + esc(s.que) + '</span><span class="etapa-precio">' + cop(s.precio) + "</span></li>";
      }).join("") + "</ol>";
      var dia = tipo === "offgrid" ? " Las baterías cubren la noche y un día nublado de consumo moderado." : tipo === "hibrido" ? " Las baterías sostienen la casa en un apagón y cubren parte de la noche." : " La red cubre la noche; los excedentes del día se descuentan de la factura.";
      var foto = "fotos/kit-" + ["semilla", "raiz", "bosque"][e.id - 1] + "-" + tipo + ".svg";
      return '<article class="kit"><figure class="kit-foto"><img src="' + foto + '" alt="' + esc("Ilustración animada del " + k.nombre + ": " + k.paneles + " paneles de 650 W en pares" + (k.baterias ? " con " + k.baterias + (k.baterias === 1 ? " batería" : " baterías") : "")) + '" width="900" height="600" loading="lazy"></figure><h3>' + esc(k.nombre) + '</h3><p class="kit-para">' + esc(e.titulo) + " · " + e.consumo + ". " + esc(e.para) + '</p>' +
        '<p class="kit-contenido">' + k.paneles + " paneles de 650 W (" + num(k.kwp, 1) + " kWp), " + esc(k.inversor) + bat + ", estructura, protecciones DC y AC, cableado e instalación." + dia + "</p>" + etapas +
        (k.wifi.incluido
          ? '<p class="kit-wifi"><strong>Monitoreo wifi incluido:</strong> producción, consumo' + (k.baterias ? " y carga de baterías" : "") + " desde el celular, " + esc(k.wifi.app) + ".</p>"
          : '<label class="kit-wifi kit-wifi-opcion"><input type="checkbox" data-wifi="' + k.total + '"> <span><strong>Sin monitoreo de fábrica.</strong> Agregar módulo wifi para ver producción y baterías en el celular: +' + cop(k.wifi.extra) + "</span></label>") +
        '<div class="kit-pie"><div><p class="kit-precio">' + cop(k.total) + '</p><p class="kit-precio-nota">' + (tipo === "hibrido" ? "total instalado, pagado por etapas" : "precio estimado instalado") + '</p></div>'  +
        '<a class="boton" href="#contacto" data-kit="' + esc(k.nombre) + '">Cotizar este kit</a></div></article>';
    }).join("");
    $$("[data-kit]", campos).forEach(function (a) { a.addEventListener("click", function () {
      var w = a.closest(".kit").querySelector("[data-wifi]");
      estado.kit = a.dataset.kit + (w ? (w.checked ? " con monitoreo wifi" : " sin monitoreo wifi") : "");
    }); });
    $$("[data-wifi]", campos).forEach(function (w) { w.addEventListener("change", function () {
      w.closest(".kit").querySelector(".kit-precio").textContent = cop(+w.dataset.wifi + (w.checked ? GT.PRECIOS.wifi : 0));
    }); });
  }
  var tiposKit = ["ongrid", "offgrid", "hibrido"];
  var activarKit = pestanas($(".kits-tipos"), function (t) { pintarKits(t.dataset.tipo); });
  pintarKits("ongrid");

  /* comparador de los nueve kits */
  var TIPOS_KIT = [["ongrid", "On grid"], ["hibrido", "Híbrido"], ["offgrid", "Off grid"]];
  $("#comparar-cuerpo").innerHTML = GT.ESCENARIOS.map(function (e) {
    return TIPOS_KIT.map(function (t, j) {
      var k = e[t[0]];
      return "<tr" + (j === 0 ? ' class="primera"' : "") + ">" + (j === 0 ? '<th scope="rowgroup" rowspan="3">' + esc(k.nombre.split(" ")[1]) + "</th>" : "") +
        '<th scope="row">' + t[1] + "</th><td data-l=\"Potencia\">" + num(k.kwp, 1) + " kWp</td><td data-l=\"Baterías\">" + (k.baterias ? num(k.kwhBat, 1) + " kWh" : "—") + "</td>" +
        "<td data-l=\"Luz en apagón\">" + (t[0] === "ongrid" ? "No" : "Sí") + "</td><td data-l=\"Entrega a la red\">" + (t[0] === "offgrid" ? "No, aislado" : "Sí, con contador bidireccional") + "</td>" +
        "<td data-l=\"Monitoreo wifi\">" + (k.wifi.incluido ? "Incluido" : "Opcional +" + cop(k.wifi.extra)) + '</td><td class="num" data-l="Precio instalado">' + cop(k.total) + "</td></tr>";
    }).join("");
  }).join("");
  $("#r-kit").addEventListener("click", function () {
    if (this.dataset.esc) { estado.kit = GT.ESCENARIOS[+this.dataset.esc][estado.tipo].nombre; activarKit(tiposKit.indexOf(estado.tipo)); }
  });

  /* =================== PERFIL DEL CLIENTE =================== */
  var TARIFA = { hogar: 950, mipyme: 1150 };
  $$("[data-perfil]").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = b.dataset.perfil;
      $$("[data-perfil]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      document.body.dataset.perfil = p; estado.perfil = b.querySelector("h3").textContent;
      if (TARIFA[p]) { $("#tarifa").value = TARIFA[p]; calcular(); }
      var pin = $("#p-inmueble"); if (pin) { pin.value = p === "empresa" ? "industria" : p === "mipyme" ? "negocio" : "casa"; pin.dispatchEvent(new Event("change")); }
    });
  });

  /* =================== PREGUNTAS: una abierta a la vez =================== */
  var tarjetas = $$(".tarjeta");
  tarjetas.forEach(function (t) { t.addEventListener("toggle", function () { if (t.open) tarjetas.forEach(function (o) { if (o !== t) o.open = false; }); }); });

  /* =================== CALCULA TU PROYECTO: ¿kit o a medida? =================== */
  var WA = "573143103824", fp = $("#cupon"), pCiudad = $("#p-ciudad");
  GT.CIUDADES.forEach(function (c, i) { pCiudad.insertAdjacentHTML("beforeend", '<option value="' + i + '">' + c.n + "</option>"); });
  pCiudad.insertAdjacentHTML("beforeend", '<option value="otra">Otra ciudad</option>');
  pCiudad.value = String(GT.CIUDADES.findIndex(function (c) { return c.n === "Neiva"; }));
  var NOMBRE_SIS = { ongrid: "On grid", hibrido: "Híbrido", offgrid: "Off grid", nose: "Por definir" };
  var KIT_KWP = [3.9, 6.5, 10.4];
  function veredicto() {
    var kwh = Math.max(0, +$("#p-kwh").value || 0);
    var ci = pCiudad.value === "otra" ? null : GT.CIUDADES[+pCiudad.value];
    var hsp = ci ? ci.hsp : 4.7;
    var inm = fp.inmueble.value, red = fp.red.value;
    var sis = fp.sistema.value;
    if (sis === "nose") sis = red === "sin" ? "offgrid" : "ongrid";
    var kwp = kwh / (hsp * 30 * GT.PR);
    var paneles = Math.max(2, Math.ceil(kwp * 1000 / GT.PANEL_W / 2) * 2); // en pares
    var razones = [];
    if (red === "sin" && sis !== "offgrid") { razones.push("Sin conexión a la red solo funciona un sistema off grid; lo diseñamos con baterías."); sis = "offgrid"; }
    if (red === "tri") razones.push("La conexión trifásica necesita un inversor trifásico, que no está en los kits.");
    if (inm === "industria") razones.push("Una industria o bodega requiere estudio de cargas y diseño eléctrico propio (línea empresarial).");
    if (inm === "electrolinera") razones.push("Una electrolinera se evalúa con el sitio, el flujo de carros y el espacio para 60 a 90 paneles.");
    if (inm === "apto") razones.push("En un apartamento hay que validar el acceso a la cubierta con la copropiedad.");
    if (fp.especiales.checked) razones.push("Los equipos médicos o de laboratorio necesitan respaldo y protecciones a medida.");
    if (fp.techo.checked) razones.push("Un techo con sombra o difícil necesita estudio de sombras y estructura especial.");
    if (fp.motores.checked && sis !== "ongrid") razones.push("Los motores o bombas grandes exigen un inversor con más capacidad de arranque.");
    var e = -1;
    for (var i = 0; i < KIT_KWP.length; i++) if (kwp <= KIT_KWP[i] * 1.05) { e = i; break; }
    if (e < 0) razones.push("Tu consumo (" + num(kwh) + " kWh/mes) supera el kit más grande; se diseña con " + paneles + " paneles (" + num(paneles * 0.65, 1) + " kWp).");
    if (red === "mono" && e > 0) razones.push("Con red monofásica de 120 V los kits de 6 y 10 kW (240 V) no aplican; hay que revisar la acometida o diseñar en 120 V.");
    if (fp.aires.checked && e === 0) e = 1;
    var aMedida = razones.length > 0 && !(razones.length === 1 && inm === "apto" && e >= 0);
    var caja = $("#veredicto"), texto;
    if (kwh <= 0) { caja.innerHTML = '<p class="v-tit">Escribe tu consumo mensual</p><p>Está en tu recibo de luz como «consumo» o «promedio».</p>'; return ""; }
    if (!aMedida && e >= 0) {
      var k = GT.ESCENARIOS[e][sis];
      caja.className = "veredicto v-kit";
      caja.innerHTML = '<p class="v-eti">Se adapta a un kit</p><p class="v-tit">' + esc(k.nombre) + '</p><ul><li>' + k.paneles + ' paneles de 650 W · ' + num(k.kwp, 1) + ' kWp</li><li>' + esc(k.inversor) + '</li>' + (k.baterias ? '<li>' + k.baterias + ' baterías LiFePO4 · ' + num(k.kwhBat, 1) + ' kWh</li>' : '') + '<li>Necesitas unos ' + num(kwp, 1) + ' kWp para tu consumo</li></ul><p class="v-precio">' + cop(k.total) + ' <span>estimado instalado</span></p>' + (razones.length ? '<p class="v-ojo">' + esc(razones[0]) + '</p>' : '');
      texto = "Se adapta al " + k.nombre + " (" + cop(k.total) + " estimado)";
    } else {
      caja.className = "veredicto v-medida";
      caja.innerHTML = '<p class="v-eti">Proyecto a tu medida</p><p class="v-tit">' + NOMBRE_SIS[sis] + ' · unos ' + num(Math.max(kwp, 0.65), 1) + ' kWp</p><ul>' + razones.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + '</ul><p class="v-ojo">Hacemos visita técnica, diseño y cotización sin costo.</p>';
      texto = "Proyecto a la medida (" + NOMBRE_SIS[sis] + ", ~" + num(kwp, 1) + " kWp). " + razones.join(" ");
    }
    return texto;
  }
  $$("#cupon input, #cupon select").forEach(function (el) { el.addEventListener("input", veredicto); el.addEventListener("change", veredicto); });
  $("#p-usar").addEventListener("click", function () {
    var kwh = parseInt(String($("#r-consumo").textContent).replace(/\D/g, ""), 10);
    if (kwh) $("#p-kwh").value = kwh;
    pCiudad.value = selCiudad.value || pCiudad.value;
    var con = $("#conexion"); if (con && (con.value === "bi" || con.value === "mono")) fp.red.value = con.value;
    var meta = $("input[name=meta]:checked"); if (meta && GT.METAS) fp.sistema.value = GT.METAS[+meta.value].tipo;
    veredicto();
  });
  campos.addEventListener("click", function (ev) { var a = ev.target.closest("[data-kit]"); if (!a) return; var t = $(".kits-tipos [aria-selected=true]"); if (t) fp.sistema.value = t.dataset.tipo; setTimeout(veredicto, 0); });
  veredicto();
  /* ---------- Confirmar solicitud de servicio ---------- */
  var dlg = $("#solicitud"), sf = $("#sol-form"), fotos = [], gps = "";
  function opt(sel) { return sel.options[sel.selectedIndex].text; }
  function calculo() {
    var extras = ["aires", "motores", "especiales", "techo"].filter(function (n) { return fp[n].checked; }).map(function (n) { return fp[n].parentNode.textContent.trim(); });
    return [["Consumo", $("#p-kwh").value + " kWh/mes"], ["Ciudad", opt(pCiudad)], ["Inmueble", opt(fp.inmueble)], ["Sistema", opt(fp.sistema)], ["Conexión", opt(fp.red)]]
      .concat(extras.length ? [["Además", extras.join(", ")]] : []).concat([["Resultado", veredicto()]]);
  }
  fp.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!(+$("#p-kwh").value > 0)) { $("#p-kwh").focus(); return; }
    $("#sol-calculo").innerHTML = "<dl>" + calculo().map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>";
    if (!sf.municipio.value && pCiudad.value !== "otra") sf.municipio.value = opt(pCiudad) + ", ";
    $("#sol-listo").hidden = true; $(".sol-acciones", sf).hidden = false; $("#sol-error").textContent = "";
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  });
  $$("[data-cerrar]", dlg).forEach(function (b) { b.addEventListener("click", function () { dlg.close ? dlg.close() : dlg.removeAttribute("open"); }); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });

  $("#sol-gps").addEventListener("click", function () {
    var t = $("#sol-gps-txt");
    if (!navigator.geolocation) { t.textContent = "Tu navegador no comparte la ubicación; escribe la dirección."; return; }
    t.textContent = "Buscando tu ubicación…";
    navigator.geolocation.getCurrentPosition(function (p) {
      gps = "https://maps.google.com/?q=" + p.coords.latitude.toFixed(6) + "," + p.coords.longitude.toFixed(6);
      t.innerHTML = 'Ubicación agregada (±' + Math.round(p.coords.accuracy) + ' m). <a href="' + gps + '" target="_blank" rel="noopener">Ver en el mapa</a>';
    }, function () { t.textContent = "No pudimos leer la ubicación; escribe la dirección o comparte la ubicación en WhatsApp."; }, { enableHighAccuracy: true, timeout: 12000 });
  });

  // Fotos: se reducen a 1600 px para que viajen rápido.
  function reducir(file) {
    return new Promise(function (ok) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { URL.revokeObjectURL(url); ok(b ? new File([b], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ok(file); };
      img.src = url;
    });
  }
  function pintarFotos() {
    var box = $("#sol-miniaturas");
    box.innerHTML = "";
    fotos.forEach(function (f, i) {
      var d = document.createElement("div"), im = document.createElement("img"), x = document.createElement("button");
      d.className = "sol-mini"; im.src = URL.createObjectURL(f); im.alt = "Foto " + (i + 1) + " del sitio";
      x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "Quitar foto " + (i + 1));
      x.addEventListener("click", function () { fotos.splice(i, 1); pintarFotos(); });
      d.appendChild(im); d.appendChild(x); box.appendChild(d);
    });
  }
  $("#sol-fotos").addEventListener("change", function (e) {
    var nuevas = [].slice.call(e.target.files || []).filter(function (f) { return /^image\//.test(f.type); }).slice(0, 8 - fotos.length);
    Promise.all(nuevas.map(reducir)).then(function (lista) { fotos = fotos.concat(lista); pintarFotos(); });
    e.target.value = "";
  });

  function textoSolicitud(num) {
    var f = sf, lineas = ["*Solicitud de servicio Greentech " + num + "*", "", "*Cálculo del proyecto*"];
    calculo().forEach(function (r) { lineas.push(r[0] + ": " + r[1]); });
    lineas.push("", "*Ubicación*", f.municipio.value.trim() + (f.direccion.value.trim() ? " · " + f.direccion.value.trim() : ""));
    if (gps) lineas.push(gps);
    lineas.push("", "*Servicio*", f.instalacion.value, "Presupuesto aproximado: " + f.presupuesto.value);
    if (f.especificaciones.value.trim()) lineas.push("Especificaciones: " + f.especificaciones.value.trim());
    lineas.push("Fotos del sitio: " + (fotos.length ? fotos.length + " (adjuntas)" : "no adjuntó"));
    lineas.push("", "*Contacto*", f.nombre.value.trim(), "Tel/WhatsApp: " + f.telefono.value.trim(), "Correo: " + f.correo.value.trim());
    return lineas.join("\n");
  }
  var puedeCompartir = function (files) { try { return !!(navigator.canShare && navigator.canShare({ files: files, text: "x" })); } catch (e) { return false; } };
  sf.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#sol-error"), faltan = [];
    if (!sf.municipio.value.trim()) faltan.push(sf.municipio);
    if (!sf.nombre.value.trim()) faltan.push(sf.nombre);
    if (sf.telefono.value.replace(/\D/g, "").length < 7) faltan.push(sf.telefono);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sf.correo.value.trim())) faltan.push(sf.correo);
    if (!sf.datos.checked) faltan.push(sf.datos);
    if (faltan.length) { err.textContent = "Revisa: ubicación, nombre, número, un correo válido y la autorización de datos."; faltan[0].focus(); return; }
    err.textContent = "";
    var d = new Date(), num = "GT-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    var texto = textoSolicitud(num), wa = "https://wa.me/" + WA + "?text=" + encodeURIComponent(texto);
    $("#sol-num").textContent = "Solicitud " + num + " confirmada";
    $("#sol-wa").href = wa;
    $(".sol-acciones", sf).hidden = true; $("#sol-listo").hidden = false;
    var comp = $("#sol-compartir");
    if (fotos.length && puedeCompartir(fotos)) {
      comp.hidden = false;
      $("#sol-fotos-aviso").textContent = "Usa «Compartir solicitud con fotos» y elige WhatsApp para enviar todo junto.";
      comp.onclick = function () { navigator.share({ title: "Solicitud " + num, text: texto, files: fotos }).catch(function () {}); };
    } else {
      comp.hidden = true;
      $("#sol-fotos-aviso").textContent = fotos.length ? "Adjunta tus " + fotos.length + " fotos en ese mismo chat (el enlace de WhatsApp solo lleva texto)." : "Si tienes fotos del sitio, envíalas en ese mismo chat.";
      window.open(wa, "_blank", "noopener");
    }
    $("#sol-listo").scrollIntoView({ block: "nearest" });
  });

  /* =================== PIE: marca en bloques =================== */
  var pm = $("#pie-marca"), colores = ["var(--verde-5)", "var(--lima)", "var(--verde-3)", "var(--ambar)", "var(--verde-4)", "var(--lima)", "var(--verde-5)", "var(--verde-3)", "var(--ambar)"];
  "GREENTECH".split("").forEach(function (ch, i) {
    var b = document.createElement("span"); b.className = "bloque"; b.textContent = ch;
    b.style.setProperty("--c", colores[i]); b.style.height = (60 + ((i * 37) % 41)) + "%"; b.style.setProperty("--d", (i * 60) + "ms");
    pm.appendChild(b);
  });
})();

/* ===== Tipos de Sistemas Fotovoltaicos: carrusel con avance automático ===== */
(function () {
  var ts = document.querySelector("[data-ts]");
  if (!ts) return;
  var tabs = [].slice.call(ts.querySelectorAll(".ts-tab"));
  var slides = [].slice.call(ts.querySelectorAll(".ts-slide"));
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DUR = 11000, actual = 0, t0 = performance.now(), pausa = quieto, dentro = false, visible = false, manual = false;
  var btnPausa = ts.querySelector("[data-ts-pausa]");
  function ir(i, foco) {
    actual = (i + slides.length) % slides.length;
    leido = 0;
    slides.forEach(function (s, k) {
      var on = k === actual;
      if (on) { s.hidden = false; s.setAttribute("data-activa", ""); } else { s.removeAttribute("data-activa"); s.hidden = true; }
    });
    tabs.forEach(function (t, k) {
      var on = k === actual;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      t.querySelector(".ts-prog").style.transform = "scaleX(0)";
    });
    if (foco) tabs[actual].focus();
    t0 = performance.now();
  }
  tabs.forEach(function (t, k) {
    t.addEventListener("click", function () { manual = true; ir(k); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { manual = true; ir(actual + 1, true); e.preventDefault(); }
      if (e.key === "ArrowLeft") { manual = true; ir(actual - 1, true); e.preventDefault(); }
    });
  });
  ts.querySelector("[data-ts-prev]").addEventListener("click", function () { ir(actual - 1); });
  ts.querySelector("[data-ts-next]").addEventListener("click", function () { ir(actual + 1); });
  function marcarPausa() { btnPausa.textContent = pausa ? "▶" : "❚❚"; btnPausa.setAttribute("aria-label", pausa ? "Reanudar el carrusel" : "Pausar el carrusel"); }
  btnPausa.addEventListener("click", function () { pausa = !pausa; t0 = performance.now() - (pausa ? 0 : 0); marcarPausa(); });
  marcarPausa();
  ts.addEventListener("pointerenter", function () { dentro = true; });
  ts.addEventListener("pointerleave", function () { dentro = false; t0 = performance.now() - leido; });
  ts.addEventListener("focusin", function () { dentro = true; });
  ts.addEventListener("focusout", function () { dentro = false; });
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.35 }).observe(ts);
  var leido = 0;
  var dlg = document.querySelector("[data-ts-dialogo]");
  function ciclo(now) {
    var quieta = pausa || dentro || !visible || (dlg && dlg.open);
    if (quieta) { t0 = now - leido; } else { leido = now - t0; }
    var f = Math.min(1, leido / DUR);
    var bar = tabs[actual].querySelector(".ts-prog");
    bar.style.transform = "scaleX(" + f.toFixed(4) + ")";
    if (!quieta && f >= 1) { leido = 0; ir(actual + 1); }
    requestAnimationFrame(ciclo);
  }
  requestAnimationFrame(ciclo);
  // figura animada en un diálogo
  if (dlg) {
    var frame = dlg.querySelector("iframe");
    [].slice.call(document.querySelectorAll("[data-figura]")).forEach(function (b) {
      b.addEventListener("click", function () {
        if (frame.getAttribute("src") !== b.dataset.figura) frame.setAttribute("src", b.dataset.figura);
        if (dlg.showModal) dlg.showModal(); else window.open(b.dataset.figura, "_blank");
      });
    });
    dlg.querySelector("[data-ts-cerrar]").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  }
})();
