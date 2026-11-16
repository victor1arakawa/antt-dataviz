/* Interface: esquema dos controles de Design e construtores de campos. */
(function () {
  'use strict';
  var AD = window.AD, h = AD.h;

  var YN = function (t) { return t; };
  AD.CONTROLS = {
    /* tamanho e layout */
    sizePresets: { group: 'layout', kind: 'presets', label: 'Dimensões predefinidas' },
    width: { group: 'layout', kind: 'slider', label: 'Largura', min: 300, max: 1000, step: 10, unit: 'px' },
    height: { group: 'layout', kind: 'slider', label: 'Altura', min: 200, max: 1400, step: 10, unit: 'px', auto: true },
    barThickness: { group: 'layout', kind: 'slider', label: 'Espessura das barras', min: 6, max: 80, step: 1, unit: 'px', auto: true },
    barSpacing: { group: 'layout', kind: 'slider', label: 'Espaço entre barras', min: 0, max: 60, step: 1, unit: 'px', auto: true },
    maxValue: { group: 'layout', kind: 'text', label: 'Valor máximo da escala', placeholder: 'Auto (aceita 100000, 50 mil, 2,5 mi)', help: 'Use o mesmo número em dois gráficos para compará-los na mesma escala.' },
    donutHole: { group: 'layout', kind: 'slider', label: 'Tamanho do círculo interno', min: 30, max: 85, step: 5, unit: '%' },
    bubbleGap: { group: 'layout', kind: 'slider', label: 'Espaço entre bolhas', min: 0, max: 20, step: 1, unit: 'px' },
    tlOrientation: { group: 'layout', kind: 'select', label: 'Orientação', options: [['vertical', 'Vertical'], ['horizontal', 'Horizontal']] },
    tlSpacing: { group: 'layout', kind: 'slider', label: 'Espaço entre eventos', min: 60, max: 220, step: 5, unit: 'px', show: function (d) { return d.tlOrientation === 'horizontal'; } },
    tlGap: { group: 'layout', kind: 'slider', label: 'Espaço entre linhas', min: 4, max: 40, step: 1, unit: 'px', show: function (d) { return d.tlOrientation !== 'horizontal'; } },
    tlCompact: { group: 'layout', kind: 'toggle', label: 'Linhas compactas' },
    /* cores */
    color: { group: 'color', kind: 'color', label: 'Cor do gráfico' },
    varyColors: { group: 'color', kind: 'toggle', label: 'Uma cor por categoria' },
    seriesColors: { group: 'color', kind: 'seriescolors' },
    labelColor: { group: 'color', kind: 'color', label: 'Cor dos rótulos', nullable: true },
    /* rótulos e valores */
    'valueLabels:h': { key: 'valueLabels', group: 'labels', kind: 'select', label: 'Rótulos de valor', options: [['outside', 'Fora das barras'], ['inside', 'Dentro das barras'], ['hide', 'Ocultar']] },
    'valueLabels:s': { key: 'valueLabels', group: 'labels', kind: 'select', label: 'Rótulos de valor', options: [['inside', 'Dentro dos segmentos'], ['total', 'Só totais'], ['both', 'Segmentos e totais'], ['hide', 'Ocultar']] },
    valueFormat: { group: 'labels', kind: 'select', label: 'Formato do valor', options: [['auto', 'Automático (mil, mi, bi)'], ['full', 'Número completo (1.000)'], ['k', 'Milhares (mil)'], ['m', 'Milhões (mi)'], ['b', 'Bilhões (bi)']] },
    prefix: { group: 'labels', kind: 'text', label: 'Prefixo', placeholder: 'R$ ' },
    suffix: { group: 'labels', kind: 'text', label: 'Sufixo', placeholder: '%' },
    decimals: { group: 'labels', kind: 'slider', label: 'Casas decimais', min: -1, max: 4, step: 1, unit: '', autoAt: -1 },
    hideZero: { group: 'labels', kind: 'toggle', label: 'Ocultar rótulos com valor 0' },
    labelScale: { group: 'labels', kind: 'slider', label: 'Tamanho dos rótulos', min: 70, max: 160, step: 5, unit: '%' },
    pieLabels: { group: 'labels', kind: 'select', label: 'Rótulos das fatias', options: [['outside', 'Fora, com linha-guia'], ['inside', 'Dentro das fatias'], ['none', 'Ocultar']] },
    pieText: { group: 'labels', kind: 'select', label: 'Conteúdo do rótulo', options: [['name-pct', 'Nome e porcentagem'], ['name-value', 'Nome e valor'], ['pct', 'Só porcentagem'], ['value', 'Só valor'], ['value-pct', 'Valor (porcentagem)'], ['name', 'Só nome']] },
    donutCenter: { group: 'labels', kind: 'select', label: 'Texto no centro', options: [['auto', 'Automático (total)'], ['custom', 'Personalizado'], ['none', 'Nenhum']] },
    donutCenterText: { group: 'labels', kind: 'text', label: 'Texto personalizado do centro', show: function (d) { return d.donutCenter === 'custom'; } },
    /* legenda */
    legend: { group: 'legend', kind: 'toggle', label: 'Mostrar legenda' },
    stroke: { group: 'legend', kind: 'toggle', label: 'Contorno nos segmentos' },
    /* opções do tipo */
    axis: { group: 'options', kind: 'toggle', label: 'Eixo de valores e grade' },
    yAxis: { group: 'options', kind: 'toggle', label: 'Eixo Y com valores' },
    pointLabels: { group: 'options', kind: 'toggle', label: 'Rótulos de valor nos pontos' },
    points: { group: 'options', kind: 'toggle', label: 'Mostrar pontos' },
    pointSize: { group: 'options', kind: 'slider', label: 'Tamanho dos pontos', min: 2, max: 10, step: 1, unit: 'px' },
    areaFill: { group: 'options', kind: 'toggle', label: 'Preenchimento de área' },
    endLabels: { group: 'options', kind: 'toggle', label: 'Nome da série no fim da linha' },
    separateScale: { group: 'options', kind: 'toggle', label: 'Escala separada por gráfico' },
    nodeWidth: { group: 'options', kind: 'slider', label: 'Largura dos nós', min: 8, max: 40, step: 1, unit: 'px' },
    nodePadding: { group: 'options', kind: 'slider', label: 'Espaço entre nós', min: 4, max: 40, step: 1, unit: 'px' },
    linkOpacity: { group: 'options', kind: 'slider', label: 'Opacidade dos fluxos', min: 10, max: 90, step: 5, unit: '%' },
    sankeyLabels: { group: 'options', kind: 'select', label: 'Rótulos dos nós', options: [['name-value', 'Nome e valor'], ['name', 'Só nome'], ['value', 'Só valor'], ['none', 'Sem rótulos']] },
    sankeyColor: { group: 'options', kind: 'select', label: 'Modo de cor', options: [['multi', 'Várias cores'], ['single', 'Cor única']] },
    iconId: { group: 'options', kind: 'icon', label: 'Ícone' },
    iconSize: { group: 'options', kind: 'slider', label: 'Tamanho do ícone', min: 12, max: 60, step: 1, unit: 'px' },
    unitPer: { group: 'options', kind: 'text', label: 'Valor de cada ícone', placeholder: 'Auto', help: 'Quanto vale cada ícone inteiro. Ícones parciais mostram frações.' },
    kfColumns: { group: 'options', kind: 'slider', label: 'Número de colunas', min: 1, max: 4, step: 1, unit: '' },
    kfIconPos: { group: 'options', kind: 'select', label: 'Posição do ícone', options: [['left', 'Esquerda'], ['right', 'Direita'], ['top', 'Acima']] },
    kfSeparators: { group: 'options', kind: 'toggle', label: 'Mostrar separadores' },
    kfPadding: { group: 'options', kind: 'slider', label: 'Margem interna', min: 4, max: 30, step: 1, unit: 'px' },
    tableLook: { group: 'options', kind: 'select', label: 'Aparência', options: [['classic', 'Clássica'], ['minimal', 'Minimalista'], ['bars', 'Com barras']] },
    calGranularity: { group: 'options', kind: 'select', label: 'Escala de tempo', options: [['months', 'Meses'], ['quarters', 'Trimestres'], ['years', 'Anos']] },
    calLang: { group: 'options', kind: 'select', label: 'Idioma', options: [['pt', 'Português'], ['en', 'English'], ['es', 'Español']] },
    calFirstMonth: { group: 'options', kind: 'select', label: 'Primeiro mês', options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) { return [m, ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][m - 1]]; }) },
    calYear: { group: 'options', kind: 'text', label: 'Ano inicial', placeholder: 'Auto' },
    calRowNames: { group: 'options', kind: 'toggle', label: 'Mostrar nomes das linhas' },
    calBands: { group: 'options', kind: 'toggle', label: 'Faixas alternadas' },
    calLines: { group: 'options', kind: 'toggle', label: 'Linhas dos meses' }
  };

  /* Controles que valem para (quase) todo tipo */
  var NO_NUM = { table: 1, timeline: 1, calendar: 1 };
  var LEGEND = { 'stacked-bar': 1, 'stacked-col': 1, 'cluster-bar': 1, line: 1, pie: 1, donut: 1, 'cluster-donut': 1, bubble: 1, timeline: 1, calendar: 1 };
  AD.controlsFor = function (chart) {
    var ids = ['sizePresets', 'width', 'height'].concat(chart.controls || []);
    if (!NO_NUM[chart.id] && chart.id !== 'keyfigures') ids = ids.concat(['valueFormat', 'prefix', 'suffix', 'decimals']);
    if (chart.id === 'keyfigures') ids = ids.concat(['valueFormat', 'prefix', 'suffix', 'decimals']);
    if (!NO_NUM[chart.id] && chart.id !== 'sankey' && chart.id !== 'keyfigures') ids.push('hideZero');
    if (chart.id !== 'table') ids.push('labelScale');
    if (!NO_NUM[chart.id] && ['hbar', 'vbar', 'stacked-bar', 'stacked-col', 'cluster-bar', 'bubble', 'pie', 'donut', 'cluster-donut', 'sankey', 'icon'].indexOf(chart.id) >= 0) ids.push('labelColor');
    if (LEGEND[chart.id]) ids.push('legend');
    var seen = {}; return ids.filter(function (i) { if (seen[i] || !AD.CONTROLS[i]) return false; seen[i] = 1; return true; });
  };

  /* Chaves de cor (séries ou categorias) para o seletor de cores */
  AD.colorKeys = function (chart, data, d) {
    if (chart.colorKeys) return chart.colorKeys(data);
    if (['pie', 'donut', 'cluster-donut', 'bubble'].indexOf(chart.id) >= 0) return data.labels;
    if (chart.multi) return data.series.map(function (s) { return s.name; });
    if (d.varyColors) return data.labels;
    return [];
  };

  /* ── Construtores ── */
  function row(label, control, help) {
    return h('div', { class: 'field' }, [h('div', { class: 'flabel', text: label }), control, help ? h('div', { class: 'fhelp', text: help }) : null]);
  }
  function setDesign(key, val) { if (val === null || val === undefined) delete AD.S.design[key]; else AD.S.design[key] = val; }

  AD.buildControl = function (id, def, chart, d, onChange) {
    var key = def.key || id, cur = d[key], kind = def.kind;
    if (key === 'valueLabels' && !cur) cur = def.options[0][0];
    var change = function (structural) { onChange(structural); };
    var data = AD.dataset(AD.S, chart);

    if (kind === 'presets') {
      var P = [['Auto', 600, null], ['16:9', 960, 540], ['4:3', 800, 600], ['Quadrado 1:1', 720, 720], ['Retrato 4:5', 640, 800], ['Vertical 9:16', 540, 960], ['A4 paisagem', 842, 595], ['A4 retrato', 595, 842]];
      var box = h('div', { class: 'chips' });
      P.forEach(function (p) {
        var on = Number(d.width) === p[1] && (p[2] == null ? !AD.S.design.height : Number(AD.S.design.height) === p[2]);
        var b = h('button', { type: 'button', class: 'chip' + (on ? ' on' : ''), text: p[0], title: p[2] ? p[1] + ' × ' + p[2] + ' px' : 'Largura 600 px, altura automática' });
        b.addEventListener('click', function () { AD.S.design.width = p[1]; if (p[2] == null) delete AD.S.design.height; else AD.S.design.height = p[2]; change(true); });
        box.appendChild(b);
      });
      return h('div', { class: 'field' }, [h('div', { class: 'flabel', text: def.label }), box, h('div', { class: 'fhelp', text: 'Define largura e altura juntas. Ajuste fino nos controles abaixo.' })]);
    }
    if (kind === 'slider') {
      var user = AD.S.design[key], isAuto = def.auto ? (user == null && (chart.defaults ? chart.defaults[key] == null : true)) : (def.autoAt != null ? Number(cur) === def.autoAt : false);
      var val = cur != null && !(def.auto && user == null) ? Number(cur) : Math.round((def.min + def.max) / 2 / def.step) * def.step;
      var out = h('span', { class: 'sval' });
      var rng = h('input', { type: 'range', min: def.min, max: def.max, step: def.step, value: val });
      var pill = def.auto ? h('button', { type: 'button', class: 'pill' + (isAuto ? ' on' : ''), text: 'Auto' }) : null;
      var show = function (auto) { out.textContent = auto || (def.autoAt != null && Number(rng.value) === def.autoAt) ? 'Auto' : rng.value + (def.unit ? ' ' + def.unit : ''); rng.classList.toggle('dim', !!auto); };
      show(isAuto && def.auto);
      rng.addEventListener('input', function () {
        setDesign(key, Number(rng.value)); if (pill) pill.classList.remove('on'); show(false); change();
      });
      if (pill) pill.addEventListener('click', function () {
        var on = !pill.classList.contains('on');
        pill.classList.toggle('on', on);
        if (on) setDesign(key, null); else setDesign(key, Number(rng.value));
        show(on); change();
      });
      return h('div', { class: 'field fslider' }, [h('div', { class: 'frow' }, [h('div', { class: 'flabel', text: def.label }), pill, out]), rng]);
    }
    if (kind === 'select') {
      var sel = h('select', {}, def.options.map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
      sel.value = String(cur);
      sel.addEventListener('change', function () { var v = sel.value; AD.S.design[key] = isNaN(v) || v === '' ? v : Number(v); change(true); });
      return row(def.label, sel);
    }
    if (kind === 'toggle') {
      var cb = h('input', { type: 'checkbox' }); cb.checked = !!cur;
      cb.addEventListener('change', function () { AD.S.design[key] = cb.checked; change(key === 'varyColors'); });
      return h('label', { class: 'check' }, [cb, h('span', { text: def.label })]);
    }
    if (kind === 'text') {
      var inp = h('input', { type: 'text', placeholder: def.placeholder || '' }); inp.value = cur == null ? '' : cur;
      inp.addEventListener('input', function () { AD.S.design[key] = inp.value; change(); });
      return row(def.label, inp, def.help);
    }
    if (kind === 'color') {
      var th = AD.themes.get(AD.S.theme), has = AD.S.design[key] != null;
      var ci = h('input', { type: 'color', value: AD.S.design[key] || (def.nullable ? th.text : th.colors[0]) });
      var reset = h('button', { type: 'button', class: 'pill' + (has ? '' : ' on'), text: 'Auto' });
      ci.addEventListener('input', function () { AD.S.design[key] = ci.value; reset.classList.remove('on'); change(); });
      reset.addEventListener('click', function () { delete AD.S.design[key]; reset.classList.add('on'); ci.value = def.nullable ? th.text : th.colors[0]; change(); });
      return h('div', { class: 'field' }, [h('div', { class: 'frow' }, [h('div', { class: 'flabel', text: def.label }), reset, ci])]);
    }
    if (kind === 'icon') {
      var cur2 = AD.ICONS[cur] || AD.ICONS.user, prev = h('span', { class: 'iconprev', html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + cur2.svg + '</svg>' });
      var btn = h('button', { type: 'button', class: 'btn small', text: cur2.name + ' — escolher…' });
      btn.addEventListener('click', function () {
        AD.openIcons(function (iid) { AD.S.design.iconId = iid; change(true); });
      });
      return row(def.label, h('div', { class: 'iconrow' }, [prev, btn]));
    }
    if (kind === 'seriescolors') {
      var keys = AD.colorKeys(chart, data, d); if (!keys.length) return null;
      var thm = AD.themes.get(AD.S.theme), wrap = h('div', { class: 'swatches' });
      keys.slice(0, 40).forEach(function (k, i) {
        var inp2 = h('input', { type: 'color', value: AD.S.seriesColors[k] || thm.colors[i % thm.colors.length] });
        inp2.addEventListener('input', function () { AD.S.seriesColors[k] = inp2.value; change(); });
        wrap.appendChild(h('label', { class: 'sw', title: k }, [inp2, h('span', { text: k || '(vazio)' })]));
      });
      var rs = h('button', { type: 'button', class: 'btn small', text: 'Restaurar cores do tema' });
      rs.addEventListener('click', function () { AD.S.seriesColors = {}; change(true); });
      return h('div', { class: 'field' }, [h('div', { class: 'flabel', text: chart.multi || ['pie', 'donut', 'cluster-donut', 'bubble'].indexOf(chart.id) < 0 && !d.varyColors ? 'Cores das séries' : 'Cores das categorias' }), wrap, rs]);
    }
    return null;
  };
})();
