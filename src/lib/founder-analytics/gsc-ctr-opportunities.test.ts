import assert from 'node:assert/strict';
import test from 'node:test';
import { prioritizeGscCtrOpportunities } from './gsc-ctr-opportunities.ts';

const site = 'https://gameyer.az';

test('GSC CTR opportunities rank zero-click first-page query/page pairs above later pages', () => {
  const rows = [
    { keys: ['internet klub', site + '/bakida-internet-klublari'], clicks: 0, impressions: 90, position: 5.4 },
    { keys: ['ps club', site + '/bakida-playstation-klublari'], clicks: 1, impressions: 100, position: 4.1 },
    { keys: ['klub qiymeti', site + '/bakida-gaming-klub-qiymetleri'], clicks: 0, impressions: 200, position: 13 },
    { keys: ['popular klub', site + '/populyar-klublar'], clicks: 8, impressions: 40, position: 2 },
  ];
  const found = prioritizeGscCtrOpportunities(rows);
  assert.deepEqual(found.map((row) => row.query), ['internet klub', 'ps club', 'klub qiymeti']);
  assert.equal(found[0].ctr, 0);
  assert.equal(found[0].nextAction, 'snippet');
  assert.equal(found[2].nextAction, 'ranking');
});

test('GSC CTR reports multiple matching query pages without claiming proven cannibalization', () => {
  const rows = [
    { keys: ['gaming klub', site + '/bakida-pc-klublari'], clicks: 0, impressions: 75, position: 7 },
    { keys: ['Gaming Klub', site + '/bakida-playstation-klublari'], clicks: 0, impressions: 5, position: 15 },
    { keys: ['gaming klub', site + '/klub/test'], clicks: 1, impressions: 2, position: 1 },
  ];
  const found = prioritizeGscCtrOpportunities(rows);
  assert.equal(found.length, 1);
  assert.equal(found[0].matchingPages, 3);
  assert.equal(found[0].path, '/bakida-pc-klublari');
});

test('exclude off-site, parameterized, low-data, expensive-CTR and invalid GSC rows', () => {
  const rows = [
    { keys: ['spam', 'https://evil.example/x'], impressions: 100, clicks: 0, position: 4 },
    { keys: ['params', site + '/?q=private'], impressions: 100, clicks: 0, position: 4 },
    { keys: ['too little', site + '/small'], impressions: 19, clicks: 0, position: 4 },
    { keys: ['healthy ctr', site + '/healthy'], impressions: 25, clicks: 2, position: 4 },
    { keys: ['invalid clicks', site + '/invalid'], impressions: 21, clicks: 22, position: 4 },
    { keys: ['invalid rank', site + '/ranking'], impressions: 40, clicks: 0, position: 0 },
    { keys: ['too low', site + '/too-low'], impressions: 40, clicks: 0, position: 21 },
    { keys: ['valid', site + '/club'], impressions: 21, clicks: 1, position: 9.6 },
  ];
  assert.deepEqual(prioritizeGscCtrOpportunities(rows).map((row) => row.query), ['valid']);
  assert.deepEqual(prioritizeGscCtrOpportunities(rows, 0), []);
});
