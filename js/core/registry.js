/* Núcleo: registro de tipos de gráfico, helpers de SVG e composição (cabeçalho + gráfico + rodapé). */
(function () {
  'use strict';
  var AD = window.AD;

  /* ── Registro ── */
  AD.PURPOSES = [['comparison', 'Comparação'], ['trend', 'Tendência'], ['part', 'Parte do todo'], ['relflow', 'Relação e fluxo'], ['single', 'Valores únicos']];
  AD.GROUPS = [['bars', 'Barras e colunas'], ['lines', 'Linhas'], ['circular', 'Circulares'], ['numbers', 'Números'], ['detail', 'Detalhe e tempo']];

  AD.charts = {
    list: [], byId: {},
    register: function (def) { AD.charts.list.push(def); AD.charts.byId[def.id] = def; }
  };

  /* ── SVG ── */
  AD.txt = function (x, y, s, o) {
    o = o || {};
    return '<text x="' + (+x).toFixed(1) + '" y="' + (+y).toFixed(1) + '" font-size="' + (+o.size || 12).toFixed(1) + '"' +
      (o.weight && o.weight !== 400 ? ' font-weight="' + o.weight + '"' : '') +
      ' fill="' + (o.fill || '#000') + '"' + (o.anchor && o.anchor !== 'start' ? ' text-anchor="' + o.anchor + '"' : '') +
      (o.family ? ' font-family="' + AD.esc(o.family) + '"' : '') + (o.italic ? ' font-style="italic"' : '') +
      (o.halo ? ' stroke="' + o.halo + '" stroke-width="3" stroke-linejoin="round" paint-order="stroke"' : '') +
      (o.opacity != null ? ' opacity="' + o.opacity + '"' : '') + '>' + AD.esc(s) + '</text>';
  };
  AD.rect = function (x, y, w, h, fill, o) {
    o = o || {};
    return '<rect x="' + (+x).toFixed(1) + '" y="' + (+y).toFixed(1) + '" width="' + Math.max(0, +w).toFixed(1) + '" height="' + Math.max(0, +h).toFixed(1) + '" fill="' + fill + '"' +
      (o.rx ? ' rx="' + o.rx + '"' : '') + (o.stroke ? ' stroke="' + o.stroke + '" stroke-width="' + (o.sw || 1) + '"' : '') + (o.opacity != null ? ' opacity="' + o.opacity + '"' : '') + '/>';
  };
  AD.line = function (x1, y1, x2, y2, stroke, sw, dash) {
    return '<line x1="' + (+x1).toFixed(1) + '" y1="' + (+y1).toFixed(1) + '" x2="' + (+x2).toFixed(1) + '" y2="' + (+y2).toFixed(1) + '" stroke="' + stroke + '" stroke-width="' + (sw || 1) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
  };

  /* Ícone da biblioteca: x,y = canto superior esquerdo; size em px */
  AD.iconSVG = function (id, x, y, size, color, sw) {
    var ic = AD.ICONS && AD.ICONS[id];
    if (!ic) return '';
    var s = size / 24;
    return '<g transform="translate(' + (+x).toFixed(1) + ' ' + (+y).toFixed(1) + ') scale(' + s.toFixed(4) + ')" fill="none" stroke="' + color + '" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + ic.svg + '</g>';
  };

  /* Legenda em linhas que quebram. items: [{label,color}] */
  AD.legend = function (ctx, items, x, y, maxW) {
    var fs = ctx.fs, sw = fs * 0.85, gap = 14, rowH = fs * 1.7, cx = x, cy = y, out = [], i;
    for (i = 0; i < items.length; i++) {
      var lab = AD.ellipsis(items[i].label, fs, 400, ctx.body, maxW - sw - 8), w = sw + 6 + AD.measure(lab, fs, 400, ctx.body);
      if (cx > x && cx + w > x + maxW) { cx = x; cy += rowH; }
      out.push(AD.rect(cx, cy + (rowH - sw) / 2 - fs * 0.15, sw, sw, items[i].color, { rx: 2 }));
      out.push(AD.txt(cx + sw + 6, cy + rowH / 2 + fs * 0.3, lab, { size: fs, fill: ctx.th.text }));
      cx += w + gap;
    }
    return { svg: out.join(''), h: cy - y + rowH };
  };

  /* ── Composição ── */
  function placeholder(msg) {
    return { svg: null, msg: msg };
  }

  AD.renderChart = function (S) {
    var chart = AD.charts.byId[S.type];
    if (!chart) return placeholder('Tipo de gráfico desconhecido.');
    var th = AD.themes.get(S.theme), d = AD.design(S, chart);
    var data = AD.dataset(S, chart);
    if (!data.hasData) return placeholder('empty');

    var scale = (Number(S.text.size) || 100) / 100, base = 13 * scale;
    var pad = 20, W = Math.max(300, Number(d.width) || 600), Wc = W - 2 * pad;
    var fs = Math.max(8, 12 * scale * (Number(d.labelScale) || 100) / 100);
    var body = th.bodyFont, titleF = th.titleFont;
    var tw = S.text.width ? Math.max(120, Math.min(Wc, Number(S.text.width))) : Wc;

    var head = [], y = pad, lines, i;
    if (String(S.text.title).trim()) {
      lines = AD.wrap(S.text.title, base * 1.75, 700, titleF, tw);
      lines.forEach(function (l) { y += base * 1.75 * 1.12; head.push(AD.txt(pad, y, l, { size: base * 1.75, weight: 700, fill: th.text, family: titleF })); });
      y += base * 0.35;
    }
    if (String(S.text.subtitle).trim()) {
      lines = AD.wrap(S.text.subtitle, base * 1.05, 400, body, tw);
      lines.forEach(function (l) { y += base * 1.05 * 1.35; head.push(AD.txt(pad, y, l, { size: base * 1.05, fill: th.muted })); });
      y += base * 0.2;
    }
    if (String(S.text.comments).trim()) {
      y += base * 0.5;
      lines = AD.wrap(S.text.comments, base * 0.95, 400, body, tw, 3);
      lines.forEach(function (l) { y += base * 0.95 * 1.4; head.push(AD.txt(pad, y, l, { size: base * 0.95, fill: th.text })); });
    }
    var headerH = y > pad ? y + base * 0.9 : pad;

    var foot = [], footH = 0;
    if (String(S.text.footer).trim()) {
      lines = AD.wrap(S.text.footer, base * 0.85, 400, body, tw);
      lines.forEach(function (l, k) { foot.push(AD.txt(pad, k * base * 0.85 * 1.35, l, { size: base * 0.85, fill: th.muted })); });
      footH = lines.length * base * 0.85 * 1.35 + base * 0.5;
    }

    var fixedH = d.height ? Number(d.height) : null;
    var bodyH = fixedH ? Math.max(80, fixedH - headerH - footH - pad) : null;

    var ctx = {
      W: Wc, H: bodyH, th: th, d: d, data: data, S: S, chart: chart, fs: fs, base: base, scale: scale, body: body, title: titleF,
      color: function (i, key) {
        var k = key != null ? key : null;
        if (k != null && S.seriesColors[k]) return S.seriesColors[k];
        return th.colors[i % th.colors.length];
      },
      single: function () { return d.color || th.colors[0]; },
      legendOn: function (def) { return d.legend == null ? !!def : !!d.legend; }
    };
    var r;
    try { r = chart.render(ctx); }
    catch (e) { console.error(e); return placeholder('Erro ao desenhar: ' + e.message); }
    if (!r) return placeholder('empty');

    var totalH = Math.ceil(headerH + r.h + (footH ? footH + base * 0.4 : 0) + pad);
    if (fixedH) totalH = Math.max(fixedH, totalH);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + totalH + '" viewBox="0 0 ' + W + ' ' + totalH + '" font-family="' + AD.esc(body) + '" role="img" aria-label="' + AD.esc(S.text.title || 'Gráfico') + '">' +
      '<rect width="' + W + '" height="' + totalH + '" fill="' + th.bg + '"/>' + head.join('') +
      '<g transform="translate(' + pad + ' ' + headerH.toFixed(1) + ')">' + r.svg + '</g>' +
      (footH ? '<g transform="translate(0 ' + (headerH + r.h + base * 0.9).toFixed(1) + ')">' + foot.join('') + '</g>' : '') + '</svg>';
    return { svg: svg, w: W, h: totalH };
  };
})();
