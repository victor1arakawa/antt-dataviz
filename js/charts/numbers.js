/* Gráficos de números: gráfico de ícones (pictograma) e números-chave. */
(function () {
  'use strict';
  var AD = window.AD, uid = 0;

  function niceUnit(max) {
    var raw = max / 10;
    if (raw <= 0) return 1;
    var e = Math.pow(10, Math.floor(Math.log10(raw)));
    return [1, 2, 5, 10].map(function (m) { return m * e; }).filter(function (u) { return u >= raw - 1e-9; })[0];
  }

  function iconChart(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, W = ctx.W, body = ctx.body, s = ctx.data.series[0];
    if (!s) return null;
    var labels = ctx.data.labels, max = Math.max.apply(null, s.vals.concat([0])), out = [];
    var unit = AD.parseNum(d.unitPer); if (!(unit > 0)) unit = niceUnit(max);
    var maxIcons = Math.max(1, Math.ceil(max / unit)), cap = Math.min(W * 0.3, 190), labW = 0;
    var wl = labels.map(function (l) { var w = AD.wrap(l, fs, 400, body, cap, 2); w.forEach(function (x) { labW = Math.max(labW, AD.measure(x, fs, 400, body)); }); return w; });
    var valW = 0; s.vals.forEach(function (v) { valW = Math.max(valW, AD.measure(AD.fmt(v, d), fs, 700, body)); });
    var avail = W - labW - 12 - valW - 10, size = Math.min(Number(d.iconSize) || 26, Math.floor(avail / maxIcons) - 3);
    size = Math.max(10, size);
    var step = size + 3, perRow = Math.max(1, Math.floor(avail / step)), y = 0, vary = !!d.varyColors;
    labels.forEach(function (l, i) {
      var v = Math.max(0, s.vals[i]), full = Math.floor(v / unit + 1e-9), part = v / unit - full, count = full + (part > 0.02 ? 1 : 0);
      var rows = Math.max(1, Math.ceil(Math.max(count, 1) / perRow)), rowH = rows * (size + 4), col = vary ? ctx.color(i, l) : ctx.single();
      var cy = y + rowH / 2, lines = wl[i];
      lines.forEach(function (ln, k) { out.push(AD.txt(labW, cy - (lines.length - 1) * fs * 0.6 + k * fs * 1.2 + fs * 0.33, ln, { size: fs, fill: th.text, anchor: 'end' })); });
      for (var q = 0; q < count; q++) {
        var rx = labW + 12 + (q % perRow) * step, ry = y + Math.floor(q / perRow) * (size + 4), frac = q < full ? 1 : part;
        if (frac >= 0.999) out.push(AD.iconSVG(d.iconId, rx, ry, size, col));
        else {
          var id = 'clip' + (++uid);
          out.push(AD.iconSVG(d.iconId, rx, ry, size, col).replace('<g ', '<g opacity="0.25" '));
          out.push('<clipPath id="' + id + '"><rect x="' + rx.toFixed(1) + '" y="' + ry.toFixed(1) + '" width="' + (size * frac).toFixed(1) + '" height="' + size + '"/></clipPath><g clip-path="url(#' + id + ')">' + AD.iconSVG(d.iconId, rx, ry, size, col) + '</g>');
        }
      }
      if (!(d.hideZero && v === 0)) {
        var lastCol = (count - 1) % perRow, lastRow = Math.floor(Math.max(0, count - 1) / perRow);
        out.push(AD.txt(labW + 12 + (count ? (lastCol + 1) * step + 4 : 0), y + lastRow * (size + 4) + size / 2 + fs * 0.33, AD.fmt(s.vals[i], d), { size: fs, weight: 700, fill: d.labelColor || th.text }));
      }
      y += rowH + Math.max(6, size * 0.3);
    });
    out.push(AD.txt(0, y + fs, '1 ícone = ' + AD.fmt(unit, d), { size: fs * 0.9, fill: th.muted }));
    return { h: y + fs * 1.6, svg: out.join('') };
  }

  function keyFigures(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, W = ctx.W, body = ctx.body, g = ctx.data.grid, out = [];
    var rows = g.rows.filter(function (r) { return String(r[0] || '').trim() || String(r[1] || '').trim(); });
    if (!rows.length) return null;
    var cols = Math.max(1, Math.min(4, Number(d.kfColumns) || 2, rows.length)), pad = Number(d.kfPadding) || 12, cw = W / cols;
    var vsz = fs * 2.7, cells = [], rowH = [];
    rows.forEach(function (r) {
      var raw = String(r[1] == null ? '' : r[1]).trim(), num = AD.parseNum(raw), val = num != null ? AD.fmt(num, d) : raw;
      var icon = String(r[2] == null ? '' : r[2]).trim().toLowerCase(), hasIcon = !!AD.ICONS[icon], isz = vsz * 1.15;
      var textW = cw - 2 * pad - (hasIcon && d.kfIconPos !== 'top' ? isz + 10 : 0);
      var lab = AD.wrap(String(r[0] || ''), fs, 400, body, Math.max(40, textW), 3);
      var vw = AD.measure(val, vsz, 700, ctx.title), vs = vw > textW ? vsz * textW / vw : vsz;
      var h = 2 * pad + vs * 1.15 + lab.length * fs * 1.25 + (hasIcon && d.kfIconPos === 'top' ? isz + 6 : 0);
      cells.push({ val: val, lab: lab, icon: hasIcon ? icon : null, vs: vs, isz: isz, h: h, textW: textW });
    });
    var y = 0;
    for (var r0 = 0; r0 < cells.length; r0 += cols) {
      var rowCells = cells.slice(r0, r0 + cols), h = Math.max.apply(null, rowCells.map(function (c) { return c.h; }));
      rowCells.forEach(function (c, k) {
        var x = k * cw, tx = x + pad, ty = y + pad;
        if (c.icon) {
          if (d.kfIconPos === 'top') { out.push(AD.iconSVG(c.icon, tx, ty, c.isz, ctx.single())); ty += c.isz + 6; }
          else if (d.kfIconPos === 'right') out.push(AD.iconSVG(c.icon, x + cw - pad - c.isz, y + pad, c.isz, ctx.single()));
          else { out.push(AD.iconSVG(c.icon, tx, y + pad, c.isz, ctx.single())); tx += c.isz + 10; }
        }
        out.push(AD.txt(tx, ty + c.vs * 0.95, c.val, { size: c.vs, weight: 700, fill: d.color || th.text, family: ctx.title }));
        c.lab.forEach(function (ln, q) { out.push(AD.txt(tx, ty + c.vs * 1.15 + fs * 1.1 + q * fs * 1.25, ln, { size: fs, fill: th.muted })); });
        if (d.kfSeparators && k > 0) out.push(AD.line(x, y + pad / 2, x, y + h - pad / 2, th.grid, 1));
      });
      y += h;
      if (d.kfSeparators && r0 + cols < cells.length) out.push(AD.line(0, y, W, y, th.grid, 1));
    }
    return { h: y, svg: out.join('') };
  }

  AD.charts.register({ id: 'icon', name: 'Gráfico de ícones', purposes: ['single', 'comparison'], group: 'numbers', multi: false, sortable: true,
    icon: '<svg viewBox="0 0 40 30" fill="currentColor"><circle cx="8" cy="7" r="3"/><path d="M3 15c0-3 2-4.5 5-4.5s5 1.500 5 4.500z"/><circle cx="20" cy="7" r="3"/><path d="M15 15c0-3 2-4.500 5-4.500s5 1.500 5 4.500z"/><circle cx="8" cy="21" r="3" opacity=".4"/><path d="M3 29c0-3 2-4.500 5-4.500s5 1.500 5 4.500z" opacity=".4"/></svg>',
    controls: ['color', 'varyColors', 'iconId', 'iconSize', 'unitPer'], render: iconChart });
  AD.charts.register({ id: 'keyfigures', name: 'Números-chave', purposes: ['single'], group: 'numbers', multi: false, sortable: false, raw: true,
    icon: '<svg viewBox="0 0 40 30" fill="currentColor"><rect x="3" y="4" width="14" height="7" rx="1"/><rect x="3" y="13" width="10" height="3" opacity=".45"/><rect x="23" y="4" width="14" height="7" rx="1"/><rect x="23" y="13" width="10" height="3" opacity=".45"/><rect x="3" y="20" width="14" height="7" rx="1"/><rect x="23" y="20" width="14" height="7" rx="1"/></svg>',
    controls: ['color', 'kfColumns', 'kfIconPos', 'kfSeparators', 'kfPadding'], render: keyFigures });
})();
