import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const key = (await readFile(new URL('../public/df8fa4723f76653caecfd894a38ef608.txt', import.meta.url), 'utf8')).trim();
const script = await readFile(new URL('./indexnow-submit.mjs', import.meta.url), 'utf8');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(key, /^[A-Za-z0-9-]{8,128}$/, 'IndexNow key file must use the protocol key format.');
assert.ok(script.includes("https://api.indexnow.org/indexnow"), 'IndexNow must use the global endpoint.');
assert.ok(script.includes('keyLocation'), 'IndexNow payload must provide keyLocation.');
assert.ok(script.includes('urlList'), 'IndexNow payload must submit URL lists.');
assert.ok(script.includes('10_000'), 'IndexNow bulk submissions must remain bounded to 10,000 URLs.');
assert.equal(pkg.scripts['indexnow:submit'], 'node scripts/indexnow-submit.mjs');
assert.ok(pkg.scripts.test.includes('node scripts/indexnow-regression.mjs'), 'IndexNow regression must run in the test suite.');

console.log('IndexNow regression checks passed.');
