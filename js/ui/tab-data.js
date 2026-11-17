/* Interface: aba Dados (grade editável, CSV, colunas e salvar/compartilhar). */
(function () {
  'use strict';
  var AD = window.AD, h = AD.h;

  var HINTS = {
    sankey: 'Colunas: etapas do fluxo (origem, …, destino) e, por último, o valor. Use 3 ou mais colunas.',
    keyfigures: 'Colunas: rótulo, valor (número ou texto, ex.: “R$ 3,2 bi”) e, opcionalmente, o id de um ícone (ex.: road, coin).',
    table: 'Todas as colunas são exibidas. Uma linha com só a primeira célula preenchida vira título de seção.',
    timeline: 'Colunas: data, evento e categoria (opcional). Datas: AAAA-MM-DD ou DD/MM/AAAA.',
    calendar: 'Colunas: atividade, início, fim e categoria (opcional). Início igual ao fim vira marco.',
    area: 'Primeira coluna = períodos; cada coluna seguinte é uma área.',
    combo: 'Primeira coluna = períodos; a 1ª coluna de valor vira colunas (eixo esquerdo) e as seguintes viram linhas (eixo direito).',
    scatter: 'Colunas: rótulo, X, Y e, opcionalmente, tamanho (vira bolha).',
    heatmap: 'Primeira coluna = linhas da matriz; cada coluna seguinte é uma coluna do mapa.',
    ufmap: 'Primeira coluna = UF (sigla ou nome, ex.: SP, São Paulo); segunda = valor.',
    line: 'Primeira coluna = períodos; cada coluna seguinte é uma linha.',
    'cluster-line': 'Primeira coluna = períodos; cada coluna seguinte gera um painel.',
    'cluster-donut': 'Primeira coluna = categorias (fatias); cada coluna seguinte gera uma rosca.'
  };

  /* CSV/TSV → {headers, rows}; detecta separador (tab, ; ou ,) */
  AD.parseTable = function (text) {
    text = String(text).replace(/\r/g, '').replace(/^﻿/, '');
    if (!text.trim()) return null;
    var first = text.split('\n')[0], delim = first.indexOf('\t') >= 0 ? '\t' : (first.split(';').length > first.split(',').length ? ';' : ',');
    var rows = [], row = [], cell = '', q = false, i, ch;
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"' && cell === '') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    row.push(cell); rows.push(row);
    rows = rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ''; }); });
    if (!rows.length) return null;
    var w = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    var pad = function (r) { var o = r.map(function (c) { return c.trim(); }); while (o.length < w) o.push(''); return o; };
    return { rows: rows.map(pad) };
  };

  AD.setGrid = function (t, keepText) {
    var rows = t.rows.slice(), headers = rows.shift();
    AD.S.data = { headers: headers.map(String), rows: rows };
    AD.S.labelCol = 0; AD.S.valueCols = []; AD.S.seriesColors = {};
    AD.emit('structure');
  };

  /* Importa .xlsx: lê o arquivo, escolhe a planilha (se houver mais de uma) e preenche a grade */
  AD.importXlsx = function (f) {
    var rd = new FileReader();
    rd.onerror = function () { AD.toast('Não consegui abrir o arquivo.'); };
    rd.onload = function () {
      AD.readXlsx(rd.result).then(function (wb) {
        var sh = wb.sheets.filter(function (s) { return s.rows.length > 1; });
        if (!sh.length) return AD.toast('Nenhuma planilha com dados (cabeçalho + linhas) foi encontrada.');
        var use = function (s) {
          if (s.rows.length > 2000) { s = { name: s.name, rows: s.rows.slice(0, 2000) }; AD.toast('Planilha grande: usei as primeiras 2.000 linhas.'); }
          AD.setGrid({ rows: s.rows }); AD.toast('Importado: ' + s.name + ' (' + (s.rows.length - 1) + ' linhas)');
        };
        if (sh.length === 1) return use(sh[0]);
        var sel = h('select', {}, sh.map(function (s, i) { return h('option', { value: i, text: s.name + ' (' + (s.rows.length - 1) + ' linhas)' }); }));
        AD.modal('Qual planilha importar?', h('div', {}, [h('div', { class: 'fhelp', text: 'O arquivo tem mais de uma planilha com dados.' }), sel]), [{ label: 'Cancelar' }, { label: 'Importar', primary: true, onclick: function () { use(sh[Number(sel.value)]); } }]);
      }).catch(function (e) { AD.toast(e.message || 'Não consegui ler esse .xlsx.'); });
    };
    rd.readAsArrayBuffer(f);
  };

  AD.buildDataTab = function (root) {
    root.innerHTML = '';
    var chart = AD.charts.byId[AD.S.type], G = AD.S.data;
    var ncols = function () { return G.headers.length; };

    /* ── topo ── */
    var file = h('input', { type: 'file', accept: '.csv,.tsv,.txt,.xlsx', hidden: true });
    file.addEventListener('change', function () {
      var f = file.files[0]; if (!f) return;
      if (/\.xlsx$/i.test(f.name)) { AD.importXlsx(f); file.value = ''; return; }
      var rd = new FileReader();
      rd.onload = function () { var t = AD.parseTable(String(rd.result)); t && t.rows.length > 1 ? AD.setGrid(t) : AD.toast('Não consegui ler esse arquivo. Use CSV com cabeçalho.'); };
      rd.readAsText(f, 'utf-8'); file.value = '';
    });
    root.appendChild(h('div', { class: 'sech' }, [h('h3', { text: 'Dados' })]));
    root.appendChild(h('div', { class: 'fhelp', text: 'Clique em uma célula e cole do Excel (Ctrl+V), digite ou carregue um CSV ou .xlsx. Números aceitam 1.234,5.' }));
    root.appendChild(h('div', { class: 'btnrow' }, [
      h('button', { type: 'button', class: 'btn', text: 'Carregar CSV ou Excel', onclick: function () { file.click(); } }), file,
      h('button', { type: 'button', class: 'linkbtn', text: 'Carregar dados de exemplo', onclick: function () { AD.loadSample(); } })
    ]));
    root.appendChild(h('div', { class: 'fhelp hint', text: HINTS[AD.S.type] || 'Primeira coluna = rótulos; as demais colunas = valores.' }));

    /* ── grade ── */
    var tbl = h('table', { class: 'grid' }), wrap = h('div', { class: 'gridwrap' }, [tbl]);
    function inputCell(r, c, val, isHead) {
      var inp = h('input', { type: 'text', value: val, 'data-r': r, 'data-c': c, 'aria-label': isHead ? 'Cabeçalho da coluna ' + (c + 1) : 'Linha ' + (r + 1) + ', coluna ' + (c + 1), spellcheck: 'false' });
      inp.addEventListener('input', function () {
        if (isHead) { G.headers[c] = inp.value; refreshCols(); } else G.rows[r][c] = inp.value;
        AD.emit('data');
      });
      inp.addEventListener('keydown', function (e) {
        var nr = r, nc = c;
        if (e.key === 'Enter' || e.key === 'ArrowDown') nr = r + 1; else if (e.key === 'ArrowUp') nr = r - 1; else return;
        e.preventDefault();
        var nx = tbl.querySelector('input[data-r="' + nr + '"][data-c="' + nc + '"]'); if (nx) { nx.focus(); nx.select(); }
      });
      inp.addEventListener('paste', function (e) {
        var txt = (e.clipboardData || window.clipboardData).getData('text');
        if (!/[\t\n]/.test(txt.replace(/\n$/, ''))) return;
        var t = AD.parseTable(txt); if (!t) return;
        e.preventDefault();
        var r0 = isHead ? -1 : r;
        /* colou a tabela inteira na 1ª célula: se a 1ª linha parece cabeçalho (sem números) e a 2ª tem números, ela vira o cabeçalho */
        if (!isHead && r === 0 && c === 0 && t.rows.length > 1) {
          var isNum = function (v) { return AD.parseNum(v) != null; };
          if (!t.rows[0].slice(1).some(isNum) && t.rows[1].slice(1).some(isNum)) r0 = -1;
        }
        t.rows.forEach(function (row, i) {
          var rr = r0 + i;
          row.forEach(function (v, j) {
            var cc = c + j;
            while (cc >= ncols()) { G.headers.push('Coluna ' + (ncols() + 1)); G.rows.forEach(function (x) { x.push(''); }); }
            if (rr === -1) G.headers[cc] = v;
            else { while (rr >= G.rows.length) G.rows.push(G.headers.map(function () { return ''; })); G.rows[rr][cc] = v; }
          });
        });
        AD.S.seriesColors = {}; renderGrid(); refreshCols(); AD.emit('data');
      });
      return inp;
    }
    function renderGrid() {
      tbl.innerHTML = '';
      var tr = h('tr', {}, [h('th', { class: 'rn' })]);
      G.headers.forEach(function (hd, c) {
        tr.appendChild(h('th', {}, [inputCell(-1, c, hd, true), ncols() > 2 ? h('button', { type: 'button', class: 'x', title: 'Remover coluna', 'aria-label': 'Remover coluna ' + (c + 1), text: '×', onclick: function () { G.headers.splice(c, 1); G.rows.forEach(function (r) { r.splice(c, 1); }); AD.S.valueCols = []; if (AD.S.labelCol >= ncols()) AD.S.labelCol = 0; AD.S.seriesColors = {}; renderGrid(); refreshCols(); AD.emit('data'); } }) : null]));
      });
      tbl.appendChild(h('thead', {}, [tr]));
      var tb = h('tbody');
      G.rows.forEach(function (row, r) {
        var rw = h('tr', {}, [h('td', { class: 'rn', text: r + 1 })]);
        G.headers.forEach(function (_, c) { rw.appendChild(h('td', {}, [inputCell(r, c, row[c] == null ? '' : row[c], false)])); });
        rw.appendChild(h('td', { class: 'xc' }, [h('button', { type: 'button', class: 'x', title: 'Remover linha', 'aria-label': 'Remover linha ' + (r + 1), text: '×', onclick: function () { G.rows.splice(r, 1); renderGrid(); AD.emit('data'); } })]));
        tb.appendChild(rw);
      });
      tbl.appendChild(tb);
    }
    renderGrid();
    root.appendChild(wrap);
    root.appendChild(h('div', { class: 'btnrow center' }, [
      h('button', { type: 'button', class: 'btn small', text: '+ Linha', onclick: function () { G.rows.push(G.headers.map(function () { return ''; })); renderGrid(); AD.emit('data'); } }),
      h('button', { type: 'button', class: 'btn small', text: '+ Coluna', onclick: function () { G.headers.push('Coluna ' + (ncols() + 1)); G.rows.forEach(function (r) { r.push(''); }); renderGrid(); refreshCols(); AD.emit('data'); } }),
      h('button', { type: 'button', class: 'btn small', text: 'Limpar', onclick: function () { if (confirm('Apagar todos os dados da tabela?')) { AD.S.data = { headers: ['Rótulo', 'Valor'], rows: [['', ''], ['', ''], ['', '']] }; AD.S.valueCols = []; AD.S.labelCol = 0; AD.S.seriesColors = {}; AD.emit('structure'); } } })
    ]));

    /* ── Colunas ── */
    var colBody = h('div', { class: 'colbody' });
    function refreshCols() {
      colBody.innerHTML = '';
      var raw = chart && chart.raw;
      if (raw) { colBody.appendChild(h('div', { class: 'fhelp', text: 'Este tipo usa as colunas na ordem em que aparecem na tabela.' })); }
      else {
        var sel = h('select', {}, G.headers.map(function (hd, i) { return h('option', { value: i, text: hd || ('Coluna ' + (i + 1)) }); }));
        sel.value = AD.S.labelCol;
        sel.addEventListener('change', function () { AD.S.labelCol = Number(sel.value); AD.S.valueCols = []; AD.S.seriesColors = {}; AD.emit('structure'); });
        colBody.appendChild(h('div', { class: 'field' }, [h('div', { class: 'flabel', text: 'Coluna de rótulos' }), sel]));
        var eff = AD.S.valueCols.length ? AD.S.valueCols : G.headers.map(function (_, i) { return i; }).filter(function (i) { return i !== AD.S.labelCol; });
        var box = h('div', { class: 'checks' });
        G.headers.forEach(function (hd, i) {
          if (i === AD.S.labelCol) return;
          var cb = h('input', { type: 'checkbox' }); cb.checked = eff.indexOf(i) >= 0;
          cb.addEventListener('change', function () {
            var all = G.headers.map(function (_, k) { return k; }).filter(function (k) { return k !== AD.S.labelCol; });
            var on = AD.$$('input', box).map(function (el, k) { return el.checked ? all[k] : null; }).filter(function (v) { return v != null; });
            AD.S.valueCols = on.length === all.length ? [] : on;
            AD.S.seriesColors = {}; AD.emit('data');
          });
          box.appendChild(h('label', { class: 'check' }, [cb, h('span', { text: hd || ('Coluna ' + (i + 1)) })]));
        });
        colBody.appendChild(h('div', { class: 'field' }, [h('div', { class: 'flabel', text: chart && !chart.multi ? 'Colunas de valor (este tipo usa a primeira marcada)' : 'Colunas de valor' }), box]));
      }
      if (!chart || chart.sortable !== false) {
        var s = h('input', { type: 'checkbox' }); s.checked = !!AD.S.sortDesc;
        s.addEventListener('change', function () { AD.S.sortDesc = s.checked; AD.emit('render'); });
        colBody.appendChild(h('label', { class: 'check' }, [s, h('span', { text: 'Ordenar do maior para o menor' })]));
      }
    }
    refreshCols();
    root.appendChild(AD.dgroup('c-cols', 'Colunas', 'columns', colBody));

    /* ── Salvar e compartilhar ── */
    var sh = h('div', {}, [
      h('div', { class: 'fhelp', text: 'Guarde o gráfico para editar depois ou envie a um colega.' }),
      h('div', { class: 'btnrow' }, [
        h('button', { type: 'button', class: 'btn', text: 'Compartilhar', onclick: function () { AD.openShare(); } }),
        h('button', { type: 'button', class: 'btn', text: 'Salvar (.json)', onclick: function () { AD.saveJSON(); } }),
        h('button', { type: 'button', class: 'btn', text: 'Carregar / importar', onclick: function () { AD.openShare('load'); } })
      ])
    ]);
    root.appendChild(AD.dgroup('c-share', 'Salvar e compartilhar', 'share', sh));
  };
})();
