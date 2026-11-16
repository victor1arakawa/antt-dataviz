/* Gráficos: linhas e linhas agrupadas (um painel por série). */
(function () {
  'use strict';
  var AD = window.AD;

  /* Desenha um conjunto de séries numa área de largura w. dom = {lo,hi} (opcional). */
  function drawLines(ctx, ser, w, plotH, o) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, body = ctx.body, cats = ctx.data.labels, n = cats.length, out = [], i, j;
    var fmt = function (v) { return AD.fmt(v, d); };
    var lo = o.lo, hi = o.hi;
    var mv = AD.parseNum(d.maxValue); if (mv != null && mv > 0) hi = mv;
    if (hi === lo) hi = lo + 1;
    var yAxis = d.yAxis === true, sc = yAxis ? AD.niceScale(lo, hi, 4) : { min: lo, max: hi, ticks: [] };
    var axW = 0;
    sc.ticks.forEach(function (t) { axW = Math.max(axW, AD.measure(fmt(t), fs * 0.9, 400, body)); });
    var left = yAxis ? axW + 10 : fs * 1.2;
    var right = fs * 1.2;
    if (d.endLabels) ser.forEach(function (s) { right = Math.max(right, Math.min(w * 0.3, AD.measure(s.name, fs, 700, body)) + 10); });
    var px = left, pw = Math.max(40, w - left - right), band = pw / n;
    var top = fs * 1.8, X = function (k) { return px + (k + 0.5) * band; };
    var Y = function (v) { return top + plotH - (v - sc.min) / (sc.max - sc.min) * plotH; };

    sc.ticks.forEach(function (t) {
      out.push(AD.line(px, Y(t), px + pw, Y(t), th.grid, 1));
      out.push(AD.txt(px - 6, Y(t) + fs * 0.3, fmt(t), { size: fs * 0.9, fill: th.muted, anchor: 'end' }));
    });
    if (!yAxis && sc.min <= 0 && sc.max >= 0) out.push(AD.line(px, Y(0), px + pw, Y(0), th.grid, 1));
    else if (yAxis) out.push(AD.line(px, Y(Math.max(0, sc.min)), px + pw, Y(Math.max(0, sc.min)), th.muted, 1.2));

    /* rótulos do eixo X (pula alguns se não couberem) */
    var maxW = 0; cats.forEach(function (c) { maxW = Math.max(maxW, AD.measure(c, fs, 400, body)); });
    var step = Math.max(1, Math.ceil((maxW + 8) / band)), lh = fs * 1.2, xl = 0;
    cats.forEach(function (c, k) {
      if (k % step !== 0 && k !== n - 1) return;
      var lines = AD.wrap(c, fs, 400, body, Math.max(30, band * step - 6), 2);
      xl = Math.max(xl, lines.length);
      lines.forEach(function (ln, q) { out.push(AD.txt(X(k), top + plotH + fs * 1.45 + q * lh, ln, { size: fs, fill: th.text, anchor: 'middle' })); });
    });

    var lw = 2.5, r = Math.max(2, (Number(d.pointSize) || 4) * 0.8);
    var lastBoxes = [];
    ser.forEach(function (s, si) {
      var col = o.colorOf ? o.colorOf(si, s) : ctx.color(si, s.name);
      var pts = s.vals.map(function (v, k) { return [X(k), Y(v)]; });
      if (d.areaFill) out.push('<polygon points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + ' ' + pts[n - 1][0].toFixed(1) + ',' + Y(Math.max(0, sc.min)).toFixed(1) + ' ' + pts[0][0].toFixed(1) + ',' + Y(Math.max(0, sc.min)).toFixed(1) + '" fill="' + col + '" opacity="0.15"/>');
      out.push('<polyline fill="none" stroke="' + col + '" stroke-width="' + lw + '" stroke-linejoin="round" stroke-linecap="round" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>');
      if (d.points) pts.forEach(function (p) { out.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r + '" fill="' + col + '" stroke="' + th.bg + '" stroke-width="1"/>'); });
      if (d.pointLabels) {
        var prevEnd = -1e9;
        pts.forEach(function (p, k) {
          var v = s.vals[k];
          if (d.hideZero && v === 0) return;
          var t = fmt(v), tw = AD.measure(t, fs * 0.9, 400, body);
          /* acima da linha, exceto se outra série estiver acima neste ponto */
          var above = ser.every(function (o2, q) { return q === si || o2.vals[k] <= v; });
          if (ser.length === 1) above = true;
          if (p[0] - tw / 2 < prevEnd + 3) return;
          prevEnd = p[0] + tw / 2;
          out.push(AD.txt(p[0], above ? p[1] - r - 5 : p[1] + r + fs * 1.0, t, { size: fs * 0.9, fill: th.text, anchor: 'middle', halo: th.bg }));
        });
      }
      if (d.endLabels) {
        var ly = pts[n - 1][1] + fs * 0.3;
        lastBoxes.forEach(function (b) { if (Math.abs(b - ly) < fs * 1.1) ly = b + fs * 1.1; });
        lastBoxes.push(ly);
        out.push(AD.txt(pts[n - 1][0] + r + 6, ly, AD.ellipsis(s.name, fs, 700, body, right - 12), { size: fs, weight: 700, fill: col }));
      }
    });
    return { svg: out.join(''), h: top + plotH + fs * 1.45 + xl * lh + 4 };
  }

  function domain(series) {
    var lo = 0, hi = 0;
    series.forEach(function (s) { s.vals.forEach(function (v) { hi = Math.max(hi, v); lo = Math.min(lo, v); }); });
    return { lo: lo, hi: hi };
  }

  function lineChart(ctx) {
    var d = ctx.d, ser = ctx.data.series;
    if (!ser.length) return null;
    var out = [], y = 0;
    if (ser.length > 1 && !d.endLabels && ctx.legendOn(true)) {
      var lg = AD.legend(ctx, ser.map(function (s, k) { return { label: s.name, color: ctx.color(k, s.name) }; }), 0, 0, ctx.W);
      out.push(lg.svg); y = lg.h + 4;
    }
    var dom = domain(ser);
    var plotH = ctx.H ? Math.max(80, ctx.H - y - ctx.fs * 5) : Math.round(Math.max(180, Math.min(380, ctx.W * 0.5)));
    var r = drawLines(ctx, ser, ctx.W, plotH, { lo: dom.lo, hi: dom.hi, colorOf: function (i, s) { return ser.length === 1 ? ctx.single() : ctx.color(i, s.name); } });
    out.push('<g transform="translate(0 ' + y + ')">' + r.svg + '</g>');
    return { h: y + r.h, svg: out.join('') };
  }

  function clusterLine(ctx) {
    var d = ctx.d, ser = ctx.data.series, fs = ctx.fs, th = ctx.th;
    if (!ser.length) return null;
    var cols = ctx.W >= 780 ? 3 : (ctx.W >= 420 ? 2 : 1), gap = 18, pw = (ctx.W - gap * (cols - 1)) / cols;
    var dom = domain(ser), out = [], rowsH = [], row = 0;
    var plotH = Math.round(Math.max(110, Math.min(200, pw * 0.5)));
    var panels = ser.map(function (s, k) {
      var dm = d.separateScale ? domain([s]) : dom;
      var sub = Object.assign({}, ctx, { d: Object.assign({}, d, { pointLabels: d.pointLabels && pw > 240, legend: false }) });
      var r = drawLines(sub, [s], pw, plotH, { lo: dm.lo, hi: dm.hi, colorOf: function () { return ctx.color(k, s.name); } });
      return { title: s.name, svg: r.svg, h: r.h + fs * 2, color: ctx.color(k, s.name) };
    });
    var y = 0;
    for (var i = 0; i < panels.length; i += cols) {
      var slice = panels.slice(i, i + cols), rh = Math.max.apply(null, slice.map(function (p) { return p.h; }));
      slice.forEach(function (p, c) {
        var x = c * (pw + gap);
        out.push('<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' + AD.txt(0, fs * 1.1, AD.ellipsis(p.title, fs * 1.1, 700, ctx.body, pw), { size: fs * 1.1, weight: 700, fill: th.text }) +
          '<g transform="translate(0 ' + (fs * 1.6).toFixed(1) + ')">' + p.svg + '</g></g>');
      });
      y += rh + 8;
    }
    return { h: y, svg: out.join('') };
  }

  var I = function (inner) { return '<svg viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'; };
  AD.charts.register({ id: 'line', name: 'Gráfico de linhas', purposes: ['trend'], group: 'lines', multi: true, sortable: false,
    icon: I('<polyline points="4,22 13,12 22,17 35,5"/><circle cx="4" cy="22" r="1.6" fill="currentColor"/><circle cx="13" cy="12" r="1.6" fill="currentColor"/><circle cx="22" cy="17" r="1.6" fill="currentColor"/><circle cx="35" cy="5" r="1.6" fill="currentColor"/>'),
    legendDefault: function () { return true; },
    controls: ['maxValue', 'color', 'seriesColors', 'yAxis', 'pointLabels', 'points', 'pointSize', 'areaFill', 'endLabels'], render: lineChart });
  AD.charts.register({ id: 'cluster-line', name: 'Linhas agrupadas', purposes: ['trend', 'comparison'], group: 'lines', multi: true, sortable: false,
    icon: I('<polyline points="3,12 8,6 13,9"/><polyline points="24,12 29,7 35,10"/><polyline points="3,26 8,20 13,23"/><polyline points="24,26 29,21 35,24"/>'),
    controls: ['maxValue', 'seriesColors', 'yAxis', 'pointLabels', 'points', 'pointSize', 'areaFill', 'separateScale'], render: clusterLine });
})();
