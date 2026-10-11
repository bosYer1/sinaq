import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createObservedGetStatus } from './site-integrity-status-cache.mjs';

test('verified exact URL reuses status without any second upstream GET', async () => {
  const statuses = createObservedGetStatus();
  statuses.observe('https://gameyer.az/klub/example', 200);
  const calls = [];
  const status = await statuses.check('https://gameyer.az/klub/example', async (...args) => { calls.push(args); throw new Error('must not fetch'); });
  assert.equal(status, 200);
  assert.equal(calls.length, 0);
  assert.deepEqual(statuses.stats(), { reused: 1, fetched: 0 });
});

test('new link is fetched once with manual redirect and repeated occurrences reuse its status', async () => {
  const statuses = createObservedGetStatus();
  const calls = [];
  const mock = async (...args) => { calls.push(args); return { status: 307 }; };
  assert.equal(await statuses.check('https://gameyer.az/legacy', mock), 307);
  assert.equal(await statuses.check('https://gameyer.az/legacy', mock), 307);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].redirect, 'manual');
  assert.deepEqual(statuses.stats(), { reused: 1, fetched: 1 });
});

test('broken links never become successes; different query strings are distinct links', async () => {
  const statuses = createObservedGetStatus();
  let count = 0;
  const mock = async () => { count += 1; return { status: 404 }; };
  assert.equal(await statuses.check('https://gameyer.az/missing', mock), 404);
  assert.equal(await statuses.check('https://gameyer.az/missing', mock), 404);
  assert.equal(await statuses.check('https://gameyer.az/missing?q=other', mock), 404);
  assert.equal(count, 2);
});

test('integrity smoke only reuses statuses from real previously fetched URLs', async () => {
  const site = await readFile(new URL('./site-integrity-smoke.mjs', import.meta.url), 'utf8');
  const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(site, /if \(Object\.keys\(options\)\.length === 0\) observedGetStatus\.observe\(url, response\.status\)/);
  assert.match(site, /const status = await observedGetStatus\.check\(absolute\(href\)\)/);
  assert.match(site, /status >= 400 \|\| status === 0/, '4xx/5xx failures must still be rejected');
  assert.match(site, /await checkHtmlPage\(url\)/, 'each sitemap page must still be fully validated');
  assert.match(ci, /const checkedPaths = new Set\(\)/);
  assert.match(ci, /if \(checkedPaths\.has\(path\)\) continue;/);
  assert.match(ci, /if \(paths\.length < 36\)/, 'CI minimum sitemap coverage must remain in place');
});
