/* Núcleo: leitor de .xlsx sem dependências (ZIP + XML). Lê valores das células; ignora fórmulas, estilos e gráficos. */
(function () {
  'use strict';
  var AD = window.AD;

  function inflateRaw(bytes) {
    var ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter();
    w.write(bytes); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }

  /* Lê o diretório central do ZIP → { nome: {method, csize, off} } */
  function zipIndex(buf) {
    var dv = new DataView(buf), n = buf.byteLength, i, eocd = -1;
    for (i = n - 22; i >= Math.max(0, n - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('Arquivo não é um .xlsx válido.');
    var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), out = {}, td = new TextDecoder();
    for (i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      var flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      var name = td.decode(new Uint8Array(buf, p + 46, nl));
      out[name] = { method: method, csize: csize, off: off, enc: (flags & 1) === 1 };
      p += 46 + nl + el + cl;
    }
    return out;
  }
  function zipRead(buf, idx, name) {
    var e = idx[name]; if (!e) return Promise.resolve(null);
    if (e.enc) throw new Error('Planilha protegida por senha não é suportada.');
    var dv = new DataView(buf), nl = dv.getUint16(e.off + 26, true), el = dv.getUint16(e.off + 28, true), start = e.off + 30 + nl + el;
    var data = new Uint8Array(buf, start, e.csize);
    var p = e.method === 0 ? Promise.resolve(data) : e.method === 8 ? inflateRaw(data) : Promise.reject(new Error('Compressão não suportada.'));
    return p.then(function (u) { return new TextDecoder('utf-8').decode(u); });
  }
  function xml(s) { return new DOMParser().parseFromString(s, 'application/xml'); }
  function kids(el, tag) { return Array.prototype.filter.call(el.getElementsByTagName('*'), function (n) { return n.localName === tag; }); }
  function colIndex(ref) { var m = /^([A-Z]+)/.exec(ref), c = 0; if (!m) return 0; for (var i = 0; i < m[1].length; i++) c = c * 26 + m[1].charCodeAt(i) - 64; return c - 1; }

  var DATE_BUILTIN = [14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58];
  function serialToISO(v) {
    var ms = Math.round((v - 25569) * 86400000), d = new Date(ms);
    var p = function (x) { return (x < 10 ? '0' : '') + x; };
    return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate());
  }
  function numText(v) { var x = parseFloat(v); if (!isFinite(x)) return String(v); return String(parseFloat(x.toPrecision(12))).replace('.', ','); }

  /* Devolve Promise<{sheets:[{name, rows:[[texto]]}]}> */
  AD.readXlsx = function (buf) {
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('Este navegador não lê .xlsx. Salve como CSV e carregue o CSV.'));
    var idx;
    try { idx = zipIndex(buf); } catch (e) { return Promise.reject(e); }
    var rd = function (n) { try { return zipRead(buf, idx, n); } catch (e) { return Promise.reject(e); } };
    return Promise.all([rd('xl/workbook.xml'), rd('xl/_rels/workbook.xml.rels'), rd('xl/sharedStrings.xml'), rd('xl/styles.xml')]).then(function (r) {
      if (!r[0]) throw new Error('Arquivo não é um .xlsx válido.');
      var wb = xml(r[0]), rels = {}, strings = [], dateXf = {};
      if (r[1]) kids(xml(r[1]), 'Relationship').forEach(function (n) { rels[n.getAttribute('Id')] = n.getAttribute('Target'); });
      if (r[2]) kids(xml(r[2]), 'si').forEach(function (si) { strings.push(kids(si, 't').filter(function (t) { return t.parentNode.localName !== 'rPh'; }).map(function (t) { return t.textContent; }).join('')); });
      if (r[3]) {
        var st = xml(r[3]), custom = {};
        kids(st, 'numFmt').forEach(function (n) { custom[n.getAttribute('numFmtId')] = n.getAttribute('formatCode') || ''; });
        var xfs = kids(st, 'cellXfs')[0];
        if (xfs) Array.prototype.filter.call(xfs.children, function (n) { return n.localName === 'xf'; }).forEach(function (xf, i) {
          var id = xf.getAttribute('numFmtId'), isD = DATE_BUILTIN.indexOf(Number(id)) >= 0;
          if (!isD && custom[id]) isD = /[dmyh]/i.test(custom[id].replace(/"[^"]*"|\[[^\]]*\]|\\./g, ''));
          dateXf[i] = isD;
        });
      }
      var sheets = kids(wb, 'sheet').map(function (s) {
        var rid = s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || s.getAttribute('r:id'), t = rels[rid] || '';
        t = t.replace(/^\//, ''); if (t.indexOf('xl/') !== 0) t = 'xl/' + t;
        return { name: s.getAttribute('name'), path: t };
      });
      return Promise.all(sheets.map(function (s) { return rd(s.path); })).then(function (xs) {
        return {
          sheets: sheets.map(function (s, k) {
            var rows = [];
            if (xs[k]) kids(xml(xs[k]), 'c').forEach(function (c) {
              var ref = c.getAttribute('r') || '', rowN = parseInt(ref.replace(/^[A-Z]+/, ''), 10) - 1, col = colIndex(ref), t = c.getAttribute('t'), vEl = kids(c, 'v')[0], v = vEl ? vEl.textContent : '', out = '';
              if (t === 's') out = strings[Number(v)] || '';
              else if (t === 'inlineStr') out = kids(c, 't').map(function (x) { return x.textContent; }).join('');
              else if (t === 'str' || t === 'e') out = t === 'e' ? '' : v;
              else if (t === 'b') out = v === '1' ? 'Sim' : 'Não';
              else if (v !== '') out = dateXf[Number(c.getAttribute('s') || 0)] ? serialToISO(parseFloat(v)) : numText(v);
              if (out === '' || isNaN(rowN)) return;
              (rows[rowN] = rows[rowN] || [])[col] = out;
            });
            var w = 0; rows.forEach(function (r) { if (r) w = Math.max(w, r.length); });
            var clean = []; rows.forEach(function (r) { if (!r) return; var o = []; for (var q = 0; q < w; q++) o.push(r[q] == null ? '' : r[q]); clean.push(o); });
            return { name: s.name, rows: clean };
          })
        };
      });
    });
  };
})();
