/* Gráficos de detalhe e tempo: tabela de dados, linha do tempo e calendário/planejador. */
(function () {
  'use strict';
  var AD = window.AD;

  /* ───────── Tabela ───────── */
  function table(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, W = ctx.W, body = ctx.body, g = ctx.data.grid, out = [];
    var hs = g.headers, nc = hs.length, rows = g.rows;
    var padX = 8, padY = 6, lh = fs * 1.25, look = d.tableLook;
    var isNum = hs.map(function (_, c) {
      var vals = rows.map(function (r) { return String(r[c] == null ? '' : r[c]).trim(); }).filter(Boolean);
      return c > 0 && vals.length > 0 && vals.filter(function (v) { return AD.parseNum(v) != null; }).length >= vals.length * 0.6;
    });
    var nat = hs.map(function (h, c) {
      var m = AD.measure(h, fs, 700, body);
      rows.forEach(function (r) { m = Math.max(m, Math.min(W * 0.5, AD.measure(String(r[c] == null ? '' : r[c]), fs, 400, body))); });
      return m + 2 * padX;
    });
    var T = nat.reduce(function (a, b) { return a + b; }, 0), cw = nat.map(function (w) { return w * W / T; });
    var xs = [], x = 0; cw.forEach(function (w) { xs.push(x); x += w; });
    var colMax = hs.map(function (_, c) { return isNum[c] ? Math.max.apply(null, rows.map(function (r) { return Math.max(0, AD.parseNum(r[c]) || 0); }).concat([0])) : 0; });
    var colors = ctx.th.colors;

    var hl = hs.map(function (h, c) { return AD.wrap(h, fs, 700, body, cw[c] - 2 * padX, 3); });
    var hh = Math.max.apply(null, hl.map(function (l) { return l.length; })) * lh + 2 * padY, y = 0;
    var headFill = look === 'classic' ? colors[0] : null, headText = look === 'classic' ? AD.contrastText(colors[0]) : th.text;
    if (headFill) out.push(AD.rect(0, 0, W, hh, headFill));
    hs.forEach(function (h, c) {
      hl[c].forEach(function (ln, q) {
        var ax = isNum[c] ? xs[c] + cw[c] - padX : xs[c] + padX;
        out.push(AD.txt(ax, padY + fs * 0.95 + q * lh, ln, { size: fs, weight: 700, fill: headText, anchor: isNum[c] ? 'end' : 'start' }));
      });
    });
    y = hh;
    if (!headFill) out.push(AD.line(0, y, W, y, th.text, 2));
    rows.forEach(function (r, ri) {
      var section = String(r[0] || '').trim() && r.slice(1).every(function (c) { return !String(c == null ? '' : c).trim(); });
      var cells = hs.map(function (_, c) { return AD.wrap(String(r[c] == null ? '' : r[c]), fs, section ? 700 : 400, body, (section ? W : cw[c]) - 2 * padX, 3); });
      var rh = (section ? 1 : Math.max.apply(null, cells.map(function (l) { return l.length; }))) * lh + 2 * padY;
      if (section) out.push(AD.rect(0, y, W, rh, AD.mix(th.bg, colors[0], 0.18)));
      else if (look === 'classic' && ri % 2 === 1) out.push(AD.rect(0, y, W, rh, AD.mix(th.bg, th.text, 0.05)));
      if (section) out.push(AD.txt(padX, y + padY + fs * 0.95, cells[0][0] || '', { size: fs, weight: 700, fill: th.text }));
      else cells.forEach(function (lines, c) {
        if (look === 'bars' && isNum[c]) {
          var v = Math.max(0, AD.parseNum(r[c]) || 0), bw = colMax[c] ? (cw[c] - 2 * padX) * v / colMax[c] : 0;
          out.push(AD.rect(xs[c] + padX, y + 3, bw, rh - 6, AD.mix(th.bg, colors[(c - 1) % colors.length], 0.45)));
        }
        lines.forEach(function (ln, q) {
          out.push(AD.txt(isNum[c] ? xs[c] + cw[c] - padX : xs[c] + padX, y + padY + fs * 0.95 + q * lh, ln, { size: fs, fill: th.text, anchor: isNum[c] ? 'end' : 'start', weight: c === 0 && look !== 'bars' ? 500 : 400 }));
        });
      });
      y += rh;
      out.push(AD.line(0, y, W, y, th.grid, 1));
    });
    return { h: y, svg: out.join('') };
  }

  /* ───────── Linha do tempo ───────── */
  function catColors(ctx, cats) {
    var m = {}; cats.forEach(function (c, i) { m[c] = ctx.color(i, c); }); return m;
  }
  function events(ctx) {
    var g = ctx.data.grid, ev = g.rows.map(function (r, i) {
      return { date: String(r[0] == null ? '' : r[0]).trim(), text: String(r[1] == null ? '' : r[1]).trim(), cat: String(r[2] == null ? '' : r[2]).trim(), t: AD.parseDate(r[0]), i: i };
    }).filter(function (e) { return e.date || e.text; });
    if (ev.length && ev.every(function (e) { return e.t; })) ev.sort(function (a, b) { return a.t - b.t || a.i - b.i; });
    return ev;
  }

  function timeline(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, W = ctx.W, body = ctx.body, out = [], ev = events(ctx);
    if (!ev.length) return null;
    var cats = []; ev.forEach(function (e) { if (e.cat && cats.indexOf(e.cat) < 0) cats.push(e.cat); });
    var cm = catColors(ctx, cats), colorOf = function (e) { return e.cat ? cm[e.cat] : ctx.single(); };
    var y = 0;
    if (cats.length && ctx.legendOn(true)) {
      var lg = AD.legend(ctx, cats.map(function (c) { return { label: c, color: cm[c] }; }), 0, 0, W); out.push(lg.svg); y = lg.h + 8;
    }
    var gap = Number(d.tlGap) || 14, tsz = d.tlCompact ? fs * 0.92 : fs;
    if (d.tlOrientation === 'horizontal') {
      var n = ev.length, step = Math.min(Number(d.tlSpacing) || 110, (W + 10) / (n + 1)), bw = Math.max(60, 2 * step - 10), boxes = [];
      ev.forEach(function (e, i) {
        var lines = AD.wrap(e.text, tsz, 400, body, bw, 5), h = (e.date ? tsz * 1.3 : 0) + lines.length * tsz * 1.25;
        boxes.push({ e: e, lines: lines, h: h, x: bw / 2 + i * step, up: i % 2 === 0 });
      });
      var ha = Math.max.apply(null, boxes.filter(function (b) { return b.up; }).map(function (b) { return b.h; }).concat([0])), hb = Math.max.apply(null, boxes.filter(function (b) { return !b.up; }).map(function (b) { return b.h; }).concat([0]));
      var ay = y + ha + 26;
      out.push(AD.line(0, ay, W, ay, th.grid, 3));
      boxes.forEach(function (b) {
        var col = colorOf(b.e), by = b.up ? ay - 16 - b.h : ay + 16, ty = by;
        out.push(AD.line(b.x, ay, b.x, b.up ? ay - 14 : ay + 14, col, 1.5));
        out.push('<circle cx="' + b.x.toFixed(1) + '" cy="' + ay + '" r="5" fill="' + col + '" stroke="' + th.bg + '" stroke-width="2"/>');
        var cy = ty;
        if (b.e.date) { cy += tsz * 1.0; out.push(AD.txt(b.x, cy, b.e.date, { size: tsz, weight: 700, fill: th.text, anchor: 'middle' })); cy += tsz * 0.3; }
        b.lines.forEach(function (ln) { cy += tsz * 1.25; out.push(AD.txt(b.x, cy - tsz * 0.2, ln, { size: tsz, fill: th.text, anchor: 'middle' })); });
      });
      return { h: ay + hb + 24, svg: out.join('') };
    }
    var dw = 0; ev.forEach(function (e) { dw = Math.max(dw, AD.measure(e.date, tsz, 700, body)); }); dw = Math.min(dw, W * 0.28);
    var lx = dw + 16, tw = W - lx - 14, yy = y + 4, top = yy;
    ev.forEach(function (e) {
      var lines = AD.wrap(e.text, tsz, 400, body, tw), h = Math.max(lines.length * tsz * 1.3, tsz * 1.3), col = colorOf(e);
      out.push(AD.txt(dw, yy + tsz * 1.0, AD.ellipsis(e.date, tsz, 700, body, dw + 1), { size: tsz, weight: 700, fill: th.text, anchor: 'end' }));
      out.push('<circle cx="' + lx + '" cy="' + (yy + tsz * 0.7).toFixed(1) + '" r="5" fill="' + col + '" stroke="' + th.bg + '" stroke-width="2"/>');
      lines.forEach(function (ln, q) { out.push(AD.txt(lx + 14, yy + tsz * 1.0 + q * tsz * 1.3, ln, { size: tsz, fill: th.text })); });
      e.y = yy; yy += h + gap;
    });
    out.unshift(AD.line(lx, top + tsz * 0.7, lx, yy - gap - tsz * 0.5, th.grid, 2));
    return { h: yy - gap + 4, svg: out.join('') };
  }

  /* ───────── Calendário / planejador ───────── */
  var MONTHS = { pt: 'jan fev mar abr mai jun jul ago set out nov dez', en: 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec', es: 'ene feb mar abr may jun jul ago sep oct nov dic' };
  var QLAB = { pt: 'T', en: 'Q', es: 'T' };

  function calendar(ctx) {
    var d = ctx.d, th = ctx.th, fs = ctx.fs, W = ctx.W, body = ctx.body, out = [], g = ctx.data.grid;
    var items = g.rows.map(function (r) {
      return { name: String(r[0] == null ? '' : r[0]).trim(), s: AD.parseDate(r[1]), e: AD.parseDate(r[2]), cat: String(r[3] == null ? '' : r[3]).trim() };
    }).filter(function (it) { return it.name && (it.s || it.e); });
    if (!items.length) return { h: 60, svg: AD.txt(W / 2, 30, 'Use as colunas: Atividade, Início, Fim e Categoria (opcional).', { size: fs, fill: th.muted, anchor: 'middle' }) };
    items.forEach(function (it) { if (!it.s) it.s = it.e; if (!it.e) it.e = it.s; if (it.e < it.s) { var t = it.s; it.s = it.e; it.e = t; } });
    var minS = new Date(Math.min.apply(null, items.map(function (i) { return +i.s; }))), maxE = new Date(Math.max.apply(null, items.map(function (i) { return +i.e; })));
    var gran = d.calGranularity, lang = MONTHS[d.calLang] ? d.calLang : 'pt', mn = MONTHS[lang].split(' ');
    var yr = parseInt(d.calYear, 10), fm = Math.max(1, Math.min(12, Number(d.calFirstMonth) || 1)) - 1;
    var perUnit = gran === 'years' ? 12 : gran === 'quarters' ? 3 : 1;
    var startM = yr ? yr * 12 + fm : minS.getFullYear() * 12 + minS.getMonth();
    if (!yr && gran === 'quarters') startM -= startM % 3;
    if (!yr && gran === 'years') startM -= startM % 12;
    var endM = maxE.getFullYear() * 12 + maxE.getMonth(), units = Math.max(1, Math.ceil((endM - startM + 1) / perUnit));
    if (yr) units = Math.max(units, Math.ceil(12 / perUnit));
    units = Math.min(units, 60);
    var cats = []; items.forEach(function (it) { if (it.cat && cats.indexOf(it.cat) < 0) cats.push(it.cat); });
    var cm = catColors(ctx, cats), colorOf = function (it) { return it.cat ? cm[it.cat] : ctx.single(); };

    var y = 0;
    if (cats.length && ctx.legendOn(true)) { var lg = AD.legend(ctx, cats.map(function (c) { return { label: c, color: cm[c] }; }), 0, 0, W); out.push(lg.svg); y = lg.h + 6; }
    var nameW = 0;
    if (d.calRowNames) { items.forEach(function (it) { nameW = Math.max(nameW, AD.measure(it.name, fs, 400, body)); }); nameW = Math.min(nameW, W * 0.32) + 12; }
    var gw = W - nameW, cwid = gw / units, rowH = fs * 2.1, headH = fs * 3.2;
    var yearOf = function (u) { return Math.floor((startM + u * perUnit) / 12); };
    /* cabeçalho: anos + unidades */
    var u, run = 0;
    for (u = 0; u <= units; u++) {
      if (u === units || (u > 0 && yearOf(u) !== yearOf(u - 1))) {
        var x0 = nameW + run * cwid, wd = (u - run) * cwid;
        if (gran !== 'years') out.push(AD.txt(x0 + wd / 2, y + fs * 1.1, String(yearOf(u - 1)), { size: fs, weight: 700, fill: th.text, anchor: 'middle' }));
        run = u;
      }
    }
    for (u = 0; u < units; u++) {
      var abs = startM + u * perUnit, m = ((abs % 12) + 12) % 12, label = gran === 'months' ? mn[m] : gran === 'quarters' ? QLAB[lang] + (Math.floor(m / 3) + 1) : String(Math.floor(abs / 12));
      if (AD.measure(label, fs * 0.9, 400, body) > cwid - 3) label = label.charAt(0);
      out.push(AD.txt(nameW + (u + 0.5) * cwid, y + fs * 2.5, label, { size: fs * 0.9, fill: th.muted, anchor: 'middle' }));
    }
    var gy = y + headH, gh = items.length * rowH;
    if (d.calBands) items.forEach(function (it, i) { if (i % 2 === 0) out.push(AD.rect(0, gy + i * rowH, W, rowH, AD.mix(th.bg, th.text, 0.05))); });
    if (d.calLines) for (u = 0; u <= units; u++) out.push(AD.line(nameW + u * cwid, y + headH - 6, nameW + u * cwid, gy + gh, th.grid, 1));
    var posOf = function (dt, endInc) {
      var abs = dt.getFullYear() * 12 + dt.getMonth(), dim = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
      var frac = (dt.getDate() - 1 + (endInc ? 1 : 0)) / dim;
      return ((abs - startM) + frac) / perUnit;
    };
    items.forEach(function (it, i) {
      var cy = gy + i * rowH + rowH / 2, col = colorOf(it);
      if (d.calRowNames) out.push(AD.txt(6, cy + fs * 0.33, AD.ellipsis(it.name, fs, 400, body, nameW - 12), { size: fs, fill: th.text }));
      var a = Math.max(0, posOf(it.s, false)), b = Math.min(units, posOf(it.e, true));
      if (+it.s === +it.e) { var cx = nameW + a * cwid; out.push('<path d="M' + cx + ' ' + (cy - 7) + ' L' + (cx + 7) + ' ' + cy + ' L' + cx + ' ' + (cy + 7) + ' L' + (cx - 7) + ' ' + cy + 'Z" fill="' + col + '"/>'); }
      else out.push(AD.rect(nameW + a * cwid, cy - fs * 0.55, Math.max(4, (b - a) * cwid), fs * 1.1, col, { rx: 3 }));
    });
    return { h: gy + gh - 0, svg: out.join('') };
  }

  var tbl = '<svg viewBox="0 0 40 30" fill="currentColor"><rect x="3" y="4" width="34" height="6" rx="1"/><rect x="3" y="12" width="34" height="3" opacity=".35"/><rect x="3" y="17" width="34" height="3" opacity=".2"/><rect x="3" y="22" width="34" height="3" opacity=".35"/></svg>';
  AD.charts.register({ id: 'table', name: 'Tabela de dados', purposes: [], group: 'detail', multi: false, sortable: false, raw: true, icon: tbl,
    controls: ['tableLook', 'color'], render: table });
  AD.charts.register({ id: 'timeline', name: 'Linha do tempo', purposes: ['trend'], group: 'detail', multi: false, sortable: false, raw: true,
    icon: '<svg viewBox="0 0 40 30" fill="currentColor"><rect x="4" y="14" width="32" height="2"/><circle cx="10" cy="15" r="3"/><circle cx="20" cy="15" r="3"/><circle cx="30" cy="15" r="3"/><rect x="6" y="4" width="8" height="5" opacity=".45"/><rect x="16" y="21" width="8" height="5" opacity=".45"/><rect x="26" y="4" width="8" height="5" opacity=".45"/></svg>',
    defaults: { legend: true }, controls: ['color', 'seriesColors', 'tlOrientation', 'tlSpacing', 'tlCompact', 'tlGap'], render: timeline,
    colorKeys: function (data) { var c = []; data.grid.rows.forEach(function (r) { var v = String(r[2] == null ? '' : r[2]).trim(); if (v && c.indexOf(v) < 0) c.push(v); }); return c; } });
  AD.charts.register({ id: 'calendar', name: 'Calendário / planejador', purposes: ['trend'], group: 'detail', multi: false, sortable: false, raw: true,
    icon: '<svg viewBox="0 0 40 30" fill="currentColor"><rect x="3" y="4" width="34" height="4" rx="1"/><rect x="3" y="11" width="14" height="4" rx="1" opacity=".5"/><rect x="12" y="17" width="18" height="4" rx="1"/><rect x="22" y="23" width="14" height="4" rx="1" opacity=".5"/></svg>',
    defaults: { legend: true }, controls: ['color', 'seriesColors', 'calGranularity', 'calLang', 'calFirstMonth', 'calYear', 'calRowNames', 'calBands', 'calLines'], render: calendar,
    colorKeys: function (data) { var c = []; data.grid.rows.forEach(function (r) { var v = String(r[3] == null ? '' : r[3]).trim(); if (v && c.indexOf(v) < 0) c.push(v); }); return c; } });
})();
