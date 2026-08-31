#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell.trim()); cell = ''; }
    else if (char === '\n') { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
    else if (char !== '\r') cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizedHeader(value) {
  return value.toLowerCase().trim().replace(/[%()]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

const aliases = {
  query: ['query', 'top queries', 'search query'],
  page: ['page', 'top pages', 'landing page', 'url'],
  clicks: ['clicks'], impressions: ['impressions'], ctr: ['ctr', 'average ctr'], position: ['position', 'average position'],
};

function loadRows(text) {
  const csv = parseCsv(text);
  if (csv.length < 2) return [];
  const headers = csv[0].map(normalizedHeader);
  const map = {};
  for (const [name, options] of Object.entries(aliases)) {
    const index = headers.findIndex((header) => options.includes(header));
    if (index >= 0) map[name] = index;
  }
  for (const required of ['query', 'clicks', 'impressions', 'ctr', 'position']) {
    if (map[required] == null) throw new Error(`Missing required Search Console column: ${required}`);
  }
  const num = (value) => {
    const n = Number(String(value ?? '').trim().replace(/\s/g, '').replace(/%$/, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  return csv.slice(1).map((row) => {
    const rawCtr = num(row[map.ctr]);
    return {
      query: row[map.query]?.trim() ?? '', page: map.page == null ? '' : row[map.page]?.trim() ?? '',
      clicks: num(row[map.clicks]), impressions: num(row[map.impressions]), ctr: rawCtr > 1 ? rawCtr / 100 : rawCtr,
      position: num(row[map.position]),
    };
  }).filter((row) => row.query);
}

function parseArgs(argv) {
  const args = { current: null, previous: null, minImpressions: 50, maxCtr: 0.05, minPosition: 4, maxPosition: 20 };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith('--') && !args.current) args.current = value;
    else if (value === '--previous') args.previous = argv[++i];
    else if (value === '--min-impressions') args.minImpressions = Number(argv[++i]);
    else if (value === '--max-ctr') args.maxCtr = Number(argv[++i]) / 100;
    else if (value === '--min-position') args.minPosition = Number(argv[++i]);
    else if (value === '--max-position') args.maxPosition = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!args.current) throw new Error('Usage: node scripts/search-console-opportunities.mjs <current.csv> [--previous previous.csv] [--min-impressions 50] [--max-ctr 5]');
  return args;
}

const pct = (value) => `${(value * 100).toFixed(2)}%`;
const esc = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const key = (row) => `${row.query}\u0000${row.page}`;
const args = parseArgs(process.argv.slice(2));
const current = loadRows(await readFile(args.current, 'utf8'));
const previous = args.previous ? loadRows(await readFile(args.previous, 'utf8')) : [];
const previousByKey = new Map(previous.map((row) => [key(row), row]));
const opportunities = current.filter((row) => row.impressions >= args.minImpressions && row.ctr <= args.maxCtr && row.position >= args.minPosition && row.position <= args.maxPosition).sort((a, b) => b.impressions - a.impressions || a.position - b.position);
const pagesByQuery = new Map();
for (const row of current) {
  if (!row.page) continue;
  const pages = pagesByQuery.get(row.query) ?? new Set();
  pages.add(row.page); pagesByQuery.set(row.query, pages);
}
const cannibalized = [...pagesByQuery.entries()].filter(([, pages]) => pages.size > 1);

console.log('# Search Console SEO opportunities');
console.log(`\nRows analyzed: ${current.length}`);
console.log(`Opportunity rule: impressions >= ${args.minImpressions}, CTR <= ${pct(args.maxCtr)}, position ${args.minPosition}-${args.maxPosition}.`);
console.log('\n## Opportunity rows');
if (!opportunities.length) console.log('\nNo rows matched the current thresholds.');
else {
  console.log('\n| Query | Page | Clicks | Impressions | CTR | Position | Δ clicks | Δ impressions | Δ CTR | Δ position |');
  console.log('| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const row of opportunities) {
    const before = previousByKey.get(key(row));
    const deltas = before ? [row.clicks - before.clicks, row.impressions - before.impressions, pct(row.ctr - before.ctr), (row.position - before.position).toFixed(2)] : ['—', '—', '—', '—'];
    console.log(`| ${esc(row.query)} | ${esc(row.page || '—')} | ${row.clicks} | ${row.impressions} | ${pct(row.ctr)} | ${row.position.toFixed(2)} | ${deltas.join(' | ')} |`);
  }
}
console.log('\n## Cannibalization signals');
if (!cannibalized.length) console.log('\nNo query mapped to multiple landing pages in this export.');
else for (const [query, pages] of cannibalized) console.log(`\n- **${query}** → ${[...pages].join(', ')}`);
console.log('\n## Decision guardrails');
console.log('\n- Do not change titles/content from this report alone; inspect actual query intent and the landing page first.');
console.log('- Do not create a landing page unless demand is real and GameYer has enough verified club data for that intent.');
console.log('- Treat multi-page query matches as a review signal, not automatic proof of cannibalization.');
