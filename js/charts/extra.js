/* Gráficos: área, coluna com linha (eixo duplo), dispersão, mapa de calor e cartograma das UFs. */
(function () {
  'use strict';
  var AD = window.AD;

  function legendTop(ctx, items) {
    if (!ctx.legendOn(true) || items.length < 2) return { svg: '', h: 0 };
    var lg = AD.legend(ctx, items, 0, 0, ctx.W); return { svg: lg.svg, h: lg.h + 4 };
  }
  /* rótulos do eixo X com pulo automático; devolve a altura usada */
  function xLabels(ctx, cats, X, band, y, out) {
    var fs = ctx.fs, body = ctx.body, th = ctx.th, maxW = 0, n = cats.length;
    cats.forEach(function (c) { maxW = Math.max(maxW, AD.measure(c, fs, 400, body)); });
    var step = Math.max(1, Math.ceil((maxW + 8) / band)), lines = 0;
    cats.forEach(function (c, k) {
      if (k % step !== 0 && k !== n - 1) return;
      var ls = AD.wrap(c, fs, 400, body, Math.max(30, band * step - 6), 2); lines = Math.max(lines, ls.length);
      ls.forEach(function (ln, q) { out.push(AD.txt(X(k), y + fs * 1.45 + q * fs * 1.2, ln, { size: fs, fill: th.text, anchor: 'middle' })); });
    });
    return lines * fs * 1.2 + fs * 0.6;
  }

  /* ── Área ── */
  function area(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, body = ctx.body, cats = ctx.data.labels, n = cats.length, ser = ctx.data.series, W = ctx.W, out = [];
    if (!ser.length || !n) return null;
    var stacked = !!d.areaStack && ser.length > 1, fmt = function (v) { return AD.fmt(v, d); };
    var lo = 0, hi = 0, k;
    var low = [], up = [];
    for (k = 0; k < n; k++) {
      var acc = 0; low[k] = []; up[k] = [];
      for (var i = 0; i < ser.length; i++) {
        var v = stacked ? Math.max(0, ser[i].vals[k]) : ser[i].vals[k];
        low[k][i] = stacked ? acc : 0; acc += stacked ? v : 0; up[k][i] = stacked ? acc : v;
        hi = Math.max(hi, up[k][i]); lo = Math.min(lo, up[k][i]);
      }
    }
    var mv = AD.parseNum(d.maxValue);
    if (mv != null && mv > 0) hi = mv; else ctx.refs.forEach(function (r) { hi = Math.max(hi, r.v); lo = Math.min(lo, r.v); });
    if (hi === lo) hi = lo + 1;
    var lg = legendTop(ctx, ser.map(function (s, i) { return { label: s.name, color: ctx.color(i, s.name) }; })); out.push(lg.svg);
    var yAxis = d.yAxis !== false, sc = yAxis ? AD.niceScale(lo, hi, 4) : { min: lo, max: hi, ticks: [] };
    var axW = 0; sc.ticks.forEach(function (t) { axW = Math.max(axW, AD.measure(fmt(t), fs * 0.9, 400, body)); });
    var left = yAxis ? axW + 10 : 4, px = left, pw = Math.max(40, W - left - 8), top = lg.h + fs * 0.8;
    var X = function (q) { return n === 1 ? px + pw / 2 : px + q * pw / (n - 1); };
    var plotH = ctx.H ? Math.max(80, ctx.H - lg.h - fs * 4) : Math.round(Math.max(180, Math.min(380, W * 0.5)));
    var Y = function (v) { return top + plotH - (v - sc.min) / (sc.max - sc.min) * plotH; };
    sc.ticks.forEach(function (t) { out.push(AD.line(px, Y(t), px + pw, Y(t), th.grid, 1)); out.push(AD.txt(px - 6, Y(t) + fs * 0.3, fmt(t), { size: fs * 0.9, fill: th.muted, anchor: 'end' })); });
    var base = Y(Math.max(0, sc.min)), pt = function (x, y) { return x.toFixed(1) + ',' + y.toFixed(1); };
    var order = ser.map(function (s, q) { return q; });
    if (!stacked) order.sort(function (a, b) { return (ctx.isDim(ser[b].name) ? 1 : 0) - (ctx.isDim(ser[a].name) ? 1 : 0); });
    order.forEach(function (si) {
      var col = ser.length === 1 ? ctx.single() : ctx.color(si, ser[si].name), upP = [], loP = [];
      for (k = 0; k < n; k++) { upP.push(pt(X(k), Y(up[k][si]))); loP.unshift(pt(X(k), stacked ? Y(low[k][si]) : base)); }
      out.push('<polygon points="' + upP.concat(loP).join(' ') + '" fill="' + col + '" fill-opacity="' + (stacked ? 0.85 : 0.35) + '"/>');
      out.push('<polyline fill="none" stroke="' + col + '" stroke-width="' + (ctx.hl.length && !ctx.isDim(ser[si].name) ? 3.2 : 2) + '" stroke-linejoin="round" points="' + upP.join(' ') + '"/>');
    });
    out.push(AD.line(px, base, px + pw, base, th.muted, 1.2));
    ctx.refs.forEach(function (r) { out.push(AD.annot.refLine(ctx, r, Y(r.v), px, px + pw, true)); out.push(AD.annot.refLabel(ctx, r, px + pw, Y(r.v) - 4, 'end')); });
    var lh = xLabels(ctx, cats, X, pw / Math.max(1, n - 1), top + plotH, out);
    return { h: top + plotH + fs * 0.9 + lh, svg: out.join('') };
  }

  /* ── Coluna com linha (eixo duplo) ── */
  function combo(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, body = ctx.body, cats = ctx.data.labels, n = cats.length, ser = ctx.data.series, W = ctx.W, out = [];
    if (!ser.length || !n) return null;
    var colS = ser[0], lineS = ser.slice(1), fmt = function (v) { return AD.fmt(v, d); };
    var mv = AD.parseNum(d.maxValue);
    var hi1 = Math.max.apply(null, colS.vals.concat([0])), lo1 = Math.min.apply(null, colS.vals.concat([0]));
    if (mv != null && mv > 0) hi1 = mv;
    if (hi1 === lo1) hi1 = lo1 + 1;
    var sc1 = AD.niceScale(lo1, hi1, 4), sc2 = null;
    if (lineS.length) {
      var all = []; lineS.forEach(function (s) { all = all.concat(s.vals); });
      var lo2 = Math.min.apply(null, all.concat([0])), hi2 = Math.max.apply(null, all.concat([0])); if (hi2 === lo2) hi2 = lo2 + 1;
      sc2 = AD.niceScale(lo2, hi2, 4);
    }
    var lg = legendTop(ctx, ser.map(function (s, i) { return { label: s.name + (i === 0 ? ' (colunas)' : ''), color: ctx.color(i, s.name) }; })); out.push(lg.svg);
    var w1 = 0, w2 = 0;
    sc1.ticks.forEach(function (t) { w1 = Math.max(w1, AD.measure(fmt(t), fs * 0.9, 400, body)); });
    if (sc2) sc2.ticks.forEach(function (t) { w2 = Math.max(w2, AD.measure(fmt(t), fs * 0.9, 400, body)); });
    var left = w1 + 10, right = sc2 ? w2 + 10 : 4, pw = Math.max(60, W - left - right), band = pw / n;
    var note = lineS.length ? fs * 1.5 : 0, top = lg.h + note + fs * 1.6;
    var plotH = ctx.H ? Math.max(80, ctx.H - lg.h - note - fs * 6) : Math.round(Math.max(200, Math.min(380, W * 0.5)));
    var Y1 = function (v) { return top + plotH - (v - sc1.min) / (sc1.max - sc1.min) * plotH; };
    var Y2 = sc2 ? function (v) { return top + plotH - (v - sc2.min) / (sc2.max - sc2.min) * plotH; } : null;
    var X = function (k) { return left + (k + 0.5) * band; };
    if (lineS.length) out.push(AD.txt(0, lg.h + fs * 1.0, AD.ellipsis('Eixo esquerdo: ' + colS.name + ' · Eixo direito: ' + lineS.map(function (s) { return s.name; }).join(', '), fs * 0.9, 400, body, W), { size: fs * 0.9, fill: th.muted }));
    sc1.ticks.forEach(function (t) { out.push(AD.line(left, Y1(t), left + pw, Y1(t), th.grid, 1)); out.push(AD.txt(left - 6, Y1(t) + fs * 0.3, fmt(t), { size: fs * 0.9, fill: th.muted, anchor: 'end' })); });
    if (sc2) sc2.ticks.forEach(function (t) { out.push(AD.txt(left + pw + 6, Y2(t) + fs * 0.3, fmt(t), { size: fs * 0.9, fill: th.muted })); });
    var bw = Math.max(3, band * 0.62); if (d.barSpacing != null) bw = Math.max(3, band - d.barSpacing); if (d.barThickness) bw = Math.min(d.barThickness, band);
    var vl = d.valueLabels || 'outside', dimCol = ctx.hl.length && ctx.hl.indexOf(colS.name) < 0;
    colS.vals.forEach(function (v, k) {
      var col = d.varyColors ? ctx.color(k, cats[k]) : ctx.single();
      if (dimCol) col = AD.mix(col, th.bg, 0.72);
      var y1 = Y1(Math.max(v, 0)), y2 = Y1(Math.min(v, 0));
      out.push(AD.rect(X(k) - bw / 2, y1, bw, y2 - y1, col));
      if (vl !== 'hide' && !(d.hideZero && v === 0)) out.push(AD.txt(X(k), v >= 0 ? y1 - 4 : y2 + fs * 1.05, fmt(v), { size: fs * 0.9, fill: th.text, anchor: 'middle', halo: th.bg }));
    });
    out.push(AD.line(left, Y1(0), left + pw, Y1(0), th.muted, 1.2));
    lineS.forEach(function (s, q) {
      var col = ctx.color(q + 1, s.name), pts = s.vals.map(function (v, k) { return [X(k), Y2(v)]; });
      out.push('<polyline fill="none" stroke="' + col + '" stroke-width="' + (ctx.hl.length && !ctx.isDim(s.name) ? 3.8 : 2.5) + '" stroke-linejoin="round" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>');
      pts.forEach(function (p, k) {
        out.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="' + col + '" stroke="' + th.bg + '" stroke-width="1"/>');
        if (d.pointLabels && !(d.hideZero && s.vals[k] === 0)) out.push(AD.txt(p[0], p[1] - 8, fmt(s.vals[k]), { size: fs * 0.9, fill: col, weight: 700, anchor: 'middle', halo: th.bg }));
      });
    });
    var lh = xLabels(ctx, cats, X, band, top + plotH, out);
    return { h: top + plotH + fs * 0.9 + lh, svg: out.join('') };
  }

  /* ── Dispersão ── */
  function scatter(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, body = ctx.body, g = ctx.data.grid, W = ctx.W, out = [], fmt = function (v) { return AD.fmt(v, d); };
    var pts = [];
    g.rows.forEach(function (r) {
      var x = AD.parseNum(r[1]), y = AD.parseNum(r[2]), z = AD.parseNum(r[3]);
      if (x != null && y != null) pts.push({ l: String(r[0] == null ? '' : r[0]).trim(), x: x, y: y, z: z });
    });
    if (pts.length < 1) return null;
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var scx = AD.niceScale(Math.min.apply(null, xs.concat([0])), Math.max.apply(null, xs), 5), scy = AD.niceScale(Math.min.apply(null, ys.concat([0])), Math.max.apply(null, ys), 5);
    var axW = 0; scy.ticks.forEach(function (t) { axW = Math.max(axW, AD.measure(fmt(t), fs * 0.9, 400, body)); });
    var left = axW + 12 + fs * 1.4, pw = W - left - 14, top = fs, plotH = ctx.H ? Math.max(100, ctx.H - fs * 5) : Math.round(Math.max(240, Math.min(440, pw * 0.75)));
    var X = function (v) { return left + (v - scx.min) / (scx.max - scx.min) * pw; }, Y = function (v) { return top + plotH - (v - scy.min) / (scy.max - scy.min) * plotH; };
    scy.ticks.forEach(function (t) { out.push(AD.line(left, Y(t), left + pw, Y(t), th.grid, 1)); out.push(AD.txt(left - 6, Y(t) + fs * 0.3, fmt(t), { size: fs * 0.9, fill: th.muted, anchor: 'end' })); });
    scx.ticks.forEach(function (t) { out.push(AD.line(X(t), top, X(t), top + plotH, th.grid, 1)); out.push(AD.txt(X(t), top + plotH + fs * 1.4, fmt(t), { size: fs * 0.9, fill: th.muted, anchor: 'middle' })); });
    out.push(AD.line(left, top + plotH, left + pw, top + plotH, th.muted, 1.2)); out.push(AD.line(left, top, left, top + plotH, th.muted, 1.2));
    out.push(AD.txt(left + pw / 2, top + plotH + fs * 2.9, g.headers[1] || 'X', { size: fs, weight: 700, fill: th.text, anchor: 'middle' }));
    out.push('<text transform="translate(' + (fs * 0.9).toFixed(1) + ' ' + (top + plotH / 2).toFixed(1) + ') rotate(-90)" text-anchor="middle" font-size="' + fs.toFixed(1) + '" font-weight="700" fill="' + th.text + '">' + AD.esc(g.headers[2] || 'Y') + '</text>');
    if (d.trendLine && pts.length > 2) {
      var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0; pts.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
      var den = n * sxx - sx * sx;
      if (Math.abs(den) > 1e-12) {
        var b = (n * sxy - sx * sy) / den, a = (sy - b * sx) / n, x1 = Math.min.apply(null, xs), x2 = Math.max.apply(null, xs);
        out.push(AD.line(X(x1), Y(a + b * x1), X(x2), Y(a + b * x2), th.muted, 1.6, '6 4'));
      }
    }
    var zs = pts.map(function (p) { return p.z; }).filter(function (z) { return z != null && z > 0; }), zmax = zs.length ? Math.max.apply(null, zs) : 0;
    var rBase = Math.max(3, (Number(d.pointSize) || 4) * 1.2), boxes = [];
    pts.forEach(function (p, i) {
      var r = zmax && p.z > 0 ? Math.max(3, Math.sqrt(p.z / zmax) * rBase * 4) : rBase, col = d.varyColors ? ctx.color(i, p.l) : ctx.tone(ctx.single(), p.l);
      p.px = X(p.x); p.py = Y(p.y); p.r = r;
      out.push('<circle cx="' + p.px.toFixed(1) + '" cy="' + p.py.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + col + '" fill-opacity="0.8" stroke="' + th.bg + '" stroke-width="1"/>');
    });
    if (d.pointLabels) pts.forEach(function (p) {
      if (!p.l) return;
      var tw = AD.measure(p.l, fs * 0.9, 400, body), bx = p.px + p.r + 3, by = p.py - fs * 0.5;
      if (bx + tw > left + pw + 10) bx = p.px - p.r - 3 - tw;
      var hit = boxes.some(function (bb) { return bx < bb[2] && bx + tw > bb[0] && by < bb[3] && by + fs > bb[1]; });
      if (hit) return;
      boxes.push([bx, by, bx + tw, by + fs]);
      out.push(AD.txt(bx, by + fs * 0.85, p.l, { size: fs * 0.9, fill: th.text, halo: th.bg }));
    });
    return { h: top + plotH + fs * 3.4, svg: out.join('') };
  }

  /* ── Mapa de calor ── */
  function heatmap(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, body = ctx.body, rows = ctx.data.labels, ser = ctx.data.series, W = ctx.W, out = [], fmt = function (v) { return AD.fmt(v, d); };
    var m = ser.length, n = rows.length; if (!m || !n) return null;
    var all = []; ser.forEach(function (s) { all = all.concat(s.vals); });
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    if (lo === hi) { lo = Math.min(0, lo); if (hi === lo) hi = lo + 1; }
    var mv = AD.parseNum(d.maxValue); if (mv != null && mv > lo) hi = mv;
    var labW = 0; rows.forEach(function (l) { labW = Math.max(labW, AD.measure(l, fs, 400, body)); }); labW = Math.min(labW + 10, W * 0.3);
    var cw = (W - labW) / m, hl = 1;
    var heads = ser.map(function (s) { var w = AD.wrap(s.name, fs, 700, body, cw - 4, 2); hl = Math.max(hl, w.length); return w; });
    var hh = hl * fs * 1.2 + 8, chh = ctx.H ? Math.max(fs * 1.8, Math.min(48, (ctx.H - hh - fs * 3) / n)) : Math.max(fs * 2, 30);
    var base = d.color || ctx.single(), colorOf = function (v) { return AD.mix(th.bg, base, 0.1 + 0.9 * Math.max(0, Math.min(1, (v - lo) / (hi - lo)))); };
    ser.forEach(function (s, j) { heads[j].forEach(function (ln, q) { out.push(AD.txt(labW + j * cw + cw / 2, fs * 1.05 + q * fs * 1.2, ln, { size: fs, weight: 700, fill: th.text, anchor: 'middle' })); }); });
    rows.forEach(function (l, i) {
      var y = hh + i * chh;
      out.push(AD.txt(labW - 8, y + chh / 2 + fs * 0.33, AD.ellipsis(l, fs, 400, body, labW - 10), { size: fs, fill: th.text, anchor: 'end' }));
      ser.forEach(function (s, j) {
        var v = s.vals[i], f = colorOf(v);
        out.push(AD.rect(labW + j * cw + 1, y + 1, cw - 2, chh - 2, f, { rx: 2 }));
        if (d.valueLabels !== 'hide' && !(d.hideZero && v === 0) && AD.measure(fmt(v), fs * 0.9, 400, body) < cw - 4) out.push(AD.txt(labW + j * cw + cw / 2, y + chh / 2 + fs * 0.3, fmt(v), { size: fs * 0.9, fill: d.labelColor || AD.contrastText(f), anchor: 'middle' }));
      });
    });
    var y = hh + n * chh + fs * 1.2;
    if (ctx.legendOn(true)) {
      var gw = Math.min(220, W * 0.5), id = 'hg' + Math.floor(Math.random() * 1e6), lw = AD.measure(fmt(lo), fs * 0.9, 400, body) + 8;
      out.push('<defs><linearGradient id="' + id + '"><stop offset="0" stop-color="' + colorOf(lo) + '"/><stop offset="1" stop-color="' + colorOf(hi) + '"/></linearGradient></defs>');
      out.push(AD.txt(0, y + fs * 0.85, fmt(lo), { size: fs * 0.9, fill: th.muted }));
      out.push('<rect x="' + lw + '" y="' + y + '" width="' + gw + '" height="' + fs + '" rx="2" fill="url(#' + id + ')"/>');
      out.push(AD.txt(lw + gw + 8, y + fs * 0.85, fmt(hi), { size: fs * 0.9, fill: th.muted }));
      y += fs * 1.6;
    }
    return { h: y, svg: out.join('') };
  }

  /* ── Cartograma das UFs (grade: cada UF é um quadrado de mesmo tamanho; não representa a área real) ── */
  var UF = { AC: [0, 2, 'Acre'], RO: [1, 2, 'Rondônia'], AM: [1, 1, 'Amazonas'], RR: [2, 0, 'Roraima'], AP: [4, 0, 'Amapá'], PA: [3, 1, 'Pará'], MA: [4, 1, 'Maranhão'], CE: [5, 1, 'Ceará'], RN: [6, 1, 'Rio Grande do Norte'],
    MT: [2, 2, 'Mato Grosso'], TO: [3, 2, 'Tocantins'], PI: [4, 2, 'Piauí'], PE: [5, 2, 'Pernambuco'], PB: [6, 2, 'Paraíba'], MS: [2, 3, 'Mato Grosso do Sul'], GO: [3, 3, 'Goiás'], BA: [4, 3, 'Bahia'], SE: [5, 3, 'Sergipe'], AL: [6, 3, 'Alagoas'],
    DF: [3, 4, 'Distrito Federal'], MG: [4, 4, 'Minas Gerais'], ES: [5, 4, 'Espírito Santo'], PR: [3, 5, 'Paraná'], SP: [4, 5, 'São Paulo'], RJ: [5, 5, 'Rio de Janeiro'], SC: [3, 6, 'Santa Catarina'], RS: [3, 7, 'Rio Grande do Sul'] };
  var norm = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); };
  var UFNAME = {}; Object.keys(UF).forEach(function (k) { UFNAME[norm(UF[k][2])] = k; UFNAME[k.toLowerCase()] = k; });
  AD.ufCode = function (s) { return UFNAME[norm(s)] || null; };

  function ufmap(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, body = ctx.body, W = ctx.W, out = [], fmt = function (v) { return AD.fmt(v, d); };
    var s0 = ctx.data.series[0]; if (!s0) return null;
    var byUF = {}, bad = 0, labelOf = {};
    ctx.data.labels.forEach(function (l, i) { var c = AD.ufCode(l); if (c) { byUF[c] = s0.vals[i]; labelOf[c] = l; } else bad++; });
    var vals = Object.keys(byUF).map(function (k) { return byUF[k]; });
    if (!vals.length) return { h: fs * 3, svg: AD.txt(0, fs * 1.5, 'Nenhuma UF reconhecida na primeira coluna (use sigla ou nome: SP, São Paulo).', { size: fs, fill: th.muted }) };
    var lo = Math.min.apply(null, vals.concat([0])), hi = Math.max.apply(null, vals); if (hi === lo) hi = lo + 1;
    var mv = AD.parseNum(d.maxValue); if (mv != null && mv > lo) hi = mv;
    var base = d.color || ctx.single(), colorOf = function (v) { return AD.mix(th.bg, base, 0.12 + 0.88 * Math.max(0, Math.min(1, (v - lo) / (hi - lo)))); };
    var ts = Math.min(Math.floor((W - 4) / 7), 74); if (ctx.H) ts = Math.max(30, Math.min(ts, Math.floor((ctx.H - fs * 5) / 8)));
    var ox = (W - ts * 7) / 2, show = d.valueLabels !== 'hide';
    Object.keys(UF).forEach(function (k) {
      var x = ox + UF[k][0] * ts, y = UF[k][1] * ts, has = byUF[k] != null, v = byUF[k];
      var fill = has ? ctx.tone(colorOf(v), labelOf[k]) : th.grid;
      out.push(AD.rect(x + 1.5, y + 1.5, ts - 3, ts - 3, fill, { rx: 4 }));
      var tc = has ? (d.labelColor || AD.contrastText(fill)) : th.muted;
      out.push(AD.txt(x + ts / 2, y + ts / 2 + (has && show ? -fs * 0.1 : fs * 0.33), k, { size: fs, weight: 700, fill: tc, anchor: 'middle' }));
      if (has && show && !(d.hideZero && v === 0)) out.push(AD.txt(x + ts / 2, y + ts / 2 + fs * 1.15, fmt(v), { size: fs * 0.82, fill: tc, anchor: 'middle' }));
    });
    var y = 8 * ts + fs * 1.1;
    if (ctx.legendOn(true)) {
      var gw = Math.min(220, W * 0.5), id = 'ug' + Math.floor(Math.random() * 1e6), lw = AD.measure(fmt(lo), fs * 0.9, 400, body) + 8, x0 = Math.max(0, (W - gw - lw - AD.measure(fmt(hi), fs * 0.9, 400, body) - 8) / 2);
      out.push('<defs><linearGradient id="' + id + '"><stop offset="0" stop-color="' + colorOf(lo) + '"/><stop offset="1" stop-color="' + colorOf(hi) + '"/></linearGradient></defs>');
      out.push(AD.txt(x0, y + fs * 0.85, fmt(lo), { size: fs * 0.9, fill: th.muted }));
      out.push('<rect x="' + (x0 + lw).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + gw + '" height="' + fs.toFixed(1) + '" rx="2" fill="url(#' + id + ')"/>');
      out.push(AD.txt(x0 + lw + gw + 8, y + fs * 0.85, fmt(hi), { size: fs * 0.9, fill: th.muted }));
      y += fs * 1.8;
    }
    var nota = AD.wrap('Cartograma: cada UF ocupa um quadrado do mesmo tamanho; a posição aproxima a geografia, não a área.' + (bad ? ' ' + bad + ' linha(s) sem UF reconhecida.' : ''), fs * 0.8, 400, body, W);
    nota.forEach(function (ln, q) { out.push(AD.txt(0, y + fs * 0.7 + q * fs, ln, { size: fs * 0.8, fill: th.muted })); });
    return { h: y + fs * 0.7 + nota.length * fs, svg: out.join('') };
  }

  /* ── Registro ── */
  var I = function (inner) { return '<svg viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'; };
  var R = function (x, y, o) { return '<rect x="' + x + '" y="' + y + '" width="6" height="6" rx="1" fill="currentColor" stroke="none" opacity="' + o + '"/>'; };
  AD.charts.register({ id: 'area', annot: { highlight: 'series', refs: true, notes: false }, name: 'Gráfico de área', purposes: ['trend', 'part'], group: 'lines', multi: true, sortable: false,
    icon: I('<path d="M3 24 L12 12 L22 17 L36 5 V26 H3 Z" fill="currentColor" fill-opacity=".35" stroke="none"/><polyline points="3,24 12,12 22,17 36,5"/>'),
    controls: ['areaStack', 'maxValue', 'color', 'seriesColors', 'yAxis'], render: area });
  AD.charts.register({ id: 'combo', annot: { highlight: 'series', refs: false, notes: false }, name: 'Coluna com linha (eixo duplo)', purposes: ['comparison', 'trend'], group: 'bars', multi: true, sortable: false,
    icon: I('<rect x="5" y="14" width="6" height="12" fill="currentColor" stroke="none"/><rect x="17" y="8" width="6" height="18" fill="currentColor" stroke="none"/><rect x="29" y="17" width="6" height="9" fill="currentColor" stroke="none"/><polyline points="8,8 20,15 32,5" opacity=".6"/>'),
    defaults: { legend: true }, controls: ['barThickness', 'barSpacing', 'maxValue', 'color', 'seriesColors', 'valueLabels:h', 'pointLabels'], render: combo });
  AD.charts.register({ id: 'scatter', annot: { highlight: 'label', refs: false, notes: false }, name: 'Dispersão', purposes: ['relflow', 'comparison'], group: 'relation', multi: false, sortable: false, raw: true,
    icon: I('<circle cx="8" cy="22" r="2.6" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="2.6" fill="currentColor" stroke="none"/><circle cx="22" cy="20" r="2.6" fill="currentColor" stroke="none"/><circle cx="30" cy="9" r="2.6" fill="currentColor" stroke="none"/><circle cx="34" cy="14" r="2.6" fill="currentColor" stroke="none"/>'),
    defaults: { pointLabels: false }, controls: ['color', 'varyColors', 'pointSize', 'pointLabels', 'trendLine'], render: scatter });
  AD.charts.register({ id: 'heatmap', annot: { highlight: false, refs: false, notes: false }, name: 'Mapa de calor', purposes: ['comparison', 'trend'], group: 'relation', multi: true, sortable: false,
    icon: I(R(4, 4, '.25') + R(12, 4, '.6') + R(20, 4, '1') + R(28, 4, '.4') + R(4, 12, '.8') + R(12, 12, '.4') + R(20, 12, '.15') + R(28, 12, '.9') + R(4, 20, '.5') + R(12, 20, '1') + R(20, 20, '.3') + R(28, 20, '.6')),
    controls: ['maxValue', 'color', 'valueLabels:h'], render: heatmap });
  AD.charts.register({ id: 'ufmap', annot: { highlight: 'label', refs: false, notes: false }, name: 'Cartograma das UFs', purposes: ['geo', 'comparison'], group: 'relation', multi: false, sortable: false,
    icon: I(R(14, 3, '1') + R(21, 3, '.5') + R(7, 10, '.5') + R(14, 10, '1') + R(21, 10, '.7') + R(28, 10, '.3') + R(14, 17, '.6') + R(21, 17, '1') + R(14, 24, '.4')),
    controls: ['maxValue', 'color', 'valueLabels:h'], render: ufmap });
})();
