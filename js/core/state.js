/* Núcleo: estado do gráfico, dados derivados, persistência e eventos. */
(function () {
  'use strict';
  var AD = window.AD;
  var KEY = 'antt-dataviz:estado:v2';

  AD.DESIGN_DEFAULTS = {
    width: 600, height: null, barThickness: null, barSpacing: null, maxValue: '',
    color: null, varyColors: null, labelColor: null, valueLabels: null,
    valueFormat: 'auto', prefix: '', suffix: '', decimals: -1, hideZero: false, labelScale: 100,
    legend: null, stroke: false, axis: null,
    // linhas
    yAxis: null, areaFill: false, points: true, pointSize: 4, pointLabels: true, endLabels: false, separateScale: false,
    // circulares
    donutHole: 60, pieLabels: 'outside', pieText: 'name-pct', donutCenter: 'auto', donutCenterText: '',
    bubbleGap: 3,
    // sankey
    nodeWidth: 18, nodePadding: 14, linkOpacity: 40, sankeyLabels: 'name-value', sankeyColor: 'multi',
    // números
    iconId: 'user', iconSize: 26, unitPer: '', kfColumns: 2, kfIconPos: 'left', kfSeparators: true, kfPadding: 12,
    // detalhe e tempo
    tableLook: 'classic', tlOrientation: 'vertical', tlSpacing: 110, tlCompact: false, tlGap: 14,
    calGranularity: 'months', calLang: 'pt', calFirstMonth: 1, calYear: '', calRowNames: true, calBands: true, calLines: true
  };

  function fresh() {
    return {
      v: 2, type: 'hbar', theme: 'antt',
      data: { headers: ['Rótulo', 'Valor'], rows: [['', ''], ['', ''], ['', '']] },
      labelCol: 0, valueCols: [], sortDesc: false,
      text: { title: '', subtitle: '', comments: '', footer: '', size: 100, width: null },
      design: {}, seriesColors: {}
    };
  }
  AD.freshState = fresh;

  function merge(base, over) {
    var o = JSON.parse(JSON.stringify(base));
    if (!over || typeof over !== 'object') return o;
    ['type', 'theme', 'labelCol', 'sortDesc'].forEach(function (k) { if (over[k] != null) o[k] = over[k]; });
    if (over.data && Array.isArray(over.data.headers) && Array.isArray(over.data.rows)) {
      o.data = { headers: over.data.headers.map(String), rows: over.data.rows.map(function (r) { return r.map(function (c) { return c == null ? '' : c; }); }) };
    }
    if (Array.isArray(over.valueCols)) o.valueCols = over.valueCols.filter(Number.isInteger);
    if (over.text) Object.assign(o.text, over.text);
    if (over.design) Object.assign(o.design, over.design);
    if (over.seriesColors) Object.assign(o.seriesColors, over.seriesColors);
    return o;
  }
  AD.mergeState = function (over) { return merge(fresh(), over); };

  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  AD.S = merge(fresh(), saved);

  /* Define o estado inteiro (carregar arquivo, link, novo) */
  AD.setState = function (s) { AD.S = merge(fresh(), s); AD.emit('structure'); };

  var listeners = [], timer = null;
  AD.on = function (fn) { listeners.push(fn); };
  AD.emit = function (kind) {
    listeners.forEach(function (fn) { fn(kind || 'render'); });
    clearTimeout(timer);
    timer = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(AD.S)); } catch (e) {} }, 300);
  };

  /* Design efetivo: valor do usuário > padrão do tipo > padrão geral */
  AD.design = function (S, chart) {
    var d = {}, def = AD.DESIGN_DEFAULTS, cd = (chart && chart.defaults) || {};
    Object.keys(def).forEach(function (k) {
      var u = S.design[k];
      d[k] = (u !== undefined && u !== null) ? u : (cd[k] !== undefined ? cd[k] : def[k]);
    });
    d.decimals = Number(d.decimals);
    return d;
  };

  /* Conjunto de dados derivado da grade */
  AD.dataset = function (S, chart) {
    var hs = S.data.headers, lc = Math.min(S.labelCol || 0, Math.max(0, hs.length - 1));
    var vc = (S.valueCols && S.valueCols.length ? S.valueCols : hs.map(function (_, i) { return i; }))
      .filter(function (i) { return i < hs.length && i !== lc; });
    var rows = S.data.rows.filter(function (r) { return r.some(function (c) { return String(c == null ? '' : c).trim() !== ''; }); });
    var items = rows.map(function (r) {
      return { label: String(r[lc] == null ? '' : r[lc]).trim(), vals: vc.map(function (i) { var n = AD.parseNum(r[i]); return n == null ? 0 : n; }), raw: r };
    });
    if (S.sortDesc && (!chart || chart.sortable !== false)) {
      var key = function (it) { return vc.length > 1 && chart && chart.multi ? it.vals.reduce(function (a, b) { return a + b; }, 0) : (it.vals[0] || 0); };
      items.sort(function (a, b) { return key(b) - key(a); });
    }
    return {
      hasData: items.length > 0, labels: items.map(function (i) { return i.label; }), items: items,
      series: vc.map(function (c, k) { return { name: String(hs[c] || ('Série ' + (k + 1))), col: c, vals: items.map(function (it) { return it.vals[k]; }) }; }),
      grid: { headers: hs, rows: rows }, labelCol: lc, valueCols: vc
    };
  };

  /* Troca o tipo de gráfico mantendo os dados */
  AD.setType = function (id) { AD.S.type = id; AD.emit('structure'); };
})();
