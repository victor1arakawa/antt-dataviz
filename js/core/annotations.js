/* Núcleo: destaques, linhas de referência e notas. Cada tipo declara em `annot` o que suporta:
   { highlight: 'label' | 'series' | false, refs: bool, notes: bool }. */
(function () {
  'use strict';
  var AD = window.AD;
  AD.annot = {};

  /* Lê as anotações do estado, já filtradas pelo que o tipo suporta. */
  AD.annot.read = function (S, chart, data) {
    var cap = (chart && chart.annot) || {}, a = S.annot || {}, out = { hl: [], refs: [], notes: {} };
    if (cap.highlight && Array.isArray(a.highlight)) out.hl = a.highlight.slice();
    if (cap.refs && Array.isArray(a.refs)) a.refs.forEach(function (r) {
      var v = AD.parseNum(r.value); if (v != null) out.refs.push({ v: v, label: String(r.label || ''), color: r.color || null });
    });
    if (cap.notes && Array.isArray(a.notes)) a.notes.forEach(function (n) { if (n.at && String(n.text).trim()) out.notes[n.at] = String(n.text).trim(); });
    return out;
  };

  /* Chaves possíveis para destaque (rótulos ou nomes de série) conforme o tipo. */
  AD.annot.keys = function (S, chart) {
    var data = AD.dataset(S, chart), kind = chart && chart.annot && chart.annot.highlight;
    return kind === 'series' ? data.series.map(function (s) { return s.name; }) : data.labels;
  };

  /* Linha de referência: devolve o SVG. horiz=true → linha horizontal (valor no eixo Y). */
  AD.annot.refLine = function (ctx, r, pos, from, to, horiz) {
    var col = r.color || ctx.th.text, fs = ctx.fs, o = [];
    o.push(horiz ? AD.line(from, pos, to, pos, col, 1.4, '5 4') : AD.line(pos, from, pos, to, col, 1.4, '5 4'));
    return o.join('');
  };
  AD.annot.refLabel = function (ctx, r, x, y, anchor) {
    var t = (r.label ? r.label + ': ' : '') + AD.fmt(r.v, ctx.d);
    var w = AD.measure(t, ctx.fs * 0.95, 700, ctx.body);
    if (anchor === 'middle') x = Math.max(w / 2, Math.min(ctx.W - w / 2, x));
    return AD.txt(x, y, t, { size: ctx.fs * 0.95, weight: 700, fill: r.color || ctx.th.text, anchor: anchor || 'end', halo: ctx.th.bg });
  };
  AD.annot.hasNotes = function (ctx) { return Object.keys(ctx.notes).length > 0; };
})();
