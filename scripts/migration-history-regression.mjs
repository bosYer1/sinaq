import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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

const normalizedMd5 = (relativePath) =>
  crypto
    .createHash('md5')
    .update(fs.readFileSync(path.join(root, relativePath), 'utf8').trim())
    .digest('hex');

const recoveredChecksums = new Map([
  ['20260818081913_add_club_public_visibility', 'd0828477186d1aedd9137da3574e43cc'],
  ['20260818081945_remove_unused_club_public_visibility', 'c1abedfd1b539cb6114823200a3e9d0a'],
  ['20260902191350_activate_moon_club_20260902_v2', 'af123a49a2489d3f3c6e24a6f789481b'],
  ['20260904184157_add_admin_submission_notifications', '8815975968f0866af3f6e24f8b8c91cd'],
  ['20260904184536_harden_and_realtime_admin_notifications', 'e700a3d1bf4b0356e01b356143751827'],
  ['20260904184937_activate_linked_club_on_submission_approval', '9d3584bae4ae8976019278dc83a1c884'],
]);

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
  const expectedHash = recoveredChecksums.get(entry.id);
  assert.ok(expectedHash, `Recovered history file ${entry.id} is missing its audited live SQL checksum.`);
  assert.equal(
    normalizedMd5(`supabase/recovered-production-history/${entry.id}.sql`),
    expectedHash,
    `Recovered history SQL ${entry.id} does not match the audited live production statement.`,
  );
}

assert.deepEqual(
  [...recoveredChecksums.keys()].sort(),
  recoveredIds,
  'Recovered-history checksum inventory must exactly match recovered SQL files.',
);

const timestampDrift = live.filter((entry) => {
  const activeEntry = activeNames.get(entry.name);
  return activeEntry && activeEntry.version !== entry.version;
});

console.log(
  `Migration provenance OK: ${live.length} live, ${active.length} active repo, ${recovered.length} recovered-only, ${repoOnly.length} repo-only, ${timestampDrift.length} timestamp aliases.`,
);
