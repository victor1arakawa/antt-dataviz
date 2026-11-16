/* Gráficos circulares: pizza, rosca, roscas agrupadas e bolhas. */
(function () {
  'use strict';
  var AD = window.AD;
  var RAD = Math.PI / 180;

  function polar(cx, cy, r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function arc(cx, cy, ro, ri, a0, a1) {
    var big = a1 - a0 > Math.PI ? 1 : 0, p = function (r, a) { var q = polar(cx, cy, r, a); return q[0].toFixed(2) + ' ' + q[1].toFixed(2); };
    if (ri > 0) return 'M' + p(ro, a0) + ' A' + ro + ' ' + ro + ' 0 ' + big + ' 1 ' + p(ro, a1) + ' L' + p(ri, a1) + ' A' + ri + ' ' + ri + ' 0 ' + big + ' 0 ' + p(ri, a0) + ' Z';
    return 'M' + cx + ' ' + cy + ' L' + p(ro, a0) + ' A' + ro + ' ' + ro + ' 0 ' + big + ' 1 ' + p(ro, a1) + ' Z';
  }

  /* Desenha as fatias; devolve o svg e a lista com ângulos para rotular */
  function slices(ctx, cx, cy, ro, ri, vals, colorAt) {
    var total = vals.reduce(function (a, b) { return a + Math.max(0, b); }, 0), out = [], info = [], a = -Math.PI / 2;
    if (total <= 0) return { svg: '', info: [], total: 0 };
    var nz = vals.filter(function (v) { return v > 0; }).length, th = ctx.th;
    vals.forEach(function (v, i) {
      if (v <= 0) return;
      var f = v / total, a1 = a + f * 2 * Math.PI, col = colorAt(i);
      if (nz === 1) {
        out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + ro + '" fill="' + col + '"/>');
        if (ri > 0) out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + ri + '" fill="' + th.bg + '"/>');
      } else out.push('<path d="' + arc(cx, cy, ro, ri, a, a1) + '" fill="' + col + '" stroke="' + th.bg + '" stroke-width="2"/>');
      info.push({ i: i, v: v, f: f, mid: (a + a1) / 2, color: col });
      a = a1;
    });
    return { svg: out.join(''), info: info, total: total };
  }

  function sliceLines(ctx, label, v, f, mode) {
    var d = ctx.d, val = AD.fmt(v, d), pc = AD.pct(f, f < 0.1 && Math.abs(f * 100 - Math.round(f * 100)) > 0.05 ? 1 : 0);
    switch (mode) {
      case 'pct': return [pc];
      case 'value': return [val];
      case 'name': return [label];
      case 'name-value': return [label, val];
      case 'value-pct': return [val + ' (' + pc + ')'];
      default: return [label, pc];
    }
  }

  function pieLike(ctx, donut) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, W = ctx.W, body = ctx.body, s = ctx.data.series[0];
    if (!s) return null;
    var labels = ctx.data.labels, vals = s.vals.map(function (v) { return Math.max(0, v); });
    var mode = d.pieLabels, out = [], outside = mode === 'outside';
    var showLeg = ctx.legendOn(mode !== 'outside');
    var legH = 0, leg = null;
    if (showLeg) { leg = AD.legend(ctx, labels.map(function (l, i) { return { label: l, color: ctx.color(i, l) }; }), 0, 0, W); legH = leg.h + 8; }
    var gutter = outside ? Math.min(W * 0.31, 170) : 0, vpad = outside ? fs * 2.2 : 4;
    var R = Math.min((W - 2 * gutter) / 2, ctx.H ? (ctx.H - legH - 2 * vpad) / 2 : 170);
    R = Math.max(40, R);
    var cx = W / 2, cy = vpad + R;
    var ri = donut ? R * (Number(d.donutHole) || 60) / 100 : 0;
    var sl = slices(ctx, cx, cy, R, ri, vals, function (i) { return ctx.color(i, labels[i]); });
    if (!sl.total) return { h: 60, svg: AD.txt(W / 2, 30, 'Sem valores positivos', { size: fs, fill: th.muted, anchor: 'middle' }) };
    out.push(sl.svg);

    if (mode === 'inside') {
      sl.info.forEach(function (it) {
        if (it.f < 0.05) return;
        var rr = donut ? (R + ri) / 2 : R * 0.64, p = polar(cx, cy, rr, it.mid);
        var lines = sliceLines(ctx, labels[it.i], it.v, it.f, d.pieText).slice(-1);
        out.push(AD.txt(p[0], p[1] + fs * 0.33, lines[0], { size: fs, weight: 700, fill: d.labelColor || AD.contrastText(it.color), anchor: 'middle' }));
      });
    } else if (outside) {
      var lh = fs * 1.2, sides = { r: [], l: [] };
      sl.info.forEach(function (it) {
        var right = Math.cos(it.mid) >= 0, p0 = polar(cx, cy, R, it.mid), p1 = polar(cx, cy, R + 12, it.mid);
        var lines = [];
        sliceLines(ctx, labels[it.i], it.v, it.f, d.pieText).forEach(function (t, k) {
          (k === 0 && /name/.test(d.pieText) ? AD.wrap(t, fs, 400, body, gutter - 22, 2) : [t]).forEach(function (x) { lines.push({ t: x, b: k > 0 || !/name/.test(d.pieText) }); });
        });
        var o = { it: it, right: right, p0: p0, p1: p1, lines: lines, h: lines.length * lh, y: p1[1] };
        sides[right ? 'r' : 'l'].push(o);
      });
      ['r', 'l'].forEach(function (k) {
        var arr = sides[k].sort(function (a, b) { return a.y - b.y; }), last = -1e9;
        arr.forEach(function (o) { var top = Math.max(o.y - o.h / 2, last + 4); o.ty = top + o.h / 2; last = top + o.h; });
        for (var q = arr.length - 2; q >= 0; q--) { var lim = arr[q + 1].ty - arr[q + 1].h / 2 - 4 - arr[q].h / 2; if (arr[q].ty > lim) arr[q].ty = lim; }
        arr.forEach(function (o) {
          var tx = cx + (o.right ? 1 : -1) * (R + 22), col = o.it.color;
          out.push('<polyline fill="none" stroke="' + th.muted + '" stroke-width="1" points="' + o.p0[0].toFixed(1) + ',' + o.p0[1].toFixed(1) + ' ' + o.p1[0].toFixed(1) + ',' + o.p1[1].toFixed(1) + ' ' + (tx - (o.right ? 4 : -4)).toFixed(1) + ',' + o.ty.toFixed(1) + '"/>');
          o.lines.forEach(function (ln, q2) {
            out.push(AD.txt(tx, o.ty - o.h / 2 + q2 * lh + fs * 0.95, ln.t, { size: fs, weight: ln.b ? 700 : 400, fill: d.labelColor || th.text, anchor: o.right ? 'start' : 'end' }));
          });
        });
      });
    }
    if (donut && d.donutCenter !== 'none') {
      if (d.donutCenter === 'custom' && String(d.donutCenterText).trim()) {
        AD.wrap(d.donutCenterText, fs * 1.4, 700, body, ri * 1.7, 3).forEach(function (ln, k, arr) { out.push(AD.txt(cx, cy + fs * 0.45 + (k - (arr.length - 1) / 2) * fs * 1.6, ln, { size: fs * 1.4, weight: 700, fill: th.text, anchor: 'middle' })); });
      } else if (d.donutCenter !== 'custom') {
        var big = AD.fmt(sl.total, d), sz = Math.min(fs * 2.2, (ri * 1.7) / Math.max(3, big.length) * 1.9);
        out.push(AD.txt(cx, cy + sz * 0.15, big, { size: sz, weight: 700, fill: th.text, anchor: 'middle' }));
        out.push(AD.txt(cx, cy + sz * 0.15 + fs * 1.3, 'Total', { size: fs * 0.95, fill: th.muted, anchor: 'middle' }));
      }
    }
    var H = 2 * R + 2 * vpad;
    if (showLeg) out.push('<g transform="translate(0 ' + (H + 4) + ')">' + leg.svg + '</g>');
    return { h: H + (showLeg ? legH + 4 : 0), svg: out.join('') };
  }

  function clusterDonut(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, W = ctx.W, ser = ctx.data.series, labels = ctx.data.labels, out = [];
    if (!ser.length) return null;
    var cols = W >= 700 ? 3 : (W >= 380 ? 2 : 1), gap = 16, pw = (W - gap * (cols - 1)) / cols, R = Math.max(30, pw / 2 - 8);
    var ri = R * (Number(d.donutHole) || 60) / 100, y = 0, rowH = 2 * R + fs * 3.2;
    ser.forEach(function (s, k) {
      var c = k % cols, r = Math.floor(k / cols), cx = c * (pw + gap) + pw / 2, cy = r * (rowH + 6) + R + 4;
      var sl = slices(ctx, cx, cy, R, ri, s.vals.map(function (v) { return Math.max(0, v); }), function (i) { return ctx.color(i, labels[i]); });
      out.push(sl.svg);
      if (sl.total) {
        sl.info.forEach(function (it) { if (it.f >= 0.08 && d.pieLabels !== 'none') { var p = polar(cx, cy, (R + ri) / 2, it.mid); out.push(AD.txt(p[0], p[1] + fs * 0.3, AD.pct(it.f), { size: fs * 0.85, weight: 700, fill: d.labelColor || AD.contrastText(it.color), anchor: 'middle' })); } });
        if (d.donutCenter !== 'none') out.push(AD.txt(cx, cy + fs * 0.35, AD.fmt(sl.total, d), { size: Math.min(fs * 1.3, ri * 0.5), weight: 700, fill: th.text, anchor: 'middle' }));
      }
      out.push(AD.txt(cx, cy + R + fs * 1.5, AD.ellipsis(s.name, fs * 1.05, 700, ctx.body, pw), { size: fs * 1.05, weight: 700, fill: th.text, anchor: 'middle' }));
      y = (r + 1) * (rowH + 6);
    });
    if (ctx.legendOn(true)) {
      var lg = AD.legend(ctx, labels.map(function (l, i) { return { label: l, color: ctx.color(i, l) }; }), 0, 0, W);
      out.push('<g transform="translate(0 ' + (y + 4) + ')">' + lg.svg + '</g>'); y += lg.h + 8;
    }
    return { h: y, svg: out.join('') };
  }

  function bubble(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, W = ctx.W, s = ctx.data.series[0];
    if (!s) return null;
    var items = ctx.data.labels.map(function (l, i) { return { l: l, v: s.vals[i], i: i }; }).filter(function (x) { return x.v > 0; }).sort(function (a, b) { return b.v - a.v; });
    if (!items.length) return { h: 60, svg: AD.txt(W / 2, 30, 'Sem valores positivos', { size: fs, fill: th.muted, anchor: 'middle' }) };
    var max = items[0].v, maxR = Math.min(W * 0.26, 120), gap = Number(d.bubbleGap) || 0;
    items.forEach(function (it) { it.r = Math.max(5, Math.sqrt(it.v / max) * maxR); });
    var placed = [];
    items.forEach(function (it, k) {
      if (!k) { it.x = 0; it.y = 0; placed.push(it); return; }
      for (var t = 0; t < 4000; t += 1) {
        var ang = t * 0.35, rad = 1.5 * t * 0.35 + it.r * 0.2, x = rad * Math.cos(ang), y = rad * Math.sin(ang) * 0.85;
        if (placed.every(function (p) { return Math.hypot(p.x - x, p.y - y) >= p.r + it.r + gap; })) { it.x = x; it.y = y; break; }
      }
      placed.push(it);
    });
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    items.forEach(function (it) { x0 = Math.min(x0, it.x - it.r); x1 = Math.max(x1, it.x + it.r); y0 = Math.min(y0, it.y - it.r); y1 = Math.max(y1, it.y + it.r); });
    var sc = Math.min(1, W / (x1 - x0), ctx.H ? ctx.H / (y1 - y0) : 9);
    var out = [], vary = d.varyColors == null ? true : d.varyColors;
    items.forEach(function (it) {
      var cx = W / 2 + (it.x - (x0 + x1) / 2) * sc, cy = (it.y - y0) * sc, r = it.r * sc, col = vary ? ctx.color(it.i, it.l) : ctx.single();
      out.push('<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + col + '"/>');
      var tc = d.labelColor || AD.contrastText(col), val = AD.fmt(it.v, d);
      if (r >= fs * 2.2) {
        var lines = AD.wrap(it.l, fs, 400, ctx.body, r * 1.7, 2);
        var total = lines.length + 1, y = cy - (total - 1) * fs * 0.6 + fs * 0.33;
        lines.forEach(function (ln, q) { out.push(AD.txt(cx, y + q * fs * 1.2, ln, { size: fs, fill: tc, anchor: 'middle' })); });
        out.push(AD.txt(cx, y + lines.length * fs * 1.2, val, { size: fs, weight: 700, fill: tc, anchor: 'middle' }));
      } else if (r >= fs * 1.2 && AD.measure(val, fs * 0.85, 700, ctx.body) < r * 1.8) out.push(AD.txt(cx, cy + fs * 0.3, val, { size: fs * 0.85, weight: 700, fill: tc, anchor: 'middle' }));
    });
    var H = (y1 - y0) * sc;
    if (ctx.legendOn(false)) {
      var lg = AD.legend(ctx, items.map(function (it) { return { label: it.l, color: vary ? ctx.color(it.i, it.l) : ctx.single() }; }), 0, 0, W);
      out.push('<g transform="translate(0 ' + (H + 10) + ')">' + lg.svg + '</g>'); H += lg.h + 10;
    }
    return { h: H, svg: out.join('') };
  }

  var I = function (inner) { return '<svg viewBox="0 0 40 30" fill="currentColor">' + inner + '</svg>'; };
  AD.charts.register({ id: 'pie', name: 'Pizza', purposes: ['part'], group: 'circular', multi: false, sortable: true,
    icon: I('<circle cx="20" cy="15" r="12" opacity=".4"/><path d="M20 15V3a12 12 0 0 1 11.4 8.3z"/><path d="M20 15l11.4-3.7A12 12 0 0 1 22 26.8z" opacity=".7"/>'),
    legendDefault: function (d) { return d.pieLabels !== 'outside'; },
    controls: ['seriesColors', 'pieLabels', 'pieText'], render: function (c) { return pieLike(c, false); } });
  AD.charts.register({ id: 'donut', name: 'Rosca', purposes: ['part', 'single'], group: 'circular', multi: false, sortable: true,
    icon: I('<circle cx="20" cy="15" r="9" fill="none" stroke="currentColor" stroke-width="6" opacity=".4"/><path d="M20 6a9 9 0 0 1 9 9" fill="none" stroke="currentColor" stroke-width="6"/>'),
    legendDefault: function (d) { return d.pieLabels !== 'outside'; },
    controls: ['seriesColors', 'donutHole', 'pieLabels', 'pieText', 'donutCenter'], render: function (c) { return pieLike(c, true); } });
  AD.charts.register({ id: 'cluster-donut', name: 'Rosca agrupada', purposes: ['part', 'comparison'], group: 'circular', multi: true, sortable: false,
    icon: I('<circle cx="10" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="30" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="10" cy="22" r="5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="30" cy="22" r="5" fill="none" stroke="currentColor" stroke-width="3"/>'),
    defaults: { legend: true }, controls: ['seriesColors', 'donutHole', 'donutCenter'], render: clusterDonut });
  AD.charts.register({ id: 'bubble', name: 'Gráfico de bolhas', purposes: ['comparison', 'relflow'], group: 'circular', multi: false, sortable: true,
    icon: I('<circle cx="14" cy="16" r="9" opacity=".5"/><circle cx="29" cy="11" r="6"/><circle cx="30" cy="24" r="4" opacity=".7"/>'),
    defaults: { varyColors: true }, controls: ['color', 'varyColors', 'seriesColors', 'bubbleGap'], render: bubble });
})();
