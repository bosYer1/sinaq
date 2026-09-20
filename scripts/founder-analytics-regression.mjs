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
const types = await readFile(new URL('../src/lib/founder-analytics/types.ts', import.meta.url), 'utf8');
const supabase = await readFile(new URL('../src/lib/founder-analytics/supabase-server.ts', import.meta.url), 'utf8');

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
assert.match(posthog, /properties\.\$host = 'gameyer\.az'/, 'Founder behavior metrics must be restricted to the canonical production host.');
assert.match(posthog, /\$virt_is_bot != true OR isNull\(properties\.\$virt_is_bot\)/, 'Known bot traffic must be excluded from human behavior metrics.');
assert.match(posthog, /PRODUCT_TIME_ZONE = 'Asia\/Baku'/, 'Calendar-based analytics must use the product timezone.');
assert.match(posthog, /toDate\(toTimeZone\(timestamp, '\$\{PRODUCT_TIME_ZONE\}'\)\)/, 'Retention and trend day boundaries must be derived in Baku time.');
assert.match(posthog, /d1_cohort_users/, 'D1 retention must have its own mature cohort denominator.');
assert.match(posthog, /d3_cohort_users/, 'D3 retention must have its own mature cohort denominator.');
assert.match(posthog, /d7_cohort_users/, 'D7 retention must have its own mature cohort denominator.');
assert.match(posthog, /event = 'pwa_install_available'/, 'PWA install availability must be measured separately from completed installs.');
assert.match(posthog, /event = 'pwa_installed'/, 'Completed PWA installs must use the dedicated appinstalled-backed event.');
assert.match(posthog, /event = 'pwa_standalone_opened'/, 'Standalone PWA opens must be measured separately for installed-app evidence.');
assert.match(posthog, /revalidate: 300/, 'PostHog provider must use bounded caching.');
assert.match(ga4, /revalidate: 300/, 'GA4 provider must use bounded caching.');
assert.match(gsc, /revalidate: 300/, 'GSC provider must use bounded caching.');

assert.ok(posthog.includes("countIf(first_seen < toDateTime('${from}')) AS returning_users"), 'Returning users must have a public visit before the selected interval.');
assert.ok(posthog.includes('countIf(person_id IN ('), 'Campaign returning users must use a prior-visit person set.');
assert.ok(posthog.includes("timestamp < toDateTime('${from}')"), 'Prior-visit queries must end before the selected interval starts.');
assert.ok(posthog.includes("uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview') AS public_pageview_sessions"), 'Attribution denominator must deduplicate public pageview sessions.');
assert.ok(posthog.includes('attributionCompleteness: rate(publicPageviewSessions - numberValue(health.source_missing_sessions), publicPageviewSessions)'), 'Attribution completeness must measure sessions with known traffic source, not landing-path completeness.');
assert.match(extended, />Stage reach</, 'Independent discovery stages must be labeled as Stage reach.');
assert.doesNotMatch(extended, /dropoff|OR-funnel|Landing-dən conversion/, 'Independent stage counts must not claim ordered funnel conversion or dropoff.');

assert.match(posthog, /event = 'club_update_impression'/, 'Return-loop impressions must be measured from the dedicated update event.');
assert.match(posthog, /event = 'club_update_detail_click'/, 'Return-loop homepage detail transitions must be measured from the dedicated update event.');
assert.ok(types.includes('updateDetailClicks: number;'), 'Return-loop metric contract must expose homepage-to-updates detail clicks.');
assert.ok(posthog.includes('updateDetailClicks: numberValue(returnLoop.update_detail_clicks)'), 'PostHog return-loop result must map homepage detail clicks.');
assert.ok(extended.includes('returnLoop.updateDetailClicks'), 'Founder Analytics must surface homepage-to-updates engagement.');
assert.ok(types.includes('supplyFunnel: SupplyFunnelMetrics;'), 'Founder Analytics contract must include the owner-claim supply funnel.');
assert.ok(posthog.includes("properties.submission_kind = 'owner_claim'") && posthog.includes("properties.submission_kind = 'new_club'") && posthog.includes("properties.submission_kind = 'correction'"), 'Supply funnel must preserve submission-kind boundaries.');
for (const eventName of ['submission_form_viewed', 'submission_form_started', 'submission_submit_attempt', 'submission_result']) assert.ok(posthog.includes(eventName), `Owner-claim funnel must measure ${eventName}.`);
assert.ok(extended.includes('posthog.supplyFunnel') && extended.includes('Klub sahibi funnel'), 'Founder Analytics must surface the owner-claim supply funnel.');
assert.ok(posthog.includes('newClubSent: numberValue(supplyFunnel.new_club_sent)') && posthog.includes('correctionSent: numberValue(supplyFunnel.correction_sent)'), 'Supply metrics must map new-club and correction sent signals.');
assert.ok(extended.includes('supplyFunnel.newClubSent') && extended.includes('supplyFunnel.correctionSent'), 'Founder Analytics must surface new-club and correction signals.');
assert.ok(types.includes('discoveryQuality:'), 'Founder Analytics contract must include discovery quality metrics.');
assert.ok(posthog.includes("event = 'search_query' AND properties.no_results = true"), 'Discovery quality must measure zero-result search sessions.');
assert.ok(posthog.includes("event = 'club_impression'") && posthog.includes("event = 'club_card_click'"), 'Discovery quality must measure visible-card and click sessions.');
assert.ok(extended.includes('posthog.discoveryQuality') && extended.includes('Discovery quality'), 'Founder Analytics must surface discovery quality.');
assert.ok(posthog.includes("event = 'filter_changed' AND properties.filter_name IN ('district','club_type','price_max')"), 'Filter adoption must use the contracted district/type/price filters.');
assert.ok(posthog.includes("event IN ('map_location_clicked','location_sort_clicked')"), 'Map adoption must use the contracted map/location events.');
assert.ok(posthog.includes('filterAdoptionRate: rate(numberValue(discoveryQuality.filter_sessions), numberValue(funnel.discovery_sessions))'), 'Filter adoption denominator must be discovery sessions.');
assert.ok(posthog.includes('mapAdoptionRate: rate(numberValue(discoveryQuality.map_sessions), numberValue(funnel.discovery_sessions))'), 'Map adoption denominator must be discovery sessions.');
assert.ok(extended.includes('discoveryQuality.filterAdoptionRate') && extended.includes('discoveryQuality.mapAdoptionRate'), 'Founder Analytics must surface filter and map adoption.');
assert.ok(posthog.includes("quantileIf(0.75)") && posthog.includes("event = 'web_vital'"), 'Real-user performance must use p75 web-vital telemetry.');
for (const metricName of ['LCP', 'INP', 'CLS']) assert.ok(posthog.includes(`properties.metric_name = '${metricName}'`), `Web-vital query must include ${metricName}.`);
assert.ok(extended.includes('posthog.webVitals') && extended.includes('Real user performance'), 'Founder Analytics must surface real-user performance.');
assert.ok(extended.includes('webVitals.lcpSamples') && extended.includes('webVitals.inpSamples') && extended.includes('webVitals.clsSamples'), 'Performance p75 must show sample counts.');
assert.ok(posthog.includes('profileToLeadRate: rate(numberValue(funnel.cta_sessions), numberValue(funnel.club_view_sessions))'), 'Profile-to-lead must use unique CTA sessions over club-view sessions.');
assert.ok(types.includes('newUsers: number;'), 'Founder Analytics contract must expose first-seen users separately from returning users.');
assert.ok(posthog.includes('newUsers: Math.max(0, numberValue(retention.users) - numberValue(retention.returning_users))'), 'New users must derive from current users minus users seen before the interval within the retention lookback.');
assert.ok(extended.includes('posthog.newUsers') && extended.includes('Yeni istifadəçilər'), 'Founder Analytics must surface new versus returning users.');
assert.ok(extended.includes('funnel.profileToLeadRate') && extended.includes('rezervasiya və ya satış sübutu deyil'), 'Founder Analytics must surface and qualify the behavioral lead proxy.');
assert.ok(posthog.includes("event IN ('club_update_impression','club_update_detail_click','club_update_club_click','club_update_source_click')) AS update_users"), 'Return-loop users must include homepage-to-updates detail clickers.');
assert.ok(posthog.includes("event IN ('club_update_impression','club_update_detail_click','club_update_club_click','club_update_source_click') AND notEmpty(properties.$session_id)) AS update_sessions"), 'Return-loop sessions must include homepage-to-updates detail click sessions.');
assert.match(posthog, /event = 'club_update_club_click'/, 'Return-loop club transitions must be measured from the dedicated update event.');
assert.match(posthog, /event = 'club_update_source_click'/, 'Return-loop source clicks must be measured from the dedicated update event.');
assert.ok(posthog.includes('(properties.$session_id, properties.club_id) IN ('), 'Downstream return-loop reach must stay on the same session and club.');
assert.ok(posthog.includes('returningUpdateRate: rate(returningUpdateUsers, updateUsers)'), 'Return-loop returning rate must use users with prior public visits.');
assert.ok(posthog.includes("['founder-analytics-posthog-v3']"), 'PostHog cache key must be bumped when production and retention semantics change.');
assert.match(extended, />Return-loop reach</, 'Founder Analytics must surface return-loop reach.');
assert.match(extended, /strict ordered funnel kimi təqdim edilmir/, 'Return-loop same-session reach must not be mislabeled as an ordered funnel.');

assert.match(extended, /d1CohortUsers/, 'Founder Analytics must render the dedicated D1 mature cohort denominator.');
assert.match(extended, /d3CohortUsers/, 'Founder Analytics must render the dedicated D3 mature cohort denominator.');
assert.match(extended, /d7CohortUsers/, 'Founder Analytics must render the dedicated D7 mature cohort denominator.');
assert.doesNotMatch(extended, /yalnız yeddi günlük müşahidə pəncərəsi tamamlanan kohort/, 'Retention UI must not imply one shared seven-day cohort for D1/D3/D7.');
assert.match(extended, />PWA install siqnalları</, 'Founder Analytics must surface PWA install evidence.');
assert.match(extended, /Quraşdırma imkanı.*download deyil/s, 'PWA availability must not be presented as a download or completed install.');
assert.match(extended, /posthog\.pwa\.installed/, 'Founder Analytics must surface confirmed appinstalled evidence.');
assert.match(extended, />Klub data prioritetləri</, 'Founder Analytics must surface demand-weighted club data priorities.');
assert.match(page, /clubDataPriorities=\{data\.clubDataPriorities\}/, 'Founder page must pass calculated club data priorities to the analytics UI.');

assert.match(calculations, /posthog\.tracking\.attributionCompleteness < 90/, 'CEO attribution warning must use session-level completeness.');
assert.doesNotMatch(calculations, /İki və daha çox sessiyası olan istifadəçilərin payı/, 'CEO returning signal must not equate repeat same-period sessions with returning users.');

console.log('founder analytics security, provider, and metric semantics regression: PASS');

assert.ok(types.includes('submissionBacklogByKind:'), 'Supabase metrics must expose open submission backlog by business kind.');
for (const kind of ['owner_claim', 'new_club', 'correction']) assert.ok(supabase.includes(`.eq('kind', '${kind}')`), `Operational backlog must count ${kind} independently.`);
assert.ok(page.includes('submissionBacklogByKind.ownerClaim') && page.includes('submissionBacklogByKind.newClub') && page.includes('submissionBacklogByKind.correction'), 'Founder dashboard must surface the open supply backlog mix.');

assert.ok(calculations.includes('supabase.submissionBacklogByKind.ownerClaim > 0') && calculations.includes('Klub sahibi müraciəti gözləyir'), 'CEO signals must elevate open owner claims as an operational supply priority.');


{
  const source = await readFile(new URL('../src/lib/founder-analytics/posthog-server.ts', import.meta.url), 'utf8');
  assert.ok(source.includes('POSTHOG_QUERY_TIMEOUT_MS = 6_000'), 'PostHog admin analytics must cap individual API latency.');
  assert.ok(source.includes('POSTHOG_MAX_CONCURRENCY = 6'), 'PostHog admin analytics must avoid a 12-request burst.');
  assert.ok(source.includes('createLimitedPostHogRunner'), 'PostHog queries must use a bounded runner.');
  assert.ok(source.includes('errors.push(detail);') && source.includes('return [];'), 'Extended PostHog query failures must fail soft instead of taking down the whole dashboard.');
  assert.ok(source.includes("if (overviewRows.length === 0)"), 'Core overview failure must still fail closed rather than showing invented zero metrics.');
  assert.ok(source.includes("['founder-analytics-posthog-v4']") && source.includes('revalidate: 600'), 'PostHog dashboard cache must reduce repeated provider load.');
}
