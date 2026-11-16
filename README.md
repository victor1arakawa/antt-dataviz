# Gerador de gráficos — AESIN/ANTT

App estático (HTML, CSS e JavaScript puro, sem build e sem dependências) para criar gráficos com identidade visual da ANTT e baixar em SVG, PNG ou ZIP.
Tudo roda no navegador; nenhum dado é enviado para fora. Funciona também abrindo `index.html` direto do disco (a exportação de PNG usa fontes do sistema nesse caso).

Interface inspirada na Humanitarian DataViz Tool (OCHA). O código é próprio e não reutiliza o da OCHA.

## Tipos de gráfico (17)

| Grupo | Tipos |
|---|---|
| Barras e colunas | barra horizontal, coluna, barra empilhada, coluna empilhada, barra agrupada |
| Linhas | linhas, linhas agrupadas (um painel por série) |
| Circulares | pizza, rosca, rosca agrupada, bolhas, Sankey/aluvial |
| Números | gráfico de ícones, números-chave |
| Detalhe e tempo | tabela de dados, linha do tempo, calendário/planejador |

## Estrutura

```
index.html
css/        app.css, fonts.css
fonts/      Roboto e Roboto Condensed (Apache 2.0, com LICENSE.txt)
js/core/    util (texto, números pt-BR, cores) · themes · state · registry (registro + composição) · export (SVG, PNG, ZIP, link)
js/charts/  bars · lines · circular · sankey · numbers · detail   (cada arquivo registra seus tipos em AD.charts)
js/data/    icon-library (ícones próprios) · samples (exemplos fictícios)
js/ui/      controls (esquema do Design) · tab-data · tab-chart · tab-design · tab-text · modals · app
tools/      build-icons.mjs (opcional: importa o Tabler Icons, MIT)
```

Para criar um novo tipo de gráfico: escreva `render(ctx)` (devolve `{h, svg}`), registre com `AD.charts.register({...})` e liste em `controls` os ids do esquema `AD.CONTROLS` que ele usa.

## Publicar no GitHub Pages

1. Crie um repositório e envie estes arquivos na raiz.
2. Em Settings → Pages → Deploy from a branch → `main` / `(root)`.
3. O endereço sai como `https://<usuario>.github.io/<repositorio>/`.

## Notas

- Paleta e fontes são aproximações da identidade da ANTT [a confirmar com o manual de marca].
- Os dados de exemplo são fictícios.
- Não registre informação classificada ou sigilosa em nenhuma ferramenta externa.
