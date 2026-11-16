/* Biblioteca de ícones própria (desenhada para este projeto; licença do projeto).
   Formato 24x24, traço. Para usar a coleção Tabler Icons (MIT), rode tools/build-icons.mjs. */
(function () {
  'use strict';
  var AD = window.AD = window.AD || {};

  AD.ICON_CATS = [['transporte', 'Transporte'], ['pessoas', 'Pessoas e instituições'], ['dados', 'Dados e gestão'], ['geral', 'Geral']];

  var L = [
    ['truck', 'Caminhão', 'transporte', '<path d="M2 6h12v10H2z"/><path d="M14 9h4l4 4v3h-8z"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/>'],
    ['bus', 'Ônibus', 'transporte', '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M6 18v3M18 18v3"/><circle cx="8" cy="14.5" r=".8"/><circle cx="16" cy="14.5" r=".8"/>'],
    ['train', 'Trem', 'transporte', '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/>'],
    ['car', 'Automóvel', 'transporte', '<path d="M3 16v-4l2-5h14l2 5v4z"/><path d="M3 12h18"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>'],
    ['road', 'Rodovia', 'transporte', '<path d="M8 3L4 21M16 3l4 18M12 4v3M12 10v4M12 17v3"/>'],
    ['plane', 'Avião', 'transporte', '<path d="M21 3L3 11l7 3 3 7z"/><path d="M10 14l4-4"/>'],
    ['ship', 'Navio', 'transporte', '<path d="M3 15l2 5h14l2-5z"/><path d="M6 15V9h12v6M12 9V4h3"/>'],
    ['anchor', 'Porto', 'transporte', '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 14c0 4 3 7 7 7s7-3 7-7M3 14h4M17 14h4"/>'],
    ['bike', 'Bicicleta', 'transporte', '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8H8M13 12l-3 4"/>'],
    ['cone', 'Obra na pista', 'transporte', '<path d="M9 4h6l4 16H5z"/><path d="M7.5 12h9M6.5 16h11M4 20h16"/>'],
    ['wheel', 'Direção', 'transporte', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 14.5V21M9.6 11L3.3 9.5M14.4 11l6.3-1.5"/>'],
    ['fuel', 'Combustível', 'transporte', '<path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M4 21h11M14 10h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V9l-3-3M7 8h5"/>'],
    ['package', 'Carga', 'transporte', '<path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/>'],
    ['container', 'Contêiner', 'transporte', '<rect x="3" y="7" width="18" height="10" rx="1"/><path d="M7 7v10M11 7v10M15 7v10"/>'],
    ['pin', 'Local', 'transporte', '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'],
    ['user', 'Pessoa', 'pessoas', '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>'],
    ['users', 'Pessoas', 'pessoas', '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17.5" cy="9" r="2.8"/><path d="M17.5 14c2.5 0 4.5 2 4.5 4.5"/>'],
    ['building', 'Órgão / empresa', 'pessoas', '<path d="M4 21V5l8-2v18M12 8h8v13M4 21h16M7 9h2M7 13h2M7 17h2M15 12h2M15 16h2"/>'],
    ['home', 'Domicílio', 'pessoas', '<path d="M4 11l8-7 8 7M6 10v10h12V10"/>'],
    ['shield', 'Segurança', 'pessoas', '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'],
    ['lock', 'Sigilo', 'pessoas', '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'],
    ['eye', 'Monitoramento', 'pessoas', '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'],
    ['scale', 'Justiça / regulação', 'pessoas', '<path d="M12 4v16M6 20h12M4 8h16M4 8l-2 6a3 3 0 0 0 6 0zM20 8l-2 6a3 3 0 0 0 6 0z"/>'],
    ['file', 'Documento', 'dados', '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'],
    ['chart-bar', 'Gráfico de barras', 'dados', '<path d="M4 20h16M7 20v-7M12 20V6M17 20v-10"/>'],
    ['chart-line', 'Gráfico de linhas', 'dados', '<path d="M3 20h18M4 16l5-5 4 3 7-8"/>'],
    ['chart-pie', 'Gráfico de pizza', 'dados', '<path d="M12 3v9h9a9 9 0 1 1-9-9z"/><path d="M15 3a9 9 0 0 1 6 6h-6z"/>'],
    ['database', 'Base de dados', 'dados', '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'],
    ['target', 'Meta', 'dados', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r=".8"/>'],
    ['trend-up', 'Crescimento', 'dados', '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'],
    ['percent', 'Percentual', 'dados', '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'],
    ['coin', 'Receita / tarifa', 'dados', '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5"/>'],
    ['calendar', 'Prazo', 'dados', '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'],
    ['clock', 'Tempo', 'dados', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'],
    ['globe', 'Mundo', 'geral', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'],
    ['flag', 'Bandeira', 'geral', '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>'],
    ['alert', 'Alerta', 'geral', '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>'],
    ['bolt', 'Energia', 'geral', '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'],
    ['leaf', 'Meio ambiente', 'geral', '<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z"/><path d="M5 19L13 11"/>'],
    ['heart', 'Saúde / social', 'geral', '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>'],
    ['search', 'Busca', 'geral', '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'],
    ['check', 'Concluído', 'geral', '<path d="M5 12l5 5 9-10"/>']
  ];
  AD.ICONS = AD.ICONS || {};
  L.forEach(function (r) { AD.ICONS[r[0]] = { id: r[0], name: r[1], cat: r[2], svg: r[3] }; });
})();
