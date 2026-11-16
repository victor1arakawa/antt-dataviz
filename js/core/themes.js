/* Núcleo: temas (paleta, fundo, fontes). Temas próprios ficam no navegador e podem ser exportados em JSON. */
(function () {
  'use strict';
  var AD = window.AD;
  var KEY = 'antt-dataviz:themes:v2';

  var SANS = 'Roboto, "Segoe UI", Arial, sans-serif';
  var COND = '"Roboto Condensed", Roboto, "Segoe UI", Arial, sans-serif';

  var BUILTIN = {
    antt: { id: 'antt', name: 'ANTT', bg: '#F4F2EC', text: '#2E3338', muted: '#6B6F73', grid: '#D6D4CD', titleFont: COND, bodyFont: SANS,
      colors: ['#2F5D8A', '#5E8C6A', '#C9A45A', '#B5654F', '#6F8FAF', '#A3B8A0', '#8A6A86', '#B9B6AD'] },
    escuro: { id: 'escuro', name: 'ANTT escuro', bg: '#1F2A36', text: '#E9E6DE', muted: '#A5ABB1', grid: '#3A4756', titleFont: COND, bodyFont: SANS,
      colors: ['#6F8FAF', '#8DB09A', '#D3B473', '#C98A76', '#9DB6CE', '#B9CCB6', '#A98BA5', '#8A8F94'] },
    mono: { id: 'mono', name: 'Azul monocromático', bg: '#FFFFFF', text: '#2E3338', muted: '#6B6F73', grid: '#D6D4CD', titleFont: COND, bodyFont: SANS,
      colors: ['#1F3F63', '#2F5D8A', '#4F78A0', '#6F8FAF', '#93AEC8', '#B3C7DA', '#C9D6E3', '#DDE5ED'] },
    terra: { id: 'terra', name: 'Terra', bg: '#F7F3EA', text: '#3A322B', muted: '#7A7066', grid: '#DDD3C2', titleFont: COND, bodyFont: SANS,
      colors: ['#8C5A3C', '#B5654F', '#C9A45A', '#7C8A5B', '#5E8C6A', '#6F8FAF', '#8A6A86', '#B9B6AD'] }
  };

  var custom = {};
  try { custom = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { custom = {}; }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(custom)); } catch (e) {} }

  AD.FONT_CHOICES = [
    [SANS, 'Roboto (padrão)'], [COND, 'Roboto Condensed'],
    ['"Segoe UI", Arial, sans-serif', 'Segoe UI'], ['Arial, Helvetica, sans-serif', 'Arial'],
    ['Verdana, Geneva, sans-serif', 'Verdana'], ['Tahoma, sans-serif', 'Tahoma'],
    ['Georgia, serif', 'Georgia (serifada)'], ['"Times New Roman", serif', 'Times New Roman'], ['"Courier New", monospace', 'Courier New']
  ];

  AD.themes = {
    builtin: BUILTIN,
    all: function () { return Object.keys(BUILTIN).map(function (k) { return BUILTIN[k]; }).concat(Object.keys(custom).map(function (k) { return custom[k]; })); },
    isCustom: function (id) { return !!custom[id]; },
    get: function (id) { return BUILTIN[id] || custom[id] || BUILTIN.antt; },
    save: function (t) {
      t = AD.themes.clean(t);
      if (!t.id || BUILTIN[t.id]) t.id = 'meu-' + AD.slug(t.name) + '-' + Date.now().toString(36).slice(-4);
      custom[t.id] = t; persist(); return t;
    },
    remove: function (id) { delete custom[id]; persist(); },
    clean: function (t) {
      var hex = /^#[0-9a-f]{6}$/i;
      var colors = (t.colors || []).filter(function (c) { return hex.test(c); });
      if (!colors.length) colors = BUILTIN.antt.colors.slice();
      return {
        id: String(t.id || ''), name: String(t.name || 'Meu tema').slice(0, 40),
        bg: hex.test(t.bg) ? t.bg : '#FFFFFF', text: hex.test(t.text) ? t.text : '#2E3338',
        muted: hex.test(t.muted) ? t.muted : AD.mix(hex.test(t.text) ? t.text : '#2E3338', hex.test(t.bg) ? t.bg : '#FFFFFF', 0.45),
        grid: hex.test(t.grid) ? t.grid : AD.mix(hex.test(t.text) ? t.text : '#2E3338', hex.test(t.bg) ? t.bg : '#FFFFFF', 0.82),
        titleFont: String(t.titleFont || COND).slice(0, 200), bodyFont: String(t.bodyFont || SANS).slice(0, 200),
        colors: colors.slice(0, 16)
      };
    },
    exportJSON: function () { return JSON.stringify({ app: 'antt-dataviz', themes: Object.keys(custom).map(function (k) { return custom[k]; }) }, null, 2); },
    importJSON: function (txt) {
      var o = JSON.parse(txt), list = o.themes || (o.colors ? [o] : []), n = 0;
      list.forEach(function (t) { var c = AD.themes.clean(t); c.id = ''; AD.themes.save(c); n++; });
      return n;
    }
  };
})();
