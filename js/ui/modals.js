/* Interface: janelas (temas, ícones, compartilhar, ajuda) e avisos. */
(function () {
  'use strict';
  var AD = window.AD, h = AD.h;

  AD.toast = function (msg) {
    var t = h('div', { class: 'toast', role: 'status', text: msg }); document.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  };

  AD.modal = function (title, body, actions, opts) {
    opts = opts || {};
    var prevFocus = document.activeElement;
    var back = h('div', { class: 'modal-back' }), box = h('div', { class: 'modal' + (opts.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
    var close = function () { back.remove(); document.removeEventListener('keydown', esc); if (prevFocus && prevFocus.focus) prevFocus.focus(); };
    var esc = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    box.appendChild(h('div', { class: 'modal-head' }, [h('h3', { text: title }), h('button', { type: 'button', class: 'x', 'aria-label': 'Fechar', text: '×', onclick: close })]));
    box.appendChild(h('div', { class: 'modal-body' }, [body]));
    if (actions && actions.length) box.appendChild(h('div', { class: 'modal-foot' }, actions.map(function (a) {
      return h('button', { type: 'button', class: 'btn' + (a.primary ? ' primary' : ''), text: a.label, onclick: function () { a.onclick && a.onclick(close); if (!a.keep) close(); } });
    })));
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    back.appendChild(box); document.body.appendChild(back);
    var f = box.querySelector('input,textarea,select,button.btn'); if (f) f.focus();
    return { close: close, el: box };
  };

  function copy(text, ok) {
    var done = function () { AD.toast(ok || 'Copiado'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    else fallback();
    function fallback() { var t = h('textarea', {}); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { AD.toast('Não foi possível copiar'); } t.remove(); }
  }
  AD.copyText = copy;

  /* ───────── Temas ───────── */
  AD.openThemes = function () {
    var draft = null, listEl = h('div', { class: 'tlist' }), formEl = h('div', { class: 'tform' });
    var body = h('div', { class: 'themes' }, [listEl, formEl]);
    var m;
    var fontSel = function (cur, onc) {
      var s = h('select', {}, AD.FONT_CHOICES.map(function (f) { return h('option', { value: f[0], text: f[1] }); }).concat([h('option', { value: '__custom', text: 'Outra fonte instalada…' })]));
      var known = AD.FONT_CHOICES.some(function (f) { return f[0] === cur; });
      s.value = known ? cur : '__custom';
      var ci = h('input', { type: 'text', placeholder: 'Nome da fonte (ex.: Calibri)', value: known ? '' : String(cur).replace(/^"|".*$/g, '') });
      ci.style.display = known ? 'none' : '';
      s.addEventListener('change', function () { ci.style.display = s.value === '__custom' ? '' : 'none'; onc(s.value === '__custom' ? (ci.value ? '"' + ci.value + '", Roboto, sans-serif' : cur) : s.value); });
      ci.addEventListener('input', function () { onc('"' + ci.value.replace(/"/g, '') + '", Roboto, sans-serif'); });
      return h('div', {}, [s, ci]);
    };
    function renderList() {
      listEl.innerHTML = '';
      AD.themes.all().forEach(function (t) {
        var sw = h('span', { class: 'tsw' }, t.colors.slice(0, 5).map(function (c) { var i = h('i'); i.style.background = c; return i; }));
        var b = h('button', { type: 'button', class: 'titem' + (draft && draft.id === t.id ? ' on' : '') }, [sw, h('span', { text: t.name })]);
        b.addEventListener('click', function () { draft = JSON.parse(JSON.stringify(t)); renderList(); renderForm(); });
        listEl.appendChild(b);
      });
      listEl.appendChild(h('button', { type: 'button', class: 'btn small', text: '+ Novo tema', onclick: function () { var b = AD.themes.get(AD.S.theme); draft = JSON.parse(JSON.stringify(b)); draft.id = ''; draft.name = 'Meu tema'; renderList(); renderForm(); } }));
    }
    function renderForm() {
      formEl.innerHTML = '';
      if (!draft) { formEl.appendChild(h('p', { class: 'fhelp', text: 'Escolha um tema à esquerda para ver ou editar, ou crie um novo.' })); return; }
      var builtin = !!AD.themes.builtin[draft.id];
      if (builtin) formEl.appendChild(h('p', { class: 'fhelp', text: 'Temas padrão não podem ser alterados. Salve como um novo tema para personalizar.' }));
      var nm = h('input', { type: 'text', value: draft.name, maxlength: 40 }); nm.addEventListener('input', function () { draft.name = nm.value; });
      formEl.appendChild(h('div', { class: 'field' }, [h('div', { class: 'flabel', text: 'Nome' }), nm]));
      var cr = h('div', { class: 'colorrow' });
      [['bg', 'Fundo'], ['text', 'Texto'], ['muted', 'Texto secundário'], ['grid', 'Linhas de grade']].forEach(function (p) {
        var i = h('input', { type: 'color', value: draft[p[0]] }); i.addEventListener('input', function () { draft[p[0]] = i.value; });
        cr.appendChild(h('label', { class: 'sw' }, [i, h('span', { text: p[1] })]));
      });
      formEl.appendChild(cr);
      var pal = h('div', { class: 'palette' });
      function drawPal() {
        pal.innerHTML = '';
        draft.colors.forEach(function (c, i) {
          var inp = h('input', { type: 'color', value: c }); inp.addEventListener('input', function () { draft.colors[i] = inp.value; hex.value = inp.value; });
          var hex = h('input', { type: 'text', class: 'hex', value: c, maxlength: 7, 'aria-label': 'Cor ' + (i + 1) + ' em HEX' });
          hex.addEventListener('change', function () { if (/^#[0-9a-f]{6}$/i.test(hex.value)) { draft.colors[i] = hex.value; inp.value = hex.value; } else hex.value = draft.colors[i]; });
          var rm = h('button', { type: 'button', class: 'x', 'aria-label': 'Remover cor', text: '×', onclick: function () { if (draft.colors.length > 1) { draft.colors.splice(i, 1); drawPal(); } } });
          pal.appendChild(h('div', { class: 'pcol' }, [inp, hex, rm]));
        });
        pal.appendChild(h('button', { type: 'button', class: 'btn small', text: '+ Cor', onclick: function () { if (draft.colors.length < 16) { draft.colors.push('#888888'); drawPal(); } } }));
      }
      drawPal();
      formEl.appendChild(h('div', { class: 'field' }, [h('div', { class: 'flabel', text: 'Cores da paleta (na ordem de uso)' }), pal]));
      formEl.appendChild(h('div', { class: 'field' }, [h('div', { class: 'flabel', text: 'Fonte do título' }), fontSel(draft.titleFont, function (v) { draft.titleFont = v; })]));
      formEl.appendChild(h('div', { class: 'field' }, [h('div', { class: 'flabel', text: 'Fonte do corpo' }), fontSel(draft.bodyFont, function (v) { draft.bodyFont = v; })]));
      formEl.appendChild(h('div', { class: 'fhelp', text: 'Fontes instaladas no computador funcionam no navegador e no PNG. Em outros computadores, a fonte pode ser substituída.' }));
      var row = h('div', { class: 'btnrow' }, [
        h('button', { type: 'button', class: 'btn primary', text: 'Salvar e aplicar', onclick: function () {
          var wasCustom = draft.id && AD.themes.isCustom(draft.id), c = AD.themes.clean(draft); c.id = wasCustom ? draft.id : '';
          var saved = AD.themes.save(c); draft = JSON.parse(JSON.stringify(saved));
          AD.S.theme = saved.id; AD.S.seriesColors = {}; delete AD.S.design.color; AD.emit('structure'); renderList(); renderForm(); AD.toast('Tema salvo');
        } })
      ]);
      if (draft.id && AD.themes.isCustom(draft.id)) row.appendChild(h('button', { type: 'button', class: 'btn', text: 'Excluir', onclick: function () {
        if (!confirm('Excluir o tema “' + draft.name + '”?')) return;
        AD.themes.remove(draft.id); if (AD.S.theme === draft.id) AD.S.theme = 'antt'; draft = null; AD.emit('structure'); renderList(); renderForm();
      } }));
      formEl.appendChild(row);
    }
    var file = h('input', { type: 'file', accept: '.json', hidden: true });
    file.addEventListener('change', function () {
      var f = file.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () { try { var n = AD.themes.importJSON(String(rd.result)); AD.emit('structure'); renderList(); AD.toast(n + ' tema(s) importado(s)'); } catch (e) { AD.toast('Arquivo de tema inválido'); } };
      rd.readAsText(f); file.value = '';
    });
    renderList(); renderForm();
    m = AD.modal('Temas personalizados', body, [
      { label: 'Importar tema', keep: true, onclick: function () { file.click(); } },
      { label: 'Exportar meus temas', keep: true, onclick: function () { AD.download(new Blob([AD.themes.exportJSON()], { type: 'application/json' }), 'temas-antt-dataviz.json'); } },
      { label: 'Fechar', primary: true }
    ], { wide: true });
    body.appendChild(file);
  };

  /* ───────── Ícones ───────── */
  AD.openIcons = function (onPick) {
    var q = '', cat = null, sel = null;
    var grid = h('div', { class: 'icongrid' }), foot = h('div', { class: 'fhelp' });
    var search = h('input', { type: 'text', placeholder: 'Buscar ícone…', 'aria-label': 'Buscar ícone' });
    var chips = h('div', { class: 'chips' });
    function draw() {
      grid.innerHTML = ''; chips.innerHTML = '';
      [[null, 'Todos']].concat(AD.ICON_CATS).forEach(function (c) {
        var b = h('button', { type: 'button', class: 'chip' + (cat === c[0] ? ' on' : ''), text: c[1] }); b.addEventListener('click', function () { cat = c[0]; draw(); }); chips.appendChild(b);
      });
      Object.keys(AD.ICONS).map(function (k) { return AD.ICONS[k]; }).filter(function (i) {
        return (!cat || i.cat === cat) && (!q || (i.name + ' ' + i.id).toLowerCase().indexOf(q) >= 0);
      }).forEach(function (i) {
        var b = h('button', { type: 'button', class: 'iconcell' + (sel === i.id ? ' on' : ''), title: i.name + ' (' + i.id + ')' }, [
          h('span', { html: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + i.svg + '</svg>' }), h('small', { text: i.name })]);
        b.addEventListener('click', function () { sel = i.id; foot.textContent = 'Selecionado: ' + i.name + ' — id “' + i.id + '” (use esse id na coluna de ícone dos Números-chave).'; draw(); });
        grid.appendChild(b);
      });
    }
    search.addEventListener('input', function () { q = search.value.trim().toLowerCase(); draw(); });
    draw();
    var th = AD.themes.get(AD.S.theme);
    var body = h('div', {}, [search, chips, grid, foot, h('div', { class: 'fhelp', text: 'Biblioteca própria do projeto. Para a coleção Tabler Icons (MIT), veja tools/build-icons.mjs.' })]);
    AD.modal('Biblioteca de ícones', body, [
      { label: 'Baixar SVG', keep: true, onclick: function () {
        if (!sel) return AD.toast('Selecione um ícone');
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256" fill="none" stroke="' + th.colors[0] + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + AD.ICONS[sel].svg + '</svg>';
        AD.download(new Blob([svg], { type: 'image/svg+xml' }), sel + '.svg');
      } },
      { label: 'Copiar id', keep: true, onclick: function () { if (sel) copy(sel, 'Id copiado'); else AD.toast('Selecione um ícone'); } },
      { label: onPick ? 'Usar no gráfico' : 'Fechar', primary: true, onclick: function () { if (onPick && sel) onPick(sel); } }
    ], { wide: true });
  };

  /* ───────── Compartilhar / carregar ───────── */
  AD.openShare = function () {
    var linkBox = h('input', { type: 'text', readonly: true, value: 'Gerando link…' }), info = h('div', { class: 'fhelp' });
    AD.makeLink().then(function (u) {
      linkBox.value = u;
      info.textContent = u.length > 6000 ? 'Este gráfico é grande para um link. Prefira salvar o arquivo .json e enviá-lo.' : 'O link guarda o gráfico inteiro; ao abri-lo, o gráfico aparece pronto para editar. Nada é enviado a servidores.';
    });
    var area = h('textarea', { rows: 4, placeholder: 'Cole aqui o código JSON do gráfico' });
    var file = h('input', { type: 'file', accept: '.json', hidden: true });
    var load = function (txt, close) { try { AD.setState(AD.parseStateJSON(txt)); AD.toast('Gráfico carregado'); close && close(); } catch (e) { AD.toast('JSON inválido: ' + e.message); } };
    file.addEventListener('change', function () { var f = file.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { load(String(rd.result), m.close); }; rd.readAsText(f); file.value = ''; });
    var body = h('div', {}, [
      h('div', { class: 'flabel', text: 'Link para compartilhar' }), h('div', { class: 'btnrow nowrap' }, [linkBox, h('button', { type: 'button', class: 'btn', text: 'Copiar link', onclick: function () { copy(linkBox.value, 'Link copiado'); } })]), info,
      h('div', { class: 'flabel sp', text: 'Arquivo ou código' }),
      h('div', { class: 'btnrow' }, [
        h('button', { type: 'button', class: 'btn', text: 'Salvar arquivo (.json)', onclick: function () { AD.saveJSON(); } }),
        h('button', { type: 'button', class: 'btn', text: 'Copiar código JSON', onclick: function () { copy(AD.stateJSON(), 'Código copiado'); } })
      ]),
      h('div', { class: 'flabel sp', text: 'Carregar um gráfico' }),
      h('div', { class: 'btnrow' }, [h('button', { type: 'button', class: 'btn', text: 'Abrir arquivo .json…', onclick: function () { file.click(); } }), file]),
      area, h('div', { class: 'btnrow' }, [h('button', { type: 'button', class: 'btn', text: 'Carregar código colado', onclick: function () { load(area.value, m.close); } })])
    ]);
    var m = AD.modal('Compartilhar e carregar', body, [{ label: 'Fechar', primary: true }]);
  };

  /* ───────── Ajuda / Sobre ───────── */
  AD.openHelp = function () {
    AD.modal('Como usar', h('div', { class: 'prose', html:
      '<ol><li><b>Dados:</b> cole do Excel, carregue um CSV ou use “Carregar dados de exemplo”.</li>' +
      '<li><b>Gráfico:</b> escolha o tipo (use “Mostrar gráficos para…” se tiver dúvida) e o tema.</li>' +
      '<li><b>Design:</b> ajuste tamanho, cores, rótulos e opções do tipo. “Auto” usa o padrão.</li>' +
      '<li><b>Texto:</b> título, subtítulo, comentários e fonte dos dados.</li>' +
      '<li><b>Baixar:</b> SVG (edição em Illustrator/Inkscape), PNG ou ZIP com tudo.</li></ol>' +
      '<p>Seus dados ficam apenas neste navegador. Não use informação classificada ou sigilosa.</p>' }), [{ label: 'Entendi', primary: true }]);
  };
  AD.openAbout = function () {
    AD.modal('Sobre', h('div', { class: 'prose', html:
      '<p><b>Gerador de gráficos — AESIN/ANTT</b><br>Aplicativo estático (HTML, CSS e JavaScript puro). Os gráficos são gerados no navegador.</p>' +
      '<p>Interface inspirada na Humanitarian DataViz Tool (OCHA). O código deste app é próprio; não reutiliza o código da OCHA.</p>' +
      '<p>Fontes Roboto e Roboto Condensed: licença Apache 2.0 (pasta <code>fonts/</code>). Ícones: biblioteca própria do projeto.</p>' +
      '<p>Paleta e fontes são aproximações da identidade visual da ANTT [a confirmar com o manual de marca].</p>' }), [{ label: 'Fechar', primary: true }]);
  };
})();
