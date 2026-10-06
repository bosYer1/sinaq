import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [
  gsc,
  ga4,
  posthog,
  meta,
  archive,
  ingest,
  workflow,
  schemaCandidate,
  continuityDoc,
  supabaseBackup,
] = await Promise.all([
  readFile(new URL('../src/lib/founder-analytics/gsc-server.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/founder-analytics/ga4-server.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/founder-analytics/posthog-server.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/founder-analytics/meta-server.ts', import.meta.url), 'utf8'),
  readFile(new URL('./provider-data-archive.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/functions/gameyer-provider-archive-ingest/index.ts', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/provider-data-archive.yml', import.meta.url), 'utf8'),
  readFile(new URL('../docs/analytics/provider_metric_snapshots_migration_candidate.sql', import.meta.url), 'utf8'),
  readFile(new URL('../docs/DATA_CONTINUITY.md', import.meta.url), 'utf8'),
  readFile(new URL('./supabase-encrypted-logical-backup.sh', import.meta.url), 'utf8'),
]);

for (const source of [gsc, ga4, posthog, meta, archive]) {
  assert.doesNotMatch(source, /gsc\s*wizard|gscwizard|supermetrics/i, 'Production/provider archive code must not depend on paid connector layers.');
}

assert.match(gsc, /searchconsole\.googleapis\.com\/webmasters\/v3/, 'GSC must use the official Search Console API.');
assert.match(gsc, /webmasters\.readonly/, 'GSC must use read-only Google scope.');
assert.match(ga4, /analyticsdata\.googleapis\.com\/v1beta/, 'GA4 must use the official Data API.');
assert.match(ga4, /analytics\.readonly/, 'GA4 must use read-only Google scope.');
assert.match(posthog, /\/api\/projects\/\$\{projectId\}\/query\//, 'PostHog must query its first-party API directly.');
assert.match(meta, /graph\.facebook\.com/, 'Meta must use the Graph API directly.');

assert.match(archive, /dataState:\s*'final'/, 'GSC archive must request finalized Search Console data.');
assert.match(archive, /\['query', 'page'\]/, 'GSC archive must preserve query-to-page rows, not headline totals only.');
assert.match(archive, /ROWS_PER_CHUNK = 400/, 'Large provider datasets must be chunked before persistence.');
assert.match(archive, /GAMEYER_PROVIDER_ARCHIVE_OIDC_TOKEN/, 'Archive writer must use short-lived GitHub OIDC.');
assert.doesNotMatch(archive, /SUPABASE_(?:SERVICE_ROLE|SECRET)_KEY/, 'Archive job must never require a Supabase bypass key.');

assert.match(ingest, /GITHUB_AUDIENCE = 'https:\/\/gameyer\.az\/provider-archive-ci'/, 'Archive ingest must lock the OIDC audience.');
assert.match(ingest, /provider-data-archive\.yml@/, 'Archive ingest must lock the calling workflow.');
assert.match(ingest, /eventName.*ALLOWED_EVENTS/s, 'Archive ingest must validate GitHub event claims.');
assert.match(ingest, /ref !== 'refs\/heads\/main'/, 'Archive writes must only trust main.');
assert.match(ingest, /provider_metric_snapshots/, 'Archive ingest must write only to the dedicated provider archive table.');

assert.match(schemaCandidate, /enable row level security/i, 'Provider archive table must enable RLS.');
assert.match(schemaCandidate, /revoke all on table public\.provider_metric_snapshots from anon/i, 'Anonymous roles must have no provider archive access.');
assert.match(schemaCandidate, /revoke insert, update, delete.*from authenticated/is, 'Authenticated users must not mutate provider archive rows.');
assert.match(schemaCandidate, /using \(\(select public\.is_admin\(\)\)\)/, 'Only admins may read archive rows through the app role.');
assert.match(schemaCandidate, /unique \(provider, snapshot_date, dataset, chunk_index\)/, 'Daily archive chunks must be idempotent.');

assert.match(workflow, /id-token:\s*write/, 'Scheduled archive must mint GitHub OIDC.');
assert.match(workflow, /cron:\s*'23 8 \* \* \*'/, 'Archive must run daily.');
assert.match(workflow, /GOOGLE_PROVIDER_CLIENT_EMAIL/, 'Workflow must use private Google service-account secrets.');
assert.doesNotMatch(workflow, /GSC_WIZARD|SUPERMETRICS/i, 'Scheduled archive must not rely on paid connector products.');
assert.doesNotMatch(workflow, /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/, 'Workflow must not carry Supabase privileged credentials.');

assert.match(continuityDoc, /GSC Wizard/i, 'Continuity runbook must document the retired connector dependency.');
assert.match(continuityDoc, /Supermetrics/i, 'Continuity runbook must document the paid connector dependency.');
assert.match(continuityDoc, /PostHog.*(?:1 year|1-year|1 il)/is, 'Continuity runbook must document the PostHog free-retention risk.');
assert.match(continuityDoc, /Supabase.*Free.*(?:automatic|managed).*backup/is, 'Continuity runbook must document the Supabase Free backup gap.');
assert.match(continuityDoc, /off-site/i, 'Continuity runbook must require an off-site database copy.');

assert.match(supabaseBackup, /pg_dump/, 'Database recovery utility must use PostgreSQL logical dump.');
assert.match(supabaseBackup, /--format=custom/, 'Database recovery utility must create a restorable custom archive.');
assert.match(supabaseBackup, /pg_restore --list/, 'Database recovery utility must verify the archive.');
assert.match(supabaseBackup, /--cipher-algo AES256/, 'Database recovery utility must encrypt the dump before storage.');
assert.match(supabaseBackup, /BACKUP_PASSPHRASE/, 'Database recovery utility must require a runtime backup secret.');
assert.doesNotMatch(supabaseBackup, /git (?:add|commit|push)|gh release|upload-artifact/i, 'Database backup utility must not publish sensitive dumps to the public repository.');

console.log('provider data continuity regression: ok');
