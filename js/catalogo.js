/* Greentech · datos base de la página (escenarios, kits, electrodomésticos, ciudades).
   Precios en COP, ESTIMADOS a noviembre de 2026 a partir de tiendas colombianas
   (ver ~/proyectos/tuproyectosolar/js/datos.js). Confirmar antes de cotizar. */
window.GT = (function () {
  var PANEL_W = 650;          // panel de referencia
  var PANEL_M2 = 2.7;         // 2,382 m × 1,134 m
  var PR = 0.8;               // rendimiento global del sistema

  var CIUDADES = [
    { n: "Bogotá", hsp: 4.6 }, { n: "Medellín", hsp: 4.7 }, { n: "Cali", hsp: 4.8 },
    { n: "Barranquilla", hsp: 5.4 }, { n: "Cartagena", hsp: 5.4 }, { n: "Santa Marta", hsp: 5.6 },
    { n: "Bucaramanga", hsp: 4.7 }, { n: "Cúcuta", hsp: 4.8 }, { n: "Pereira", hsp: 4.4 },
    { n: "Villavicencio", hsp: 4.6 }, { n: "Neiva", hsp: 5.0 }, { n: "Valledupar", hsp: 5.5 }
  ];

  /* w = potencia en vatios; h = horas de uso al día; kwhDia = para equipos con compresor
     (nevera, aire) el consumo real promedio, porque el compresor no trabaja todo el tiempo. */
  var APARATOS = [
    { g: "Iluminación", id: "led9", n: "Bombillo LED 9 W", w: 9, h: 5, c: 8 },
    { g: "Iluminación", id: "tubo18", n: "Tubo o panel LED 18 W", w: 18, h: 6, c: 0 },
    { g: "Iluminación", id: "ext", n: "Reflector LED exterior 50 W", w: 50, h: 10, c: 0 },
    { g: "Refrigeración", id: "nevera", n: "Nevera sencilla (250 L)", w: 120, kwhDia: 1.0, c: 1 },
    { g: "Refrigeración", id: "nevecon", n: "Nevecón (500 L o más)", w: 200, kwhDia: 1.8, c: 0 },
    { g: "Refrigeración", id: "congelador", n: "Congelador horizontal", w: 150, kwhDia: 1.3, c: 0 },
    { g: "Ventilación", id: "vent", n: "Ventilador de pedestal o techo", w: 60, h: 8, c: 2 },
    { g: "Ventilación", id: "aire9", n: "Aire acondicionado 9.000 BTU · 110 V", w: 850, kwhDia: 5.0, c: 0 },
    { g: "Ventilación", id: "aire110", n: "Aire acondicionado 12.000 BTU · 110 V", w: 1100, kwhDia: 6.5, c: 0 },
    { g: "Ventilación", id: "aire220", n: "Aire acondicionado 18.000 BTU · 220 V", w: 2000, kwhDia: 10.5, c: 0, v: 220 },
    { g: "Ventilación", id: "aire24", n: "Aire acondicionado 24.000 BTU · 220 V", w: 2600, kwhDia: 14.0, c: 0, v: 220 },
    { g: "Electrodomésticos", id: "tv", n: "Televisor LED 50\"", w: 100, h: 5, c: 1 },
    { g: "Electrodomésticos", id: "pc", n: "Computador de escritorio", w: 150, h: 6, c: 0 },
    { g: "Electrodomésticos", id: "portatil", n: "Portátil y cargadores", w: 60, h: 6, c: 1 },
    { g: "Electrodomésticos", id: "lavadora", n: "Lavadora", w: 500, h: 1, c: 1 },
    { g: "Electrodomésticos", id: "secadora", n: "Secadora de ropa eléctrica", w: 3000, h: 0.5, c: 0, v: 220 },
    { g: "Cocina", id: "micro", n: "Horno microondas", w: 1200, h: 0.25, c: 0 },
    { g: "Cocina", id: "horno", n: "Horno eléctrico", w: 2000, h: 0.5, c: 0 },
    { g: "Cocina", id: "estufa", n: "Estufa eléctrica de 2 puestos", w: 3000, h: 1, c: 0, v: 220 },
    { g: "Cocina", id: "parrilla", n: "Parrilla eléctrica", w: 1500, h: 0.3, c: 0 },
    { g: "Cocina", id: "airfryer", n: "Freidora de aire (airfryer)", w: 1500, h: 0.3, c: 0 },
    { g: "Cocina", id: "licuadora", n: "Licuadora", w: 400, h: 0.1, c: 1 },
    { g: "Cocina", id: "batidora", n: "Batidora", w: 250, h: 0.1, c: 0 },
    { g: "Cocina", id: "sandwichera", n: "Sandwichera", w: 750, h: 0.2, c: 0 },
    { g: "Cocina", id: "arrocera", n: "Olla arrocera", w: 700, h: 0.5, c: 0 },
    { g: "Electrodomésticos", id: "plancha", n: "Plancha de ropa", w: 1200, h: 0.3, c: 0 },
    { g: "Agua y exteriores", id: "ducha", n: "Ducha eléctrica", w: 3500, h: 0.3, c: 0 },
    { g: "Agua y exteriores", id: "calentador", n: "Calentador de agua eléctrico", w: 1500, h: 1, c: 0 },
    { g: "Agua y exteriores", id: "bomba", n: "Motobomba de agua ½ HP", w: 400, h: 1, c: 0 },
    { g: "Agua y exteriores", id: "porton", n: "Motor de portón eléctrico", w: 400, h: 0.1, c: 0 }
  ];

  /* Precios unitarios (COP), ajustados el 4-nov-2026 con la investigación de mercado
     (Autosolar, Ecozaque, Emergente; ver ~/proyectos/greentech/docs/investigacion-precios-kits.md). Confirmar antes de cotizar. */
  var P = {
    panel: 540000, estructuraPanel: 150000,
    micro225: 1150000, /* microinversor 2,25 kW, 4 entradas, 240 V (Deye SUN-M225G4 o similar) */ on6: 2400000, on10: 4000000,
    off3: 2400000, off6: 4300000, off10: 6000000,
    hib6: 7800000, hib10: 11800000,
    bateria: 4200000,   // LiFePO4 51,2 V 100 Ah ≈ 5,12 kWh
    bateria10: 7000000, // LiFePO4 51,2 V 200 Ah ≈ 10,24 kWh (bancos grandes)
    protecciones: [1100000, 1900000, 2900000], // DC + AC + DPS + tierra + cable por escenario
    instalacionPct: 0.30,      // sobre equipos sin baterías
    instalacionBatPct: 0.10,   // sobre baterías
    pisoOngridKwp: 3000000,    // precio mínimo por kWp instalado en on grid (mercado 3–4,5 M/kWp)
    tramites: 1500000,
    wifi: 300000 // módulo wifi para inversores off grid que no lo traen (Must WiFi Plug o similar)
  };

  /* bat10: número de baterías de 10,24 kWh en vez de las de 5,12 kWh */
  function kit(nombre, inversor, invPrecio, paneles, baterias, esc, bat10) {
    var sinBat = paneles * (P.panel + P.estructuraPanel) + invPrecio + P.protecciones[esc];
    var bat = bat10 ? bat10 * P.bateria10 : baterias * P.bateria;
    var kwp = paneles * PANEL_W / 1000;
    var total = sinBat * (1 + P.instalacionPct) + bat * (1 + P.instalacionBatPct) + (/off grid/.test(nombre) ? 0 : P.tramites);
    if (/on grid/.test(nombre)) total = Math.max(total, kwp * P.pisoOngridKwp);
    total = Math.round(total / 100000) * 100000;
    return { nombre: nombre, inversor: inversor, paneles: paneles, kwp: kwp,
      baterias: bat10 || baterias, kwhBat: +(bat10 ? bat10 * 10.24 : baterias * 5.12).toFixed(1), bat10: !!bat10, total: total };
  }

  var ESCENARIOS = [
    { id: 1, titulo: "Casa de un nivel", consumo: "150–300 kWh/mes",
      para: "Iluminación LED, nevera sencilla, televisor y ventiladores.",
      ongrid: kit("Kit Semilla on grid", "2 microinversores de 2,25 kW bajo los paneles (3 paneles cada uno) · salida 240 V entre fases", 2 * P.micro225, 6, 0, 0),
      offgrid: kit("Kit Semilla off grid", "Inversor-cargador off grid 3 kW · 48 V", P.off3, 6, 2, 0),
      hibrido: kit("Kit Semilla híbrido", "Inversor híbrido 6 kW · 48 V (mínimo del mercado)", P.hib6, 6, 1, 0) },
    { id: 2, titulo: "Consumo promedio", consumo: "300–700 kWh/mes",
      para: "Nevera grande, hasta tres ventiladores, lavadora y computador.",
      ongrid: kit("Kit Raíz on grid", "Inversor on grid 6 kW · 120/240 V", P.on6, 10, 0, 1),
      offgrid: kit("Kit Raíz off grid", "Inversor off grid 6 kW · 48 V · 120/240 V", P.off6, 10, 4, 1),
      hibrido: kit("Kit Raíz híbrido", "Inversor híbrido 6 kW · 48 V · 120/240 V", P.hib6, 10, 2, 1) },
    { id: 3, titulo: "Casa con aires", consumo: "700–1.200 kWh/mes",
      para: "Nevecón y uno o dos aires acondicionados de 110 V y 220 V.",
      ongrid: kit("Kit Bosque on grid", "Inversor on grid 10 kW · 120/240 V bifásico", P.on10, 16, 0, 2),
      offgrid: kit("Kit Bosque off grid", "Inversor off grid 12 kW · 48 V · 120/240 V", P.off10, 16, 0, 2, 5),
      hibrido: kit("Kit Bosque híbrido", "Inversor híbrido 10 kW · 48 V · 120/240 V", P.hib10, 16, 4, 2) }
  ];

  /* Híbrido por etapas: se instala el inversor híbrido con la mitad de los paneles y sin baterías;
     luego se completan los paneles con la primera batería y se suma una batería por etapa. */
  function etapasHibrido(e, invPrecio, esc) {
    var k = e.hibrido, p1 = Math.ceil(k.paneles / 4) * 2 /* siempre en pares */, resto = k.paneles - p1, bats = k.baterias, out = [];
    var ins = 1 + P.instalacionPct, r = function (v) { return Math.round(v / 100000) * 100000; };
    out.push({ n: 1, que: p1 + " paneles + inversor híbrido, sin baterías", detalle: "Ahorro desde el primer día; el inversor ya queda listo para baterías.",
      kwp: p1 * PANEL_W / 1000, bat: 0, precio: r((p1 * (P.panel + P.estructuraPanel) + invPrecio + P.protecciones[esc]) * ins + P.tramites) });
    var b = Math.min(1, bats);
    out.push({ n: 2, que: "+" + resto + " paneles" + (b ? " + 1 batería" : ""), detalle: b ? "Sistema completo y respaldo para apagones." : "Sistema completo.",
      kwp: k.kwp, bat: b, precio: r((resto * (P.panel + P.estructuraPanel)) * ins + b * P.bateria * 1.1) });
    var quedan = bats - b, n = 3;
    while (quedan > 0) {
      var add = n === 4 ? quedan : 1;   // máximo 4 etapas
      out.push({ n: n, que: "+" + add + (add === 1 ? " batería" : " baterías"), detalle: "Más horas de noche y de apagón cubiertas con energía solar.",
        kwp: k.kwp, bat: bats - quedan + add, precio: r(add * P.bateria * 1.1) });
      quedan -= add; n++;
    }
    var acum = 0; out.forEach(function (x) { acum += x.precio; x.acumulado = acum; });
    return out;
  }
  [[P.hib6, 0], [P.hib6, 1], [P.hib10, 2]].forEach(function (a, i) { ESCENARIOS[i].etapas = etapasHibrido(ESCENARIOS[i], a[0], a[1]); });

  /* Monitoreo por celular: Deye (micro e híbridos) y Growatt on grid traen wifi de fábrica;
     los inversores off grid de los kits lo ofrecen como módulo aparte. */
  ESCENARIOS.forEach(function (e) {
    e.ongrid.wifi = { incluido: true, app: e.id === 1 ? "app Solarman (wifi integrado en los micros Deye)" : "app ShinePhone (módulo ShineWiFi incluido)" };
    e.hibrido.wifi = { incluido: true, app: "app Solarman (registrador wifi incluido)" };
    e.offgrid.wifi = { incluido: false, extra: P.wifi, app: "app del fabricante con módulo wifi opcional" };
  });

  /* Metas del cliente (de las notas de Greentech): definen el % de ahorro y el sistema recomendado */
  var METAS = [
    { id: "mitad", n: "Bajar mi factura a la mitad", pct: 50, tipo: "ongrid" },
    { id: "minimo", n: "Comprar menos del 20 % a la red", pct: 85, tipo: "ongrid" },
    { id: "respaldo", n: "Ahorrar y tener respaldo en apagones", pct: 70, tipo: "hibrido" },
    { id: "aislado", n: "Quedar aislado de la red", pct: 100, tipo: "offgrid" }
  ];

  function produccionMes(kwp, hsp) { return kwp * hsp * 30 * PR; }

  return { PANEL_W: PANEL_W, PANEL_M2: PANEL_M2, PR: PR, CIUDADES: CIUDADES, APARATOS: APARATOS,
    ESCENARIOS: ESCENARIOS, METAS: METAS, PRECIOS: P, produccionMes: produccionMes };
})();
