import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readLines = (relativePath) =>
  fs
    .readFileSync(path.join(root, relativePath), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const parseId = (id) => {
  const match = id.match(/^(\d{8,14})_(.+)$/);
  assert.ok(match, `Invalid migration identifier: ${id}`);
  return { id, version: match[1], name: match[2] };
};

const activeIds = fs
  .readdirSync(path.join(root, 'supabase/migrations'))
  .filter((file) => file.endsWith('.sql'))
  .map((file) => file.slice(0, -4))
  .sort();
const inventoryIds = readLines('supabase/production-migrations.txt').sort();
const liveIds = readLines('supabase/production-history.txt');
const repoOnlyIds = readLines('supabase/repository-only-migrations.txt');
const recoveredDir = path.join(root, 'supabase/recovered-production-history');
const recoveredIds = fs
  .readdirSync(recoveredDir)
  .filter((file) => file.endsWith('.sql'))
  .map((file) => file.slice(0, -4))
  .sort();

assert.deepEqual(
  inventoryIds,
  activeIds,
  'production-migrations.txt must remain the exact inventory of active supabase/migrations SQL files.',
);

const active = activeIds.map(parseId);
const live = liveIds.map(parseId);
const repoOnly = repoOnlyIds.map(parseId);
const recovered = recoveredIds.map(parseId);

const unique = (values, label) => {
  assert.equal(new Set(values).size, values.length, `${label} contains duplicates.`);
};

unique(live.map(({ id }) => id), 'production-history.txt');
unique(live.map(({ name }) => name), 'production-history.txt migration names');
unique(active.map(({ name }) => name), 'active migration names');
unique(repoOnly.map(({ id }) => id), 'repository-only-migrations.txt');
unique(recovered.map(({ id }) => id), 'recovered production history');

const liveIdsSet = new Set(live.map(({ id }) => id));
const liveNames = new Map(live.map((entry) => [entry.name, entry]));
const activeNames = new Map(active.map((entry) => [entry.name, entry]));
const repoOnlySet = new Set(repoOnly.map(({ id }) => id));
const recoveredIdsSet = new Set(recovered.map(({ id }) => id));

for (const entry of live) {
  const activeEntry = activeNames.get(entry.name);
  const hasRecoveredExactVersion = recoveredIdsSet.has(entry.id);
  assert.ok(
    activeEntry || hasRecoveredExactVersion,
    `Live migration ${entry.id} has neither an active repo migration with the same name nor an exact recovered-history SQL file.`,
  );
}

for (const entry of active) {
  if (!liveNames.has(entry.name)) {
    assert.ok(
      repoOnlySet.has(entry.id),
      `Active repo migration ${entry.id} is absent from live history and must be explicitly listed as repository-only.`,
    );
  }
}

for (const entry of repoOnly) {
  assert.ok(activeIds.includes(entry.id), `Repository-only migration ${entry.id} is not present in supabase/migrations.`);
  assert.ok(!liveNames.has(entry.name), `Repository-only migration ${entry.id} now appears in live production history.`);
}

for (const entry of recovered) {
  assert.ok(liveIdsSet.has(entry.id), `Recovered history file ${entry.id} is not present in the production history snapshot.`);
  assert.ok(!activeNames.has(entry.name), `Recovered history file ${entry.id} duplicates an active migration name.`);
}

const timestampDrift = live.filter((entry) => {
  const activeEntry = activeNames.get(entry.name);
  return activeEntry && activeEntry.version !== entry.version;
});

console.log(
  `Migration provenance OK: ${live.length} live, ${active.length} active repo, ${recovered.length} recovered-only, ${repoOnly.length} repo-only, ${timestampDrift.length} timestamp aliases.`,
);
