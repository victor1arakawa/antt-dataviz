/* Gráficos: barras horizontais, colunas, empilhados e agrupados (um motor para os cinco). */
(function () {
  'use strict';
  var AD = window.AD;

  function bars(ctx, mode, horiz) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, data = ctx.data, W = ctx.W, body = ctx.body;
    var labels = data.labels, n = labels.length;
    var ser = mode === 'single' ? [data.series[0]] : data.series;
    if (!ser[0]) return null;
    var m = ser.length, i, j, out = [];
    var fmt = function (v) { return AD.fmt(v, d); };
    var vl = d.valueLabels || (mode === 'stacked' ? 'inside' : 'outside');
    var axis = d.axis === true;

    /* domínio */
    var lo = 0, hi = 0;
    if (mode === 'stacked') {
      for (i = 0; i < n; i++) { var p = 0, q = 0; ser.forEach(function (s) { var v = s.vals[i]; if (v >= 0) p += v; else q += v; }); hi = Math.max(hi, p); lo = Math.min(lo, q); }
    } else ser.forEach(function (s) { s.vals.forEach(function (v) { hi = Math.max(hi, v); lo = Math.min(lo, v); }); });
    var mv = AD.parseNum(d.maxValue), explicit = mv != null && mv > 0;
    if (explicit) hi = mv;
    if (hi === lo) hi = lo + 1;
    var sc = axis && !explicit ? AD.niceScale(lo, hi, 5) : { min: lo, max: hi, ticks: axis ? AD.niceScale(lo, hi, 5).ticks.filter(function (t) { return t <= hi; }) : [] };

    var colorOf = function (si, ci) {
      if (mode === 'single') return d.varyColors ? ctx.color(ci, labels[ci]) : ctx.single();
      return ctx.color(si, ser[si].name);
    };
    var valColor = function (fill) { return d.labelColor || AD.contrastText(fill); };
    var outColor = d.labelColor || th.text;

    /* legenda */
    var legH = 0;
    if (mode !== 'single' && ctx.legendOn(true)) {
      var lg = AD.legend(ctx, ser.map(function (s, k) { return { label: s.name, color: ctx.color(k, s.name) }; }), 0, 0, W);
      out.push(lg.svg); legH = lg.h + 6;
    }
    var allVals = []; ser.forEach(function (s) { s.vals.forEach(function (v) { allVals.push(v); }); });
    var vlMax = 0;
    allVals.forEach(function (v) { vlMax = Math.max(vlMax, AD.measure(fmt(v), fs, 400, body)); });
    if (mode === 'stacked') { var tmx = 0; for (i = 0; i < n; i++) { var tt = 0; ser.forEach(function (s) { tt += s.vals[i]; }); tmx = Math.max(tmx, AD.measure(fmt(tt), fs, 700, body)); } vlMax = Math.max(vlMax, tmx); }
    var outsideLabels = vl === 'outside' || (mode === 'stacked' && (vl === 'total' || vl === 'both'));
    var stroke = d.stroke ? th.bg : null;
    var H;

    if (horiz) {
      var lh = fs * 1.2, maxLab = 0, wrapped = [];
      var cap = Math.min(W * 0.36, 210);
      labels.forEach(function (l) { var w = AD.wrap(l, fs, 400, body, cap, 2); wrapped.push(w); w.forEach(function (x) { maxLab = Math.max(maxLab, AD.measure(x, fs, 400, body)); }); });
      var axisH = axis ? fs * 1.8 : 0;
      var thick = d.barThickness || Math.round(fs * 1.9), inner = 2;
      var gapB = d.barSpacing != null ? d.barSpacing : Math.round(thick * 0.5);
      var rowH = function (k) { var bh = mode === 'cluster' ? m * thick + (m - 1) * inner : thick; return Math.max(bh, wrapped[k].length * lh); };
      if (ctx.H && !d.barThickness) {
        var avail = ctx.H - legH - axisH - (n - 1) * gapB;
        thick = Math.max(6, Math.min(60, Math.floor((avail / n - (mode === 'cluster' ? (m - 1) * inner : 0)) / (mode === 'cluster' ? m : 1))));
      }
      var negRoom = lo < 0 && outsideLabels ? vlMax + 8 : 0;
      var px = maxLab + 10 + negRoom, room = outsideLabels ? vlMax + 8 : 4, pw = Math.max(40, W - px - room);
      var X = function (v) { return px + (v - sc.min) / (sc.max - sc.min) * pw; };
      var top = legH, yy = top;
      if (axis) sc.ticks.forEach(function (t) {
        out.push(AD.line(X(t), top - 2, X(t), 99999, th.grid, 1).replace('y2="99999.0"', 'y2="@@B@@"'));
        out.push(AD.txt(X(t), 0, fmt(t), { size: fs * 0.9, fill: th.muted, anchor: 'middle' }).replace('y="0.0"', 'y="@@A@@"'));
      });
      for (i = 0; i < n; i++) {
        var rh = rowH(i), cy = yy + rh / 2;
        wrapped[i].forEach(function (ln, k) { out.push(AD.txt(maxLab, cy - (wrapped[i].length - 1) * lh / 2 + k * lh + fs * 0.33, ln, { size: fs, fill: th.text, anchor: 'end' })); });
        var accP = 0, accN = 0, blockH = mode === 'cluster' ? m * thick + (m - 1) * inner : thick, by0 = cy - blockH / 2;
        for (j = 0; j < m; j++) {
          var v = ser[j].vals[i], a, b, fill = colorOf(j, i);
          if (mode === 'stacked') { if (v >= 0) { a = accP; accP += v; b = accP; } else { a = accN; accN += v; b = accN; } } else { a = 0; b = v; }
          var x1 = X(Math.min(a, b)), x2 = X(Math.max(a, b)), by = mode === 'cluster' ? by0 + j * (thick + inner) : by0;
          if (x2 - x1 > 0.2) out.push(AD.rect(x1, by, x2 - x1, thick, fill, stroke ? { stroke: stroke, sw: 1 } : null));
          if (!(d.hideZero && v === 0) && vl !== 'hide') {
            var txt = fmt(v), tw = AD.measure(txt, fs, 400, body);
            if (mode === 'stacked') { if ((vl === 'inside' || vl === 'both') && x2 - x1 > tw + 8) out.push(AD.txt((x1 + x2) / 2, by + thick / 2 + fs * 0.33, txt, { size: fs, fill: valColor(fill), anchor: 'middle' })); }
            else if (vl === 'inside' && x2 - x1 > tw + 8) out.push(AD.txt(x2 - 5, by + thick / 2 + fs * 0.33, txt, { size: fs, fill: valColor(fill), anchor: 'end' }));
            else if (vl === 'outside' || (vl === 'inside' && x2 - x1 <= tw + 8)) out.push(v >= 0 ? AD.txt(x2 + 5, by + thick / 2 + fs * 0.33, txt, { size: fs, fill: outColor }) : AD.txt(x1 - 5, by + thick / 2 + fs * 0.33, txt, { size: fs, fill: outColor, anchor: 'end' }));
          }
        }
        if (mode === 'stacked' && (vl === 'total' || vl === 'both')) out.push(AD.txt(X(accP) + 5, cy + fs * 0.33, fmt(accP + accN), { size: fs, weight: 700, fill: outColor }));
        yy += rh + gapB;
      }
      var bottom = yy - gapB;
      out.push(AD.line(X(0), top - 2, X(0), bottom + 2, th.muted, 1.2));
      H = bottom + axisH;
      return { h: H, svg: out.join('').replace(/@@B@@/g, bottom + 2).replace(/@@A@@/g, bottom + fs * 1.5) };
    }

    /* vertical */
    var axW = 0;
    if (axis) sc.ticks.forEach(function (t) { axW = Math.max(axW, AD.measure(fmt(t), fs * 0.9, 400, body)); });
    axW = axis ? axW + 8 : 0;
    var vpx = axW, vpw = W - vpx, band = vpw / n;
    var gapV = d.barSpacing != null ? d.barSpacing : band * 0.3;
    var groupW = Math.max(3, band - gapV), barW = mode === 'cluster' ? groupW / m : groupW;
    if (d.barThickness) { barW = Math.min(d.barThickness, mode === 'cluster' ? band / m : band); groupW = mode === 'cluster' ? barW * m : barW; }
    var lh2 = fs * 1.2, wl = labels.map(function (l) { return AD.wrap(l, fs, 400, body, Math.max(20, band - 4), 3); });
    var maxLines = Math.max.apply(null, wl.map(function (w) { return w.length; }));
    var labH = maxLines * lh2 + 8, topRoom = outsideLabels ? fs * 1.7 : 6;
    var plotH = ctx.H ? Math.max(60, ctx.H - legH - labH - topRoom) : Math.round(Math.max(200, Math.min(420, W * 0.55)));
    var ytop = legH + topRoom;
    var Y = function (v) { return ytop + plotH - (v - sc.min) / (sc.max - sc.min) * plotH; };
    if (axis) sc.ticks.forEach(function (t) {
      out.push(AD.line(vpx, Y(t), W, Y(t), th.grid, 1));
      out.push(AD.txt(vpx - 6, Y(t) + fs * 0.3, fmt(t), { size: fs * 0.9, fill: th.muted, anchor: 'end' }));
    });
    for (i = 0; i < n; i++) {
      var cx = vpx + band * i + band / 2, gx = cx - groupW / 2, accP2 = 0, accN2 = 0;
      for (j = 0; j < m; j++) {
        var v2 = ser[j].vals[i], a2, b2, fill2 = colorOf(j, i);
        if (mode === 'stacked') { if (v2 >= 0) { a2 = accP2; accP2 += v2; b2 = accP2; } else { a2 = accN2; accN2 += v2; b2 = accN2; } } else { a2 = 0; b2 = v2; }
        var y1 = Y(Math.max(a2, b2)), y2 = Y(Math.min(a2, b2)), bx = mode === 'cluster' ? gx + j * barW : gx;
        if (y2 - y1 > 0.2) out.push(AD.rect(bx, y1, barW, y2 - y1, fill2, stroke ? { stroke: stroke, sw: 1 } : null));
        if (!(d.hideZero && v2 === 0) && vl !== 'hide') {
          var t2 = fmt(v2), tw2 = AD.measure(t2, fs, 400, body);
          if (mode === 'stacked') { if ((vl === 'inside' || vl === 'both') && y2 - y1 > fs * 1.3 && barW > tw2 + 4) out.push(AD.txt(bx + barW / 2, (y1 + y2) / 2 + fs * 0.33, t2, { size: fs, fill: valColor(fill2), anchor: 'middle' })); }
          else if (vl === 'inside' && y2 - y1 > fs * 1.4 && barW > tw2 + 2) out.push(AD.txt(bx + barW / 2, y1 + fs * 1.15, t2, { size: fs, fill: valColor(fill2), anchor: 'middle' }));
          else if (vl === 'outside' || vl === 'inside') out.push(v2 >= 0 ? AD.txt(bx + barW / 2, y1 - 5, t2, { size: fs, fill: outColor, anchor: 'middle' }) : AD.txt(bx + barW / 2, y2 + fs * 1.1, t2, { size: fs, fill: outColor, anchor: 'middle' }));
        }
      }
      if (mode === 'stacked' && (vl === 'total' || vl === 'both')) out.push(AD.txt(cx, Y(accP2) - 5, fmt(accP2 + accN2), { size: fs, weight: 700, fill: outColor, anchor: 'middle' }));
      wl[i].forEach(function (ln, k) { out.push(AD.txt(cx, ytop + plotH + fs * 1.35 + k * lh2, ln, { size: fs, fill: th.text, anchor: 'middle' })); });
    }
    out.push(AD.line(vpx, Y(0), W, Y(0), th.muted, 1.2));
    return { h: ytop + plotH + labH, svg: out.join('') };
  }

  var I = function (inner) { return '<svg viewBox="0 0 40 30" fill="currentColor">' + inner + '</svg>'; };
  var common = { group: 'bars', multi: false };

  AD.charts.register({ id: 'hbar', name: 'Barra horizontal', purposes: ['comparison'], group: 'bars', multi: false, sortable: true,
    icon: I('<rect x="4" y="5" width="30" height="5" rx="1"/><rect x="4" y="13" width="20" height="5" rx="1"/><rect x="4" y="21" width="12" height="5" rx="1"/>'),
    controls: ['barThickness', 'barSpacing', 'maxValue', 'color', 'varyColors', 'valueLabels:h', 'axis'], render: function (c) { return bars(c, 'single', true); } });
  AD.charts.register({ id: 'vbar', name: 'Coluna', purposes: ['comparison', 'trend'], group: 'bars', multi: false, sortable: true,
    icon: I('<rect x="5" y="6" width="7" height="22" rx="1"/><rect x="16" y="14" width="7" height="14" rx="1"/><rect x="27" y="20" width="7" height="8" rx="1"/>'),
    controls: ['barThickness', 'barSpacing', 'maxValue', 'color', 'varyColors', 'valueLabels:h', 'axis'], render: function (c) { return bars(c, 'single', false); } });
  AD.charts.register({ id: 'stacked-bar', name: 'Barra empilhada', purposes: ['comparison', 'part'], group: 'bars', multi: true, sortable: true,
    icon: I('<rect x="4" y="5" width="18" height="6" rx="1"/><rect x="22" y="5" width="12" height="6" rx="1" opacity=".45"/><rect x="4" y="15" width="10" height="6" rx="1"/><rect x="14" y="15" width="20" height="6" rx="1" opacity=".45"/>'),
    defaults: { legend: true }, controls: ['barThickness', 'barSpacing', 'maxValue', 'seriesColors', 'valueLabels:s', 'stroke', 'axis'], render: function (c) { return bars(c, 'stacked', true); } });
  AD.charts.register({ id: 'stacked-col', name: 'Coluna empilhada', purposes: ['comparison', 'part', 'trend'], group: 'bars', multi: true, sortable: true,
    icon: I('<rect x="6" y="12" width="8" height="16" rx="1"/><rect x="6" y="4" width="8" height="8" rx="1" opacity=".45"/><rect x="24" y="18" width="8" height="10" rx="1"/><rect x="24" y="10" width="8" height="8" rx="1" opacity=".45"/>'),
    defaults: { legend: true }, controls: ['barThickness', 'barSpacing', 'maxValue', 'seriesColors', 'valueLabels:s', 'stroke', 'axis'], render: function (c) { return bars(c, 'stacked', false); } });
  AD.charts.register({ id: 'cluster-bar', name: 'Barra agrupada', purposes: ['comparison'], group: 'bars', multi: true, sortable: true,
    icon: I('<rect x="4" y="4" width="26" height="4" rx="1"/><rect x="4" y="9" width="18" height="4" rx="1" opacity=".45"/><rect x="4" y="18" width="14" height="4" rx="1"/><rect x="4" y="23" width="22" height="4" rx="1" opacity=".45"/>'),
    defaults: { legend: true }, controls: ['barThickness', 'barSpacing', 'maxValue', 'seriesColors', 'valueLabels:h', 'axis'], render: function (c) { return bars(c, 'cluster', true); } });
})();
