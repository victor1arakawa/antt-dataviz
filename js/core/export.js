/* Núcleo: exportação (SVG, PNG, ZIP), arquivo JSON e link de compartilhamento. */
(function () {
  'use strict';
  var AD = window.AD;

  AD.download = function (blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  };
  AD.fileBase = function () { return AD.slug(AD.S.text.title || 'grafico'); };

  AD.currentSVG = function () { var r = AD.renderChart(AD.S); return r && r.svg ? r : null; };
  var withHeader = function (svg) { return '<?xml version="1.0" encoding="UTF-8"?>\n' + svg; };

  AD.exportSVG = function () {
    var r = AD.currentSVG(); if (!r) return false;
    AD.download(new Blob([withHeader(r.svg)], { type: 'image/svg+xml' }), AD.fileBase() + '.svg'); return true;
  };

  /* Embute as fontes Roboto no SVG usado para o PNG (se o navegador permitir ler os arquivos) */
  var fontCss = null;
  function loadFontCss() {
    if (fontCss !== null) return Promise.resolve(fontCss);
    var files = [['Roboto', 400, 'normal', 'Roboto-Regular'], ['Roboto', 700, 'normal', 'Roboto-Bold'], ['Roboto Condensed', 400, 'normal', 'RobotoCondensed-Regular'], ['Roboto Condensed', 700, 'normal', 'RobotoCondensed-Bold']];
    return Promise.all(files.map(function (f) {
      return fetch('fonts/' + f[3] + '.woff').then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (buf) {
        var bin = '', u = new Uint8Array(buf); for (var i = 0; i < u.length; i += 8192) bin += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
        return '@font-face{font-family:"' + f[0] + '";font-weight:' + f[1] + ';font-style:' + f[2] + ';src:url(data:font/woff;base64,' + btoa(bin) + ') format("woff");}';
      });
    })).then(function (parts) { fontCss = parts.join(''); return fontCss; }, function () { fontCss = ''; return ''; });
  }

  AD.svgToPNG = function (scale) {
    var r = AD.currentSVG(); if (!r) return Promise.reject(new Error('Sem gráfico'));
    return loadFontCss().then(function (css) {
      var svg = css ? r.svg.replace('>', '><defs><style>' + css + '</style></defs>') : r.svg;
      var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      return new Promise(function (res, rej) {
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas'); c.width = r.w * scale; c.height = r.h * scale;
          var x = c.getContext('2d'); x.scale(scale, scale); x.drawImage(img, 0, 0, r.w, r.h); URL.revokeObjectURL(url);
          c.toBlob(function (b) { b ? res(b) : rej(new Error('PNG vazio')); }, 'image/png');
        };
        img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Falha ao gerar o PNG')); };
        img.src = url;
      });
    });
  };
  AD.exportPNG = function () { return AD.svgToPNG(2).then(function (b) { AD.download(b, AD.fileBase() + '.png'); }); };

  /* ZIP simples (sem compressão) */
  var crcTable = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  AD.makeZip = function (files) { /* files: [{name, data:Uint8Array}] */
    var enc = new TextEncoder(), chunks = [], central = [], offset = 0;
    var u16 = function (v) { return [v & 255, v >> 8 & 255]; }, u32 = function (v) { return [v & 255, v >> 8 & 255, v >> 16 & 255, v >>> 24 & 255]; };
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      var head = [0x50, 0x4b, 3, 4].concat(u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(size), u32(size), u16(name.length), u16(0));
      chunks.push(new Uint8Array(head), name, f.data);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2].concat(u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(size), u32(size), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), name);
      offset += head.length + name.length + size;
    });
    var cdSize = central.reduce(function (a, c) { return a + c.length; }, 0);
    var end = new Uint8Array([0x50, 0x4b, 5, 6].concat(u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(offset), u16(0)));
    return new Blob(chunks.concat(central, [end]), { type: 'application/zip' });
  };
  AD.exportZIP = function () {
    var r = AD.currentSVG(); if (!r) return Promise.resolve(false);
    var enc = new TextEncoder(), base = AD.fileBase();
    return AD.svgToPNG(2).then(function (png) { return png.arrayBuffer(); }).then(function (buf) {
      AD.download(AD.makeZip([
        { name: base + '.svg', data: enc.encode(withHeader(r.svg)) },
        { name: base + '.png', data: new Uint8Array(buf) },
        { name: base + '.json', data: enc.encode(AD.stateJSON()) }
      ]), base + '.zip');
      return true;
    });
  };

  /* ── JSON e link ── */
  AD.stateJSON = function () { return JSON.stringify(Object.assign({ app: 'antt-dataviz' }, AD.S), null, 2); };
  AD.saveJSON = function () { AD.download(new Blob([AD.stateJSON()], { type: 'application/json' }), AD.fileBase() + '.json'); };
  AD.parseStateJSON = function (txt) {
    var o = JSON.parse(txt);
    if (!o || !o.data || !Array.isArray(o.data.rows)) throw new Error('Arquivo não reconhecido');
    return o;
  };

  function b64url(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64url(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function pipe(stream, bytes) { return new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }

  AD.makeLink = function () {
    var bytes = new TextEncoder().encode(JSON.stringify(AD.S));
    var base = location.href.split('#')[0];
    var done = function (prefix, u8) { var url = base + '#' + prefix + '=' + b64url(u8); return url; };
    if (typeof CompressionStream === 'function') return pipe(new CompressionStream('deflate-raw'), bytes).then(function (u8) { return done('z', u8); });
    return Promise.resolve(done('c', bytes));
  };
  AD.readLink = function () {
    var m = /^#(z|c)=([\w-]+)$/.exec(location.hash); if (!m) return Promise.resolve(null);
    try {
      var u8 = unb64url(m[2]);
      if (m[1] === 'c') return Promise.resolve(JSON.parse(new TextDecoder().decode(u8)));
      if (typeof DecompressionStream !== 'function') return Promise.resolve(null);
      return pipe(new DecompressionStream('deflate-raw'), u8).then(function (b) { return JSON.parse(new TextDecoder().decode(b)); }, function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  };
})();
