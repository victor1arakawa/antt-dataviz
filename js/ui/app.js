/* Interface: inicialização, abas, pré-visualização, divisória, menus e atalhos. */
(function () {
  'use strict';
  var AD = window.AD, $ = AD.$, h = AD.h;
  var UIKEY = 'antt-dataviz:ui:v1';
  var ui = { tab: 'data', mode: 'auto', pw: 360 };
  try { Object.assign(ui, JSON.parse(localStorage.getItem(UIKEY) || '{}')); } catch (e) {}
  var saveUI = function () { try { localStorage.setItem(UIKEY, JSON.stringify(ui)); } catch (e) {} };

  /* ── aparência da interface (claro/escuro) ── */
  function applyMode() {
    var dark = ui.mode === 'dark' || (ui.mode === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyMode);

  /* ── abas ── */
  var TABS = ['data', 'chart', 'design', 'text', 'annot'];
  function showTab(t) {
    ui.tab = t; saveUI();
    TABS.forEach(function (k) {
      var on = k === t;
      $('#tab-' + k).hidden = !on; var b = $('#tabbtn-' + k); b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
  }

  /* ── construção ── */
  function buildAll() {
    AD.buildDataTab($('#tab-data')); AD.buildChartTab($('#tab-chart')); AD.buildDesignTab($('#tab-design')); AD.buildTextTab($('#tab-text')); AD.buildAnnotTab($('#tab-annot'));
    var c = AD.charts.byId[AD.S.type];
    $('#chart-badge').innerHTML = (c ? '<span class="bi">' + c.icon + '</span>' + AD.esc(c.name) : '');
  }

  var raf = 0;
  function render() {
    var r = AD.renderChart(AD.S), box = $('#chart'), empty = $('#empty');
    if (!r.svg) {
      box.innerHTML = ''; empty.hidden = false;
      $('#empty-title').textContent = r.msg === 'empty' ? 'Seu gráfico aparece aqui' : 'Não foi possível desenhar o gráfico';
      $('#empty-text').textContent = r.msg === 'empty' ? 'Adicione dados na aba Dados — ou clique em “Carregar dados de exemplo” — e escolha um tipo de gráfico. Depois baixe em SVG ou PNG.' : r.msg;
    } else { empty.hidden = true; box.innerHTML = r.svg; }
    $('#btn-download').classList.toggle('muted', !r.svg);
  }
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }

  AD.on(function (kind) {
    if (kind === 'structure') buildAll();
    else if (kind === 'data') { AD.buildDesignTab($('#tab-design')); AD.buildAnnotTab($('#tab-annot')); }
    schedule();
  });

  /* ── menus (Baixar, ⋮) ── */
  function menu(anchor, items) {
    var old = $('.menu'); if (old) old.remove();
    var m = h('div', { class: 'menu', role: 'menu' }, items.map(function (it) {
      if (it.sep) return h('div', { class: 'msep' });
      if (it.head) return h('div', { class: 'mhead', text: it.head });
      return h('button', { type: 'button', role: 'menuitem', class: it.on ? 'on' : '', text: it.label, onclick: function () { m.remove(); it.fn(); } });
    }));
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(), w = m.offsetWidth;
    m.style.top = (r.bottom + 4) + 'px'; m.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px';
    var off = function (e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', off, true); } };
    setTimeout(function () { document.addEventListener('mousedown', off, true); }, 0);
    var first = m.querySelector('button'); if (first) first.focus();
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') { m.remove(); anchor.focus(); } });
  }

  function needChart(fn) { return function () { if (!AD.currentSVG()) return AD.toast('Adicione dados para gerar o gráfico'); fn(); }; }
  function init() {
    applyMode();
    document.documentElement.style.setProperty('--pw', ui.pw + 'px');
    TABS.forEach(function (k) {
      $('#tabbtn-' + k).addEventListener('click', function () { showTab(k); });
      $('#tabbtn-' + k).addEventListener('keydown', function (e) {
        var i = TABS.indexOf(k), n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
        if (n == null) return; n = (n + TABS.length) % TABS.length; showTab(TABS[n]); $('#tabbtn-' + TABS[n]).focus();
      });
    });

    $('#btn-new').addEventListener('click', function () {
      if (confirm('Começar um novo gráfico? Os dados e ajustes atuais serão descartados (temas próprios são mantidos).')) { var th = AD.S.theme; AD.S = AD.freshState(); AD.S.theme = th; AD.emit('structure'); }
    });
    $('#btn-icons').addEventListener('click', function () { AD.openIcons(); });
    $('#btn-themes').addEventListener('click', function () { AD.openThemes(); });
    $('#btn-share').addEventListener('click', function () { AD.openShare(); });
    $('#btn-more').addEventListener('click', function (e) {
      menu(e.currentTarget, [{ head: 'Aparência' },
        { label: 'Escuro', on: ui.mode === 'dark', fn: function () { ui.mode = 'dark'; saveUI(); applyMode(); } },
        { label: 'Claro', on: ui.mode === 'light', fn: function () { ui.mode = 'light'; saveUI(); applyMode(); } },
        { label: 'Automático', on: ui.mode === 'auto', fn: function () { ui.mode = 'auto'; saveUI(); applyMode(); } },
        { sep: true }, { label: 'Como usar', fn: AD.openHelp }, { label: 'Sobre', fn: AD.openAbout }]);
    });
    $('#btn-help').addEventListener('click', AD.openHelp);
    $('#btn-full').addEventListener('click', function () {
      var on = document.body.classList.toggle('focus');
      if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
      else if (!on && document.fullscreenElement) document.exitFullscreen().catch(function () {});
      $('#btn-full').textContent = on ? 'Sair da tela cheia' : 'Tela cheia';
    });
    document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && document.body.classList.contains('focus')) { document.body.classList.remove('focus'); $('#btn-full').textContent = 'Tela cheia'; } });
    $('#btn-download').addEventListener('click', function (e) {
      menu(e.currentTarget, [{ head: 'Baixar gráfico' },
        { label: 'SVG (vetorial, editável)', fn: needChart(AD.exportSVG) },
        { label: 'PNG (imagem, 2×)', fn: needChart(function () { AD.exportPNG().catch(function (er) { AD.toast(er.message); }); }) },
        { label: 'ZIP (SVG + PNG + JSON)', fn: needChart(function () { AD.exportZIP().catch(function (er) { AD.toast(er.message); }); }) }]);
    });

    /* divisória arrastável */
    var sp = $('#splitter');
    sp.addEventListener('pointerdown', function (e) {
      sp.setPointerCapture(e.pointerId);
      var move = function (ev) { ui.pw = Math.max(300, Math.min(680, ev.clientX)); document.documentElement.style.setProperty('--pw', ui.pw + 'px'); };
      var up = function () { sp.removeEventListener('pointermove', move); sp.removeEventListener('pointerup', up); saveUI(); };
      sp.addEventListener('pointermove', move); sp.addEventListener('pointerup', up);
    });
    sp.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      ui.pw = Math.max(300, Math.min(680, ui.pw + (e.key === 'ArrowRight' ? 20 : -20))); document.documentElement.style.setProperty('--pw', ui.pw + 'px'); saveUI();
    });

    buildAll(); showTab(ui.tab); render();

    /* fontes: remede texto quando carregarem */
    if (document.fonts && document.fonts.load) {
      Promise.all(['400 12px Roboto', '700 12px Roboto', '400 12px "Roboto Condensed"', '700 12px "Roboto Condensed"'].map(function (f) { return document.fonts.load(f); }))
        .then(function () { AD.clearMeasureCache(); schedule(); }, function () {});
    }
    /* gráfico vindo de um link */
    AD.readLink().then(function (s) { if (s && s.data) { AD.setState(s); history.replaceState(null, '', location.pathname + location.search); AD.toast('Gráfico aberto a partir do link'); } });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
