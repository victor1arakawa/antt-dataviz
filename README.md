# Gerador de gráficos — AESIN/ANTT

App estático (HTML, CSS e JavaScript puro, sem build e sem dependências) para criar gráficos com identidade visual da ANTT e baixar em SVG, PNG ou ZIP.
Tudo roda no navegador; nenhum dado é enviado para fora. Funciona também abrindo `index.html` direto do disco (a exportação de PNG usa fontes do sistema nesse caso).

Interface inspirada na Humanitarian DataViz Tool (OCHA). O código é próprio e não reutiliza o da OCHA.

## Tipos de gráfico (22)

| Grupo | Tipos |
|---|---|
| Barras e colunas | barra horizontal, coluna, barra empilhada, coluna empilhada, barra agrupada, coluna com linha (eixo duplo) |
| Linhas e áreas | linhas, linhas agrupadas (um painel por série), área (simples ou empilhada) |
| Circulares | pizza, rosca, rosca agrupada, bolhas, Sankey/aluvial |
| Relação, calor e mapa | dispersão (com bolhas e linha de tendência), mapa de calor, cartograma das UFs |
| Números | gráfico de ícones, números-chave |
| Detalhe e tempo | tabela de dados, linha do tempo, calendário/planejador |

## Estrutura

```
index.html
css/        app.css, fonts.css
fonts/      Roboto e Roboto Condensed (Apache 2.0, com LICENSE.txt)
js/core/    util (texto, números pt-BR, cores) · themes · state · registry (registro + composição) · export (SVG, PNG, ZIP, link) · annotations (destaques) · xlsx (leitor sem dependências)
js/charts/  bars · lines · circular · sankey · extra · numbers · detail   (cada arquivo registra seus tipos em AD.charts)
js/data/    icon-library (ícones próprios) · samples (exemplos fictícios)
js/ui/      controls (esquema do Design) · tab-data · tab-chart · tab-design · tab-text · modals · app
tools/      build-icons.mjs (opcional: importa o Tabler Icons, MIT)
```

Para criar um novo tipo de gráfico: escreva `render(ctx)` (devolve `{h, svg}`), registre com `AD.charts.register({...})` e liste em `controls` os ids do esquema `AD.CONTROLS` que ele usa.

## Destaques, anotações e importação

- Aba **Destaques**: realça itens (os demais ficam esmaecidos), linhas de referência (meta, média, limite) e notas curtas ao lado de um item. Disponível em barras, colunas, linhas, áreas e pizza (conforme `annot` de cada tipo).
- **Importar .xlsx**: leitor próprio (ZIP + XML), sem bibliotecas; lê valores e datas, não lê fórmulas nem planilhas protegidas por senha.
- **Cartograma das UFs**: grade em que cada UF ocupa um quadrado igual; não é mapa geográfico. Um mapa com malha real depende de conferir a licença da malha do IBGE [a confirmar].

## Publicar no GitHub Pages

1. Crie um repositório e envie estes arquivos na raiz.
2. Em Settings → Pages → Deploy from a branch → `main` / `(root)`.
3. O endereço sai como `https://<usuario>.github.io/<repositorio>/`.

## Notas

- Paleta e fontes são aproximações da identidade da ANTT [a confirmar com o manual de marca].
- Os dados de exemplo são fictícios.
- Não registre informação classificada ou sigilosa em nenhuma ferramenta externa.
