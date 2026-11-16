/* Gráfico: Sankey / aluvial. Colunas da tabela = etapas; a última coluna é o valor do fluxo. */
(function () {
  'use strict';
  var AD = window.AD;

  function sankey(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, W = ctx.W, body = ctx.body, g = ctx.data.grid, k = g.headers.length - 1, out = [];
    if (k < 2) return { h: 60, svg: AD.txt(W / 2, 30, 'Use pelo menos 3 colunas: origem, destino e valor.', { size: fs, fill: th.muted, anchor: 'middle' }) };
    var nodes = {}, stages = [], links = {}, s, r;
    for (s = 0; s < k; s++) stages.push([]);
    var node = function (st, name) {
      var key = st + '|' + name;
      if (!nodes[key]) { nodes[key] = { key: key, st: st, name: name, inV: 0, outV: 0, outL: [], inL: [], order: stages[st].length }; stages[st].push(nodes[key]); }
      return nodes[key];
    };
    g.rows.forEach(function (row) {
      var v = AD.parseNum(row[k]);
      if (!(v > 0)) return;
      for (s = 0; s < k - 1; s++) {
        var a = String(row[s] == null ? '' : row[s]).trim(), b = String(row[s + 1] == null ? '' : row[s + 1]).trim();
        if (!a || !b) continue;
        var na = node(s, a), nb = node(s + 1, b), lk = na.key + '>' + nb.key;
        if (!links[lk]) { links[lk] = { a: na, b: nb, v: 0 }; na.outL.push(links[lk]); nb.inL.push(links[lk]); }
        links[lk].v += v; na.outV += v; nb.inV += v;
      }
    });
    var all = Object.keys(nodes).map(function (q) { return nodes[q]; });
    if (!all.length) return { h: 60, svg: AD.txt(W / 2, 30, 'Sem fluxos com valores positivos.', { size: fs, fill: th.muted, anchor: 'middle' }) };
    all.forEach(function (n) { n.value = Math.max(n.inV, n.outV); });
    stages.forEach(function (arr) { arr.sort(function (x, y) { return y.value - x.value; }); });

    var showLab = d.sankeyLabels !== 'none', nw = Number(d.nodeWidth) || 18, pad = Number(d.nodePadding) || 14;
    var labText = function (n) {
      var val = AD.fmt(n.value, d);
      return d.sankeyLabels === 'name' ? [n.name] : d.sankeyLabels === 'value' ? [val] : [n.name, val];
    };
    var capW = W * 0.22, leftM = 0, rightM = 0;
    if (showLab) {
      stages[0].forEach(function (n) { leftM = Math.max(leftM, Math.min(capW, Math.max.apply(null, labText(n).map(function (t) { return AD.measure(t, fs, 400, body); })))); });
      stages[k - 1].forEach(function (n) { rightM = Math.max(rightM, Math.min(capW, Math.max.apply(null, labText(n).map(function (t) { return AD.measure(t, fs, 400, body); })))); });
    }
    leftM = leftM ? leftM + 8 : 0; rightM = rightM ? rightM + 8 : 0;
    var maxCnt = Math.max.apply(null, stages.map(function (a) { return a.length; }));
    var plotH = ctx.H ? ctx.H : Math.max(240, Math.min(560, maxCnt * (fs * 2.6) + 60));
    var scale = Infinity;
    stages.forEach(function (arr) { var tot = arr.reduce(function (a, n) { return a + n.value; }, 0); if (tot > 0) scale = Math.min(scale, (plotH - pad * (arr.length - 1)) / tot); });
    var span = W - leftM - rightM - nw;
    stages.forEach(function (arr, st) {
      var used = arr.reduce(function (a, n) { return a + n.value * scale; }, 0) + pad * (arr.length - 1), y = (plotH - used) / 2;
      arr.forEach(function (n) { n.h = Math.max(1.5, n.value * scale); n.x = leftM + (k === 1 ? 0 : st * span / (k - 1)); n.y = y; y += n.h + pad; });
    });

    /* cores dos nós */
    all.forEach(function (n) { n.color = null; });
    if (d.sankeyColor === 'single') all.forEach(function (n) { n.color = ctx.single(); });
    else {
      stages[0].forEach(function (n, i) { n.color = ctx.color(i, n.name); });
      for (s = 1; s < k; s++) stages[s].forEach(function (n, i) {
        var best = n.inL.slice().sort(function (x, y) { return y.v - x.v; })[0];
        n.color = best && best.a.color ? best.a.color : ctx.color(i + 3, n.name);
      });
    }

    /* ordem dos fluxos em cada nó para reduzir cruzamentos */
    all.forEach(function (n) {
      n.outL.sort(function (x, y) { return x.b.y - y.b.y; });
      n.inL.sort(function (x, y) { return x.a.y - y.a.y; });
    });
    all.forEach(function (n) { var o = n.y; n.outL.forEach(function (l) { l.sy = o; l.sh = l.v * scale; o += l.sh; }); });
    all.forEach(function (n) { var o = n.y; n.inL.forEach(function (l) { l.ty = o; l.th = l.v * scale; o += l.th; }); });

    var op = (Number(d.linkOpacity) || 40) / 100;
    Object.keys(links).forEach(function (q) {
      var l = links[q], x0 = l.a.x + nw, x1 = l.b.x, xm = (x0 + x1) / 2, fill = d.sankeyColor === 'single' ? AD.mix(th.bg, ctx.single(), 0.5) : l.a.color;
      out.push('<path d="M' + x0.toFixed(1) + ' ' + l.sy.toFixed(1) + ' C' + xm.toFixed(1) + ' ' + l.sy.toFixed(1) + ' ' + xm.toFixed(1) + ' ' + l.ty.toFixed(1) + ' ' + x1.toFixed(1) + ' ' + l.ty.toFixed(1) +
        ' L' + x1.toFixed(1) + ' ' + (l.ty + l.th).toFixed(1) + ' C' + xm.toFixed(1) + ' ' + (l.ty + l.th).toFixed(1) + ' ' + xm.toFixed(1) + ' ' + (l.sy + l.sh).toFixed(1) + ' ' + x0.toFixed(1) + ' ' + (l.sy + l.sh).toFixed(1) + 'Z" fill="' + fill + '" opacity="' + op + '"/>');
    });
    all.forEach(function (n) {
      out.push(AD.rect(n.x, n.y, nw, n.h, n.color));
      if (!showLab) return;
      var lines = labText(n);
      if (n.h < fs * 2.4 && lines.length > 1) lines = [lines.join('  ')];
      var first = n.st === 0, last = n.st === k - 1, ax = first ? n.x - 6 : (last ? n.x + nw + 6 : n.x + nw + 6), anchor = first ? 'end' : 'start';
      var maxw = first ? leftM - 5 : last ? rightM - 5 : (span / (k - 1)) - nw - 14;
      lines.forEach(function (t, q) {
        out.push(AD.txt(ax, n.y + n.h / 2 - (lines.length - 1) * fs * 0.6 + q * fs * 1.2 + fs * 0.33, AD.ellipsis(t, fs, q ? 700 : 400, body, Math.max(30, maxw)), { size: fs, weight: q && lines.length > 1 ? 700 : 400, fill: d.labelColor || th.text, anchor: anchor, halo: first || last ? null : th.bg }));
      });
    });
    return { h: plotH, svg: out.join('') };
  }

  AD.charts.register({ id: 'sankey', name: 'Sankey / aluvial', purposes: ['relflow'], group: 'circular', multi: false, sortable: false, raw: true,
    icon: '<svg viewBox="0 0 40 30" fill="currentColor"><rect x="3" y="4" width="4" height="12"/><rect x="3" y="20" width="4" height="6"/><rect x="33" y="4" width="4" height="8"/><rect x="33" y="16" width="4" height="10"/><path d="M7 4C20 4 20 4 33 4V12C20 12 20 12 7 12Z" opacity=".45"/><path d="M7 12C20 12 20 16 33 16V22C20 22 20 16 7 16Z" opacity=".45"/><path d="M7 20C20 20 20 22 33 22V26C20 26 20 26 7 26Z" opacity=".45"/></svg>',
    controls: ['nodeWidth', 'nodePadding', 'linkOpacity', 'sankeyLabels', 'sankeyColor', 'color', 'seriesColors'], render: sankey,
    colorKeys: function (data) { var c = []; data.grid.rows.forEach(function (r) { var v = String(r[0] == null ? '' : r[0]).trim(); if (v && c.indexOf(v) < 0) c.push(v); }); return c; } });
})();
