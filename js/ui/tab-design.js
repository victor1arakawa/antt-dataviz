/* Interface: aba Design (cartões recolhíveis gerados a partir do esquema de controles). */
(function () {
  'use strict';
  var AD = window.AD, h = AD.h;

  AD.ICON_UI = {
    layout: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
    color: '<path d="M12 3c5 5 7 8 7 11a7 7 0 0 1-14 0c0-3 2-6 7-11z"/>',
    labels: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1"/>',
    legend: '<path d="M10 6h11M10 12h11M10 18h11"/><rect x="3" y="4.5" width="3" height="3"/><rect x="3" y="10.5" width="3" height="3"/><rect x="3" y="16.5" width="3" height="3"/>',
    options: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    columns: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M10 4v16M15 4v16"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'
  };
  var collapsed = {};
  /* Cartão recolhível */
  AD.dgroup = function (id, title, icon, body) {
    var wrap = h('section', { class: 'dgroup' + (collapsed[id] ? ' closed' : '') });
    var head = h('button', { type: 'button', class: 'dgroup-head', 'aria-expanded': collapsed[id] ? 'false' : 'true' }, [
      h('span', { class: 'dgi', html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + AD.ICON_UI[icon] + '</svg>' }),
      h('span', { class: 'dgt', text: title }),
      h('span', { class: 'dgc', html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' })
    ]);
    head.addEventListener('click', function () { collapsed[id] = !collapsed[id]; wrap.classList.toggle('closed', collapsed[id]); head.setAttribute('aria-expanded', collapsed[id] ? 'false' : 'true'); });
    body.classList.add('dgroup-body');
    wrap.appendChild(head); wrap.appendChild(body);
    return wrap;
  };

  var GROUPS = [['layout', 'Tamanho e layout', 'layout'], ['color', 'Cores', 'color'], ['labels', 'Rótulos e valores', 'labels'], ['legend', 'Legenda', 'legend'], ['options', 'Opções do tipo de gráfico', 'options']];

  AD.buildDesignTab = function (root) {
    root.innerHTML = '';
    var chart = AD.charts.byId[AD.S.type]; if (!chart) return;
    var d = AD.design(AD.S, chart), ids = AD.controlsFor(chart);
    var scroll = root.parentNode ? root.parentNode.scrollTop : 0;
    var onChange = function (structural) { AD.emit(structural ? 'data' : 'render'); };
    root.appendChild(h('div', { class: 'tabintro', html: 'Ajuste tamanho, cores e rótulos do <b>' + AD.esc(chart.name) + '</b>. “Auto” usa o padrão do tipo de gráfico.' }));
    GROUPS.forEach(function (g) {
      var body = h('div', {}), n = 0;
      ids.forEach(function (id) {
        var def = AD.CONTROLS[id]; if (def.group !== g[0]) return;
        if (def.show && !def.show(d)) return;
        var cdef = def, key = def.key || id;
        var dd = d;
        if (key === 'valueLabels' && !d.valueLabels) dd = Object.assign({}, d, { valueLabels: def.options[0][0] });
        if (key === 'legend' && AD.S.design.legend == null) dd = Object.assign({}, d, { legend: chart.legendDefault ? chart.legendDefault(d) : !!(chart.defaults && chart.defaults.legend) });
        var el = AD.buildControl(id, cdef, chart, dd, function (structural) {
          /* controles que mostram/escondem outros precisam recriar a aba */
          var rebuild = structural || ['tlOrientation', 'donutCenter', 'pieLabels'].indexOf(key) >= 0;
          AD.emit(rebuild ? 'data' : 'render');
        });
        if (el) { body.appendChild(el); n++; }
      });
      if (n) root.appendChild(AD.dgroup('d-' + g[0], g[1], g[2], body));
    });
    if (root.parentNode) root.parentNode.scrollTop = scroll;
  };
})();
