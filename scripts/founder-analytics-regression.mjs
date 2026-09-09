import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../src/app/admin/analitika/page.tsx', import.meta.url), 'utf8');
const extended = await readFile(new URL('../src/app/admin/analitika/ExtendedAnalyticsSections.tsx', import.meta.url), 'utf8');
const metaSection = await readFile(new URL('../src/app/admin/analitika/MetaAdsAnalyticsSection.tsx', import.meta.url), 'utf8');
const posthog = await readFile(new URL('../src/lib/founder-analytics/posthog-server.ts', import.meta.url), 'utf8');
const meta = await readFile(new URL('../src/lib/founder-analytics/meta-server.ts', import.meta.url), 'utf8');
const ga4 = await readFile(new URL('../src/lib/founder-analytics/ga4-server.ts', import.meta.url), 'utf8');
const gsc = await readFile(new URL('../src/lib/founder-analytics/gsc-server.ts', import.meta.url), 'utf8');
const dashboard = await readFile(new URL('../src/lib/founder-analytics/dashboard.ts', import.meta.url), 'utf8');
const calculations = await readFile(new URL('../src/lib/founder-analytics/calculations.ts', import.meta.url), 'utf8');

assert.match(page, /await requireAdmin\(\)/, 'Founder analytics must enforce admin and MFA authorization in the page.');
assert.match(posthog, /^import 'server-only';/m, 'PostHog private API adapter must remain server-only.');
assert.match(meta, /^import 'server-only';/m, 'Meta Ads private API adapter must remain server-only.');
assert.match(ga4, /^import 'server-only';/m, 'GA4 private API adapter must remain server-only.');
assert.match(gsc, /^import 'server-only';/m, 'GSC private API adapter must remain server-only.');
assert.doesNotMatch(page, /POSTHOG_PERSONAL_API_KEY|META_ACCESS_TOKEN|PRIVATE_KEY/, 'Dashboard page must not reference provider secrets.');
assert.doesNotMatch(metaSection, /META_ACCESS_TOKEN|META_AD_ACCOUNT_ID|process\.env/, 'Meta UI section must never read server credentials.');

assert.match(dashboard, /getMetaAdsMetrics\(range\)/, 'Meta provider must execute the real server-side adapter.');
assert.match(dashboard, /meta\.status/, 'Meta provider badge must reflect the real adapter state.');
assert.match(meta, /META_API_VERSION = 'v26\.0'/, 'Meta Marketing API must be pinned to the reviewed v26.0 contract.');
assert.match(meta, /authorization: `Bearer \$\{accessToken\}`/, 'Meta access token must be sent in a server-side Authorization header.');
assert.doesNotMatch(meta, /access_token=/, 'Meta access token must not be placed in request URLs.');
assert.match(meta, /Meta Ads Insights request failed/, 'Meta adapter must fail closed when the API request fails.');
assert.match(meta, /revalidate: 300/, 'Meta provider must use bounded caching.');
assert.match(meta, /'spend'.*'impressions'.*'reach'.*'clicks'.*'ctr'.*'cpc'.*'cpm'/s, 'Meta adapter must request the core paid-media metrics.');
assert.match(metaSection, /Meta campaign → onsite behavior/, 'Meta campaign delivery must be comparable with onsite behavior.');
assert.match(metaSection, /paid_social/, 'Onsite Meta matching must require paid-social attribution.');
assert.match(metaSection, /campaign\.campaignId.*campaign\.campaignName/s, 'Campaign matching must support both Meta campaign id and name.');

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

assert.match(posthog, /event = 'club_update_impression'/, 'Return-loop impressions must be measured from the dedicated update event.');
assert.match(posthog, /event = 'club_update_club_click'/, 'Return-loop club transitions must be measured from the dedicated update event.');
assert.match(posthog, /event = 'club_update_source_click'/, 'Return-loop source clicks must be measured from the dedicated update event.');
assert.ok(posthog.includes('(properties.$session_id, properties.club_id) IN (SELECT properties.$session_id, properties.club_id FROM events'), 'Downstream return-loop reach must stay on the same session and club.');
assert.ok(posthog.includes("returningUpdateRate: rate(returningUpdateUsers, updateUsers)"), 'Return-loop returning rate must use users with prior public visits.');
assert.ok(posthog.includes("['founder-analytics-posthog-v2']"), 'PostHog cache key must be bumped when return-loop response semantics change.');
assert.match(extended, />Return-loop reach</, 'Founder Analytics must surface return-loop reach.');
assert.match(extended, /strict ordered funnel kimi təqdim edilmir/, 'Return-loop same-session reach must not be mislabeled as an ordered funnel.');

assert.match(calculations, /posthog\.tracking\.attributionCompleteness < 90/, 'CEO attribution warning must use session-level completeness.');
assert.doesNotMatch(calculations, /İki və daha çox sessiyası olan istifadəçilərin payı/, 'CEO returning signal must not equate repeat same-period sessions with returning users.');

console.log('founder analytics security, provider, and metric semantics regression: PASS');
