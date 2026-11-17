/* Interface: aba Destaques (realce de itens, linhas de referência e notas). */
(function () {
  'use strict';
  var AD = window.AD, h = AD.h;

  AD.buildAnnotTab = function (root) {
    root.innerHTML = '';
    var chart = AD.charts.byId[AD.S.type], cap = (chart && chart.annot) || {}, A = AD.S.annot;
    root.appendChild(h('div', { class: 'tabintro', text: 'Direcione o olhar do leitor: realce o que importa, marque metas e escreva a conclusão no próprio gráfico.' }));
    if (!cap.highlight && !cap.refs && !cap.notes) {
      root.appendChild(h('div', { class: 'fhelp', text: 'O tipo “' + (chart ? chart.name : '') + '” ainda não aceita destaques. Escolha barras, colunas, linhas, áreas ou pizza.' }));
      return;
    }
    var keys = AD.annot.keys(AD.S, chart), labels = AD.dataset(AD.S, chart).labels;

    /* destaque */
    if (cap.highlight) {
      var body = h('div');
      body.appendChild(h('div', { class: 'fhelp', text: cap.highlight === 'series' ? 'Marque as séries que devem ficar em evidência; as demais ficam esmaecidas.' : 'Marque os itens que devem ficar em evidência; os demais ficam esmaecidos.' }));
      var box = h('div', { class: 'checks' });
      keys.forEach(function (k) {
        var cb = h('input', { type: 'checkbox' }); cb.checked = A.highlight.indexOf(k) >= 0;
        cb.addEventListener('change', function () {
          var i = A.highlight.indexOf(k);
          if (cb.checked && i < 0) A.highlight.push(k); else if (!cb.checked && i >= 0) A.highlight.splice(i, 1);
          AD.emit('render');
        });
        box.appendChild(h('label', { class: 'check' }, [cb, h('span', { text: k || '(sem rótulo)' })]));
      });
      body.appendChild(box);
      body.appendChild(h('div', { class: 'btnrow' }, [h('button', { type: 'button', class: 'btn small', text: 'Limpar destaques', onclick: function () { A.highlight = []; AD.emit('render'); AD.buildAnnotTab(root); } })]));
      root.appendChild(AD.dgroup('a-hl', 'Realçar itens', 'color', body));
    }

    /* linhas de referência */
    if (cap.refs) {
      var rb = h('div'), list = h('div', { class: 'arows' });
      var drawRefs = function () {
        list.innerHTML = '';
        A.refs.forEach(function (r, i) {
          var v = h('input', { type: 'text', placeholder: 'Valor (ex.: 80 ou 2,5 mi)', value: r.value }), l = h('input', { type: 'text', placeholder: 'Nome (ex.: Meta)', value: r.label });
          v.addEventListener('input', function () { r.value = v.value; AD.emit('render'); });
          l.addEventListener('input', function () { r.label = l.value; AD.emit('render'); });
          list.appendChild(h('div', { class: 'arow' }, [l, v, h('button', { type: 'button', class: 'x', title: 'Remover', 'aria-label': 'Remover linha de referência', text: '×', onclick: function () { A.refs.splice(i, 1); drawRefs(); AD.emit('render'); } })]));
        });
      };
      drawRefs();
      rb.appendChild(h('div', { class: 'fhelp', text: 'Linha tracejada em um valor, como meta, média ou limite legal. A escala se ajusta para incluí-la.' }));
      rb.appendChild(list);
      rb.appendChild(h('div', { class: 'btnrow' }, [h('button', { type: 'button', class: 'btn small', text: '+ Linha de referência', onclick: function () { A.refs.push({ value: '', label: '', color: null }); drawRefs(); } })]));
      root.appendChild(AD.dgroup('a-ref', 'Linhas de referência', 'options', rb));
    }

    /* notas */
    if (cap.notes) {
      var nb = h('div'), nlist = h('div', { class: 'arows' });
      var drawNotes = function () {
        nlist.innerHTML = '';
        A.notes.forEach(function (n, i) {
          var sel = h('select', {}, [h('option', { value: '', text: 'Escolha o item…' })].concat(labels.map(function (l) { return h('option', { value: l, text: l || '(sem rótulo)' }); })));
          sel.value = n.at;
          var t = h('input', { type: 'text', placeholder: 'Texto da nota (curto)', value: n.text });
          sel.addEventListener('change', function () { n.at = sel.value; AD.emit('render'); });
          t.addEventListener('input', function () { n.text = t.value; AD.emit('render'); });
          nlist.appendChild(h('div', { class: 'arow' }, [sel, t, h('button', { type: 'button', class: 'x', title: 'Remover', 'aria-label': 'Remover nota', text: '×', onclick: function () { A.notes.splice(i, 1); drawNotes(); AD.emit('render'); } })]));
        });
      };
      drawNotes();
      nb.appendChild(h('div', { class: 'fhelp', text: 'Escreva uma observação curta ao lado de um item (ex.: “Maior alta do período”).' }));
      nb.appendChild(nlist);
      nb.appendChild(h('div', { class: 'btnrow' }, [h('button', { type: 'button', class: 'btn small', text: '+ Nota', onclick: function () { A.notes.push({ at: '', text: '' }); drawNotes(); } })]));
      root.appendChild(AD.dgroup('a-note', 'Notas', 'text', nb));
    }
  };
})();
