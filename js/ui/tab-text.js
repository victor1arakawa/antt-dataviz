/* Interface: aba Texto (título, subtítulo, comentários, fonte, tamanho e largura). */
(function () {
  'use strict';
  var AD = window.AD, h = AD.h;

  function area(label, key, rows, ph, help) {
    var t = h('textarea', { rows: rows, placeholder: ph || '' }); t.value = AD.S.text[key] || '';
    t.addEventListener('input', function () { AD.S.text[key] = t.value; AD.emit('render'); });
    return h('div', { class: 'field' }, [h('div', { class: 'flabel', text: label }), t, help ? h('div', { class: 'fhelp', text: help }) : null]);
  }

  AD.buildTextTab = function (root) {
    root.innerHTML = '';
    var b1 = h('div', {}, [
      area('Título', 'title', 2, 'Título do gráfico'),
      area('Subtítulo', 'subtitle', 2, 'Unidade de medida, período, escopo'),
      area('Comentários (máx. 3 linhas)', 'comments', 3, 'Nota explicativa opcional'),
      area('Rodapé / fonte', 'footer', 2, 'Fonte: ANTT, 2026')
    ]);
    var size = h('input', { type: 'range', min: 70, max: 160, step: 5, value: AD.S.text.size || 100 });
    var sOut = h('span', { class: 'sval', text: (AD.S.text.size || 100) + ' %' });
    size.addEventListener('input', function () { AD.S.text.size = Number(size.value); sOut.textContent = size.value + ' %'; AD.emit('render'); });
    var wr = h('input', { type: 'range', min: 200, max: 1000, step: 10, value: AD.S.text.width || 400 });
    var wOut = h('span', { class: 'sval', text: AD.S.text.width ? AD.S.text.width + ' px' : 'Auto' });
    var pill = h('button', { type: 'button', class: 'pill' + (AD.S.text.width ? '' : ' on'), text: 'Auto' });
    wr.addEventListener('input', function () { AD.S.text.width = Number(wr.value); pill.classList.remove('on'); wOut.textContent = wr.value + ' px'; AD.emit('render'); });
    pill.addEventListener('click', function () {
      var on = !pill.classList.contains('on'); pill.classList.toggle('on', on);
      AD.S.text.width = on ? null : Number(wr.value); wOut.textContent = on ? 'Auto' : wr.value + ' px'; AD.emit('render');
    });
    var b2 = h('div', {}, [
      h('div', { class: 'field fslider' }, [h('div', { class: 'frow' }, [h('div', { class: 'flabel', text: 'Tamanho do texto' }), sOut]), size]),
      h('div', { class: 'field fslider' }, [h('div', { class: 'frow' }, [h('div', { class: 'flabel', text: 'Largura do texto' }), pill, wOut]), wr])
    ]);
    root.appendChild(h('div', { class: 'tabintro', text: 'Textos que aparecem acima e abaixo do gráfico. Use Enter para quebrar linha.' }));
    root.appendChild(AD.dgroup('t-labels', 'Textos do gráfico', 'text', b1));
    root.appendChild(AD.dgroup('t-size', 'Tamanho e largura', 'layout', b2));
  };
})();
