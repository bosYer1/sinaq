import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = await mkdtemp(join(tmpdir(), 'gameyer-gsc-'));
const current = join(dir, 'current.csv');
const previous = join(dir, 'previous.csv');

await writeFile(previous, `Query,Page,Clicks,Impressions,CTR,Position\ngaming club baku,https://gameyer.az/bakida-pc-klublari,3,100,3%,12\ngaming club baku,https://gameyer.az/bakida-playstation-klublari,1,60,1.67%,14\n`, 'utf8');
await writeFile(current, `Query,Page,Clicks,Impressions,CTR,Position\ngaming club baku,https://gameyer.az/bakida-pc-klublari,5,180,2.78%,9\ngaming club baku,https://gameyer.az/bakida-playstation-klublari,2,80,2.5%,13\nbrand query,https://gameyer.az/,40,100,40%,1.2\n`, 'utf8');

const run = spawnSync(process.execPath, ['scripts/search-console-opportunities.mjs', current, '--previous', previous, '--min-impressions', '50', '--max-ctr', '5'], { encoding: 'utf8' });
assert.equal(run.status, 0, run.stderr);
assert.match(run.stdout, /gaming club baku/);
assert.match(run.stdout, /180/);
assert.match(run.stdout, /\| 2 \| 80 \|/);
assert.match(run.stdout, /Cannibalization signals/);
assert.match(run.stdout, /bakida-pc-klublari/);
assert.match(run.stdout, /bakida-playstation-klublari/);
assert.doesNotMatch(run.stdout, /\| brand query \|/);

console.log('Search Console opportunity regression: PASS');
