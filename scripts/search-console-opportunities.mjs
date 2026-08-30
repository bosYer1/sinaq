import { readFile } from 'node:fs/promises';
import process from 'node:process';

const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/search-console-opportunities.mjs <search-console.csv>');
  process.exit(2);
}

const text = await readFile(path, 'utf8');
const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
if (lines.length < 2) throw new Error('CSV has no data rows');

function splitCsv(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(value.trim()); value = '';
    } else value += char;
  }
  values.push(value.trim());
  return values;
}

const headers = splitCsv(lines[0]).map((header) => header.toLowerCase());
const column = (...names) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
const q = column('query', 'top queries', 'sorğu', 'sorgu');
const page = column('page', 'pages', 'səhifə', 'sehife');
const clicks = column('clicks', 'kliklər', 'klikler');
const impressions = column('impressions', 'göstərilmələr', 'gosterilmeler');
const ctr = column('ctr');
const position = column('position', 'mövqe', 'movqe');
if ([q, impressions, position].some((index) => index < 0)) throw new Error(`Required columns missing. Found: ${headers.join(', ')}`);

const number = (value) => Number(String(value ?? '').replace('%', '').replace(/\s/g, '').replace(',', '.')) || 0;
const rows = lines.slice(1).map((line) => {
  const cells = splitCsv(line);
  return {
    query: cells[q],
    page: page >= 0 ? cells[page] : '',
    clicks: clicks >= 0 ? number(cells[clicks]) : 0,
    impressions: number(cells[impressions]),
    ctr: ctr >= 0 ? number(cells[ctr]) : 0,
    position: number(cells[position]),
  };
}).filter((row) => row.query);

const opportunities = rows
  .filter((row) => row.impressions >= 20 && row.position >= 4 && row.position <= 20)
  .sort((a, b) => (b.impressions - a.impressions) || (a.position - b.position));

console.log('query\tpage\timpressions\tclicks\tctr\tposition\topportunity');
for (const row of opportunities) {
  const lowCtr = row.ctr > 0 && row.ctr < 5;
  const opportunity = lowCtr ? 'CTR + ranking' : 'ranking';
  console.log([row.query, row.page || '-', row.impressions, row.clicks, `${row.ctr}%`, row.position, opportunity].join('\t'));
}
console.error(`Analyzed ${rows.length} rows; ${opportunities.length} evidence-backed opportunities.`);
