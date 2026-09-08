import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../src/app/admin/analitika/page.tsx', import.meta.url), 'utf8');
const extended = await readFile(new URL('../src/app/admin/analitika/ExtendedAnalyticsSections.tsx', import.meta.url), 'utf8');
const posthog = await readFile(new URL('../src/lib/founder-analytics/posthog-server.ts', import.meta.url), 'utf8');
const ga4 = await readFile(new URL('../src/lib/founder-analytics/ga4-server.ts', import.meta.url), 'utf8');
const gsc = await readFile(new URL('../src/lib/founder-analytics/gsc-server.ts', import.meta.url), 'utf8');
const dashboard = await readFile(new URL('../src/lib/founder-analytics/dashboard.ts', import.meta.url), 'utf8');
const calculations = await readFile(new URL('../src/lib/founder-analytics/calculations.ts', import.meta.url), 'utf8');

assert.match(page, /await requireAdmin\(\)/, 'Founder analytics must enforce admin and MFA authorization in the page.');
assert.match(posthog, /^import 'server-only';/m, 'PostHog private API adapter must remain server-only.');
assert.match(ga4, /^import 'server-only';/m, 'GA4 private API adapter must remain server-only.');
assert.match(gsc, /^import 'server-only';/m, 'GSC private API adapter must remain server-only.');
assert.doesNotMatch(page, /POSTHOG_PERSONAL_API_KEY|META_ACCESS_TOKEN|PRIVATE_KEY/, 'Client-rendered dashboard must not reference provider secrets.');
assert.match(dashboard, /configuredProviderStatus\('meta'\)/, 'Meta provider must expose an explicit unavailable state.');
assert.match(dashboard, /getGa4Metrics\(range\)/, 'GA4 provider must execute the real server-side adapter.');
assert.match(dashboard, /ga4\.status/, 'GA4 provider badge must reflect the real adapter state.');
assert.match(dashboard, /getGscMetrics\(range\)/, 'GSC provider must execute the real server-side adapter.');
assert.match(dashboard, /gsc\.status/, 'GSC provider badge must reflect the real adapter state.');
assert.match(posthog, /gameyer_traffic_scope = 'public'/, 'Behavior queries must exclude test traffic.');
assert.match(posthog, /revalidate: 300/, 'PostHog provider must use bounded caching.');
assert.match(ga4, /revalidate: 300/, 'GA4 provider must use bounded caching.');
assert.match(gsc, /revalidate: 300/, 'GSC provider must use bounded caching.');

assert.ok(posthog.includes("countIf(first_seen < toDateTime('${from}')) AS returning_users"), 'Returning users must have a public visit before the selected interval.');
assert.ok(posthog.includes('countIf(person_id IN (SELECT person_id FROM events'), 'Campaign returning users must use a prior-visit person set.');
assert.ok(posthog.includes("timestamp < toDateTime('${from}')"), 'Prior-visit queries must end before the selected interval starts.');
assert.ok(posthog.includes("uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview') AS public_pageview_sessions"), 'Attribution denominator must deduplicate public pageview sessions.');
assert.ok(posthog.includes('attributionCompleteness: rate(publicPageviewSessions - missingSessionAttribution, publicPageviewSessions)'), 'Attribution completeness must be calculated at session level.');
assert.match(extended, />Stage reach</, 'Independent discovery stages must be labeled as Stage reach.');
assert.doesNotMatch(extended, /dropoff|OR-funnel|Landing-dən conversion/, 'Independent stage counts must not claim ordered funnel conversion or dropoff.');
assert.match(calculations, /posthog\.tracking\.attributionCompleteness < 90/, 'CEO attribution warning must use session-level completeness.');
assert.doesNotMatch(calculations, /İki və daha çox sessiyası olan istifadəçilərin payı/, 'CEO returning signal must not equate repeat same-period sessions with returning users.');

console.log('founder analytics security, provider, and metric semantics regression: PASS');
