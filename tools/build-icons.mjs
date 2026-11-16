// Gera js/data/icon-library-tabler.js a partir de uma pasta de SVGs do Tabler Icons (MIT).
// Uso:
//   npm i @tabler/icons            (em qualquer pasta)
//   node tools/build-icons.mjs caminho/para/node_modules/@tabler/icons/icons/outline [limite]
// Depois inclua <script src="js/data/icon-library-tabler.js"></script> no index.html, logo após icon-library.js,
// e mantenha o arquivo de licença do Tabler (MIT) junto do projeto.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const dir = process.argv[2];
const limit = Number(process.argv[3]) || 600;
if (!dir) { console.error('Informe a pasta dos SVGs (outline).'); process.exit(1); }

const out = {};
for (const f of readdirSync(dir).filter((n) => n.endsWith('.svg')).sort().slice(0, limit)) {
  const id = 'tabler-' + basename(f, '.svg');
  const raw = readFileSync(join(dir, f), 'utf8');
  const m = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(raw);
  if (!m) continue;
  const inner = m[1].replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '').replace(/\s+/g, ' ').trim();
  out[id] = { id, name: basename(f, '.svg').replace(/-/g, ' '), cat: 'geral', svg: inner };
}
const js = '/* Gerado por tools/build-icons.mjs a partir do Tabler Icons (MIT). Não edite. */\n' +
  '(function(){var AD=window.AD=window.AD||{};AD.ICONS=AD.ICONS||{};var T=' + JSON.stringify(out) + ';Object.keys(T).forEach(function(k){AD.ICONS[k]=T[k];});})();\n';
writeFileSync(new URL('../js/data/icon-library-tabler.js', import.meta.url), js);
console.log(Object.keys(out).length + ' ícones gerados.');
