/* Interface: aba Gráfico (tema, filtro por finalidade e seletor agrupado de tipos). */
(function () {
  'use strict';
  var AD = window.AD, h = AD.h;
  var purpose = null;

  AD.buildChartTab = function (root) {
    root.innerHTML = '';
    /* tema */
    var sel = h('select', {}, AD.themes.all().map(function (t) { return h('option', { value: t.id, text: t.name + (AD.themes.isCustom(t.id) ? ' (meu)' : '') }); }));
    sel.value = AD.S.theme;
    sel.addEventListener('change', function () { AD.S.theme = sel.value; AD.S.seriesColors = {}; delete AD.S.design.color; AD.emit('structure'); });
    var tbtn = h('button', { type: 'button', class: 'btn small', text: 'Temas…', onclick: function () { AD.openThemes(); } });
    root.appendChild(h('div', { class: 'sech' }, [h('h3', { text: 'Tema' })]));
    root.appendChild(h('div', { class: 'themerow' }, [sel, tbtn]));

    /* tipo */
    root.appendChild(h('div', { class: 'sech' }, [h('h3', { text: 'Tipo de gráfico' })]));
    root.appendChild(h('div', { class: 'fhelp', text: 'Mostrar gráficos para…' }));
    var chips = h('div', { class: 'chips' });
    AD.PURPOSES.forEach(function (p) {
      var c = h('button', { type: 'button', class: 'chip' + (purpose === p[0] ? ' on' : ''), text: p[1] });
      c.addEventListener('click', function () { purpose = purpose === p[0] ? null : p[0]; AD.buildChartTab(root); });
      chips.appendChild(c);
    });
    if (purpose) chips.appendChild(h('button', { type: 'button', class: 'chip clear', text: 'limpar', onclick: function () { purpose = null; AD.buildChartTab(root); } }));
    root.appendChild(chips);

    AD.GROUPS.forEach(function (g) {
      var list = AD.charts.list.filter(function (c) { return c.group === g[0] && (!purpose || c.purposes.indexOf(purpose) >= 0); });
      if (!list.length) return;
      root.appendChild(h('h4', { class: 'gh', text: g[1] }));
      var grid = h('div', { class: 'cardgrid' });
      list.forEach(function (c) {
        var b = h('button', { type: 'button', class: 'tcard' + (AD.S.type === c.id ? ' on' : ''), title: c.name, 'aria-pressed': AD.S.type === c.id ? 'true' : 'false' }, [h('span', { class: 'ticon', html: c.icon }), h('span', { class: 'tname', text: c.name })]);
        b.addEventListener('click', function () { AD.setType(c.id); });
        grid.appendChild(b);
      });
      root.appendChild(grid);
    });
    if (!AD.charts.list.some(function (c) { return !purpose || c.purposes.indexOf(purpose) >= 0; })) root.appendChild(h('div', { class: 'fhelp', text: 'Nenhum gráfico para essa finalidade.' }));
  };
})();
