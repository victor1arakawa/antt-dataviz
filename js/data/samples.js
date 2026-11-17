/* Dados de exemplo por tipo de gráfico. Valores FICTÍCIOS, apenas para demonstrar o layout. */
(function () {
  'use strict';
  var AD = window.AD;

  var modal = ['Rodoviário', 'Ferroviário', 'Aquaviário', 'Dutoviário', 'Aéreo'];
  var years = ['2021', '2022', '2023', '2024', '2025'];
  var base = { subtitle: 'Exemplo com dados fictícios', footer: 'Fonte: dados fictícios, apenas para demonstração.' };

  function S(title, headers, rows, extra) { return Object.assign({ title: title, headers: headers, rows: rows }, base, extra || {}); }

  var share = [['Rodoviário', 61], ['Ferroviário', 21], ['Aquaviário', 14], ['Dutoviário', 4]];
  var multi = [['Região A', 120, 80, 45], ['Região B', 95, 60, 70], ['Região C', 70, 90, 30], ['Região D', 40, 30, 55]];

  AD.SAMPLES = {
    hbar: S('Exemplo: volume por modal', ['Modal', 'Volume'], modal.map(function (m, i) { return [m, [610, 210, 140, 40, 15][i]]; })),
    vbar: S('Exemplo: volume por modal', ['Modal', 'Volume'], modal.map(function (m, i) { return [m, [610, 210, 140, 40, 15][i]]; })),
    'stacked-bar': S('Exemplo: composição por região', ['Região', 'Carga geral', 'Granel', 'Contêiner'], multi),
    'stacked-col': S('Exemplo: composição por região', ['Região', 'Carga geral', 'Granel', 'Contêiner'], multi),
    'cluster-bar': S('Exemplo: comparação por região', ['Região', 'Carga geral', 'Granel', 'Contêiner'], multi),
    line: S('Exemplo: evolução anual', ['Ano', 'Rodoviário', 'Ferroviário', 'Aquaviário'], years.map(function (y, i) { return [y, 100 + i * 12, 60 + i * 9, 30 + i * 4 + (i % 2) * 6]; })),
    'cluster-line': S('Exemplo: evolução anual por modal', ['Ano', 'Rodoviário', 'Ferroviário', 'Aquaviário', 'Dutoviário'], years.map(function (y, i) { return [y, 100 + i * 12, 60 + i * 9, 30 + i * 4 + (i % 2) * 6, 20 + i * 2]; })),
    area: S('Exemplo: evolução anual', ['Ano', 'Rodoviário', 'Ferroviário', 'Aquaviário'], years.map(function (y, i) { return [y, 100 + i * 12, 60 + i * 9, 30 + i * 4 + (i % 2) * 6]; })),
    combo: S('Exemplo: volume e variação anual', ['Ano', 'Volume (mil t)', 'Variação (%)'], [['2021', 610, 2.1], ['2022', 640, 4.9], ['2023', 655, 2.3], ['2024', 690, 5.3], ['2025', 720, 4.3]]),
    scatter: S('Exemplo: investimento x volume', ['Terminal', 'Investimento (R$ mi)', 'Volume (mil t)', 'Empregos'], [['Terminal A', 120, 540, 300], ['Terminal B', 80, 410, 180], ['Terminal C', 200, 780, 520], ['Terminal D', 45, 220, 90], ['Terminal E', 150, 600, 340], ['Terminal F', 95, 380, 210]]),
    heatmap: S('Exemplo: ocorrências por dia e turno', ['Dia', 'Manhã', 'Tarde', 'Noite', 'Madrugada'], [['Segunda', 12, 18, 25, 8], ['Terça', 10, 16, 22, 7], ['Quarta', 14, 20, 24, 9], ['Quinta', 11, 19, 27, 10], ['Sexta', 18, 30, 41, 15], ['Sábado', 22, 35, 48, 20], ['Domingo', 20, 28, 36, 14]]),
    ufmap: S('Exemplo: índice por UF', ['UF', 'Índice'], [['SP', 82], ['MG', 64], ['RJ', 58], ['PR', 71], ['RS', 66], ['SC', 69], ['BA', 49], ['GO', 61], ['MT', 74], ['PA', 38], ['AM', 31], ['CE', 45], ['PE', 47], ['DF', 77]]),
    pie: S('Exemplo: divisão modal', ['Modal', 'Participação'], share, { }),
    donut: S('Exemplo: divisão modal', ['Modal', 'Volume'], share),
    'cluster-donut': S('Exemplo: composição por região', ['Modal', 'Região A', 'Região B', 'Região C'], [['Rodoviário', 60, 45, 70], ['Ferroviário', 25, 35, 15], ['Aquaviário', 15, 20, 15]]),
    bubble: S('Exemplo: volume por modal', ['Modal', 'Volume'], modal.map(function (m, i) { return [m, [610, 210, 140, 40, 15][i]]; })),
    sankey: S('Exemplo: fluxo de cargas', ['Origem', 'Modal', 'Destino', 'Volume'], [['Região A', 'Rodoviário', 'Porto', 40], ['Região A', 'Ferroviário', 'Porto', 30], ['Região B', 'Rodoviário', 'Porto', 25], ['Região B', 'Rodoviário', 'Mercado interno', 35], ['Região C', 'Ferroviário', 'Porto', 20], ['Região C', 'Ferroviário', 'Mercado interno', 10]]),
    icon: S('Exemplo: usuários por modal', ['Modal', 'Usuários (mil)'], [['Rodoviário', 420], ['Ferroviário', 180], ['Aquaviário', 90], ['Aéreo', 240]], { }),
    keyfigures: S('Exemplo: números-chave', ['Indicador', 'Valor', 'Ícone'], [['Rodovias fiscalizadas (km)', 75000, 'road'], ['Concessões ativas', 48, 'file'], ['Receita arrecadada', 'R$ 3,2 bi', 'coin'], ['Incidentes registrados', 1250, 'alert']]),
    table: S('Exemplo: indicadores por modal', ['Modal', 'Volume', 'Variação (%)', 'Observação'], [['Rodoviário', 610, '3,2', 'Crescimento moderado'], ['Ferroviário', 210, '5,1', 'Maior alta do período'], ['Aquaviário', 140, '-1,4', 'Leve queda'], ['Dutoviário', 40, '0,8', 'Estável']]),
    timeline: S('Exemplo: marcos do projeto', ['Data', 'Evento', 'Categoria'], [['2025-01-15', 'Início do projeto', 'Planejamento'], ['2025-03-10', 'Consulta pública aberta', 'Participação'], ['2025-06-02', 'Relatório preliminar publicado', 'Entrega'], ['2025-09-20', 'Reunião com as partes interessadas', 'Participação'], ['2025-12-05', 'Entrega do relatório final', 'Entrega']]),
    calendar: S('Exemplo: cronograma do projeto', ['Atividade', 'Início', 'Fim', 'Categoria'], [['Levantamento de dados', '2025-01-06', '2025-02-28', 'Dados'], ['Análise preliminar', '2025-03-03', '2025-04-30', 'Análise'], ['Consulta pública', '2025-04-14', '2025-05-30', 'Participação'], ['Relatório final', '2025-06-02', '2025-07-31', 'Entrega'], ['Divulgação', '2025-08-04', '2025-08-04', 'Entrega']])
  };

  /* Carrega o exemplo do tipo atual (dados + textos) */
  AD.loadSample = function (type) {
    var s = AD.SAMPLES[type || AD.S.type] || AD.SAMPLES.hbar;
    AD.S.data = { headers: s.headers.slice(), rows: s.rows.map(function (r) { return r.slice(); }) };
    AD.S.labelCol = 0; AD.S.valueCols = []; AD.S.seriesColors = {};
    if (!AD.S.text.title) AD.S.text.title = s.title;
    if (!AD.S.text.subtitle) AD.S.text.subtitle = s.subtitle;
    if (!AD.S.text.footer) AD.S.text.footer = s.footer;
    AD.emit('structure');
  };
})();
