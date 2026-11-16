/* Núcleo: utilidades (texto, números, cores). Namespace global AD. */
(function () {
  'use strict';
  var AD = window.AD = window.AD || {};

  AD.esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  /* ── Medição de texto (canvas, com a fonte real) ── */
  var cv = document.createElement('canvas').getContext('2d');
  var mcache = {};
  AD.measure = function (text, size, weight, family) {
    text = String(text);
    var key = (weight || 400) + '|' + size + '|' + family + '|' + text;
    if (mcache[key] != null) return mcache[key];
    cv.font = (weight || 400) + ' ' + size + 'px ' + (family || 'sans-serif');
    var w = cv.measureText(text).width;
    if (Object.keys(mcache).length > 6000) mcache = {};
    mcache[key] = w;
    return w;
  };
  AD.clearMeasureCache = function () { mcache = {}; };

  /* Quebra de linha por largura. Retorna no máx. maxLines linhas (a última recebe reticências). */
  AD.wrap = function (text, size, weight, family, maxW, maxLines) {
    var out = [];
    String(text == null ? '' : text).split(/\r?\n/).forEach(function (para) {
      var words = para.split(/\s+/).filter(Boolean), line = '';
      if (!words.length) { out.push(''); return; }
      words.forEach(function (w) {
        var t = line ? line + ' ' + w : w;
        if (line && AD.measure(t, size, weight, family) > maxW) { out.push(line); line = w; }
        else line = t;
      });
      out.push(line);
    });
    if (maxLines && out.length > maxLines) {
      out = out.slice(0, maxLines);
      out[maxLines - 1] = AD.ellipsis(out[maxLines - 1] + '…', size, weight, family, maxW);
    }
    // palavra única maior que a largura: corta com reticências
    return out.map(function (l) { return AD.measure(l, size, weight, family) > maxW * 1.02 ? AD.ellipsis(l, size, weight, family, maxW) : l; });
  };
  AD.ellipsis = function (s, size, weight, family, maxW) {
    if (AD.measure(s, size, weight, family) <= maxW) return s;
    s = s.replace(/…$/, '');
    while (s.length > 1 && AD.measure(s + '…', size, weight, family) > maxW) s = s.slice(0, -1);
    return s + '…';
  };

  /* ── Números no padrão brasileiro ── */
  AD.parseNum = function (v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var t = String(v == null ? '' : v).trim();
    if (!t) return null;
    t = t.replace(/\s/g, '').replace(/^R\$/i, '').replace(/%$/, '');
    var mult = 1, m = /^(-?[\d.,]+)(mil|mi|bi|k|m|b)$/i.exec(t);
    if (m) { t = m[1]; mult = { mil: 1e3, k: 1e3, mi: 1e6, m: 1e6, bi: 1e9, b: 1e9 }[m[2].toLowerCase()]; }
    if (!/^-?[\d.,]+$/.test(t)) return null;
    if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    var n = parseFloat(t);
    return isFinite(n) ? n * mult : null;
  };

  /* o: {valueFormat:'auto|full|k|m|b', decimals:-1(auto)..6, prefix, suffix} */
  AD.fmt = function (v, o) {
    o = o || {};
    var f = o.valueFormat || 'auto', a = Math.abs(v), n = v, suf = '';
    if (f === 'auto') {
      if (a >= 1e9) { n = v / 1e9; suf = ' bi'; }
      else if (a >= 1e6) { n = v / 1e6; suf = ' mi'; }
      else if (a >= 1e4) { n = v / 1e3; suf = ' mil'; }
    } else if (f === 'k') { n = v / 1e3; suf = ' mil'; }
    else if (f === 'm') { n = v / 1e6; suf = ' mi'; }
    else if (f === 'b') { n = v / 1e9; suf = ' bi'; }
    var d = (o.decimals == null || o.decimals < 0) ? null : Math.min(6, o.decimals), minF, maxF;
    if (d != null) { minF = maxF = d; }
    else { minF = 0; maxF = suf ? 1 : (Math.abs(n - Math.round(n)) < 1e-9 ? 0 : (a < 10 ? 2 : 1)); }
    var s = n.toLocaleString('pt-BR', { minimumFractionDigits: minF, maximumFractionDigits: maxF });
    return (o.prefix || '') + s + suf + (o.suffix || '');
  };
  AD.pct = function (frac, dec) {
    return (frac * 100).toLocaleString('pt-BR', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }) + '%';
  };

  /* Escala "bonita" para eixos */
  AD.niceScale = function (lo, hi, count) {
    if (hi === lo) { hi = lo + 1; }
    var range = hi - lo, e = Math.floor(Math.log10(range / (count || 5))), base = Math.pow(10, e), f = (range / (count || 5)) / base;
    var step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * base;
    var a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step, t = [];
    for (var v = a; v <= b + step / 2; v += step) t.push(Math.round(v / step) * step);
    return { min: a, max: b, ticks: t, step: step };
  };

  /* ── Cores ── */
  function rgb(hex) {
    hex = String(hex || '#000').replace('#', '');
    if (hex.length === 3) hex = hex.replace(/./g, '$&$&');
    var n = parseInt(hex.slice(0, 6), 16) || 0;
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function toHex(c) { return '#' + c.map(function (x) { return ('0' + Math.max(0, Math.min(255, Math.round(x))).toString(16)).slice(-2); }).join(''); }
  AD.lum = function (hex) { var c = rgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  AD.contrastText = function (bg, dark, light) { return AD.lum(bg) > 0.42 ? (dark || '#2E3338') : (light || '#FFFFFF'); };
  AD.mix = function (a, b, t) { var x = rgb(a), y = rgb(b); return toHex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); };
  AD.ramp = function (base, bg, n) { var o = []; for (var i = 0; i < n; i++) o.push(AD.mix(bg, base, 0.15 + 0.85 * (n === 1 ? 1 : i / (n - 1)))); return o; };

  /* ── Datas (aceita AAAA-MM-DD, DD/MM/AAAA, MM/AAAA, AAAA) ── */
  AD.parseDate = function (v) {
    var t = String(v == null ? '' : v).trim(), m;
    if (!t) return null;
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t))) return new Date(+m[1], +m[2] - 1, +m[3]);
    if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t))) return new Date(+m[3], +m[2] - 1, +m[1]);
    if ((m = /^(\d{1,2})\/(\d{4})$/.exec(t))) return new Date(+m[2], +m[1] - 1, 1);
    if ((m = /^(\d{4})-(\d{1,2})$/.exec(t))) return new Date(+m[1], +m[2] - 1, 1);
    if ((m = /^(\d{4})$/.exec(t))) return new Date(+m[1], 0, 1);
    return null;
  };

  AD.slug = function (s) {
    return String(s || 'grafico').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'grafico';
  };

  AD.$ = function (s, r) { return (r || document).querySelector(s); };
  AD.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  AD.h = function (tag, attrs, children) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else if (k === 'html') el.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  };
})();
