import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../src/app/admin/analitika/page.tsx', import.meta.url), 'utf8');
const extended = await readFile(new URL('../src/app/admin/analitika/ExtendedAnalyticsSections.tsx', import.meta.url), 'utf8');
const loading = await readFile(new URL('../src/app/admin/analitika/loading.tsx', import.meta.url), 'utf8');
const metaSection = await readFile(new URL('../src/app/admin/analitika/MetaAdsAnalyticsSection.tsx', import.meta.url), 'utf8');
const posthog = await readFile(new URL('../src/lib/founder-analytics/posthog-server.ts', import.meta.url), 'utf8');
const meta = await readFile(new URL('../src/lib/founder-analytics/meta-server.ts', import.meta.url), 'utf8');
const ga4 = await readFile(new URL('../src/lib/founder-analytics/ga4-server.ts', import.meta.url), 'utf8');
const gsc = await readFile(new URL('../src/lib/founder-analytics/gsc-server.ts', import.meta.url), 'utf8');
const dashboard = await readFile(new URL('../src/lib/founder-analytics/dashboard.ts', import.meta.url), 'utf8');
const calculations = await readFile(new URL('../src/lib/founder-analytics/calculations.ts', import.meta.url), 'utf8');
const types = await readFile(new URL('../src/lib/founder-analytics/types.ts', import.meta.url), 'utf8');
const supabase = await readFile(new URL('../src/lib/founder-analytics/supabase-server.ts', import.meta.url), 'utf8');
const normalization = await readFile(new URL('../src/lib/founder-analytics/normalization.ts', import.meta.url), 'utf8');
const databaseTypes = await readFile(new URL('../src/types/database.ts', import.meta.url), 'utf8');

assert.match(page, /await requireAdmin\(\)/, 'Founder analytics must enforce admin and MFA authorization in the page.');
assert.match(posthog, /^import 'server-only';/m, 'PostHog private API adapter must remain server-only.');
assert.match(posthog, /argMinIf\(person_id, timestamp, event = '\$pageview'\)/, 'Acquisition must recover identity from the session landing pageview.');
assert.match(posthog, /positionCaseInsensitive[\s\S]*google\./, 'Acquisition must recognize Google organic referrers.');
assert.match(posthog, /'paid_social'/, 'Acquisition must preserve paid-social attribution.');
assert.doesNotMatch(posthog, /coalesce\(nullIf\(properties\.gameyer_first_utm_source, ''\), if\(notEmpty\(properties\.gameyer_first_fbclid\), 'facebook', 'direct'\)\)/, 'Untagged organic sessions must not be forced to Direct.');
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
assert.ok(ga4.includes("fieldName: 'pagePath'") && ga4.includes("matchType: 'BEGINS_WITH'") && ga4.includes("value: '/admin'"), 'Founder GA4 metrics must exclude admin-route traffic from the public business view.');
assert.ok(ga4.includes("['founder-analytics-ga4-v3']"), 'GA4 cache key must be bumped when public-traffic semantics change.');
assert.match(gsc, /revalidate: 300/, 'GSC provider must use bounded caching.');

assert.ok(posthog.includes("countIf(first_seen < toDateTime('${from}')) AS returning_users"), 'Returning users must have a public visit before the selected interval.');
assert.ok(posthog.includes('uniqIf(person_id, person_id IN ('), 'Campaign returning users must use a prior-visit person set without double-counting users across sessions.');
assert.ok(posthog.includes("timestamp < toDateTime('${from}')"), 'Prior-visit queries must end before the selected interval starts.');
assert.ok(posthog.includes("uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview') AS public_pageview_sessions"), 'Attribution denominator must deduplicate public pageview sessions.');
assert.ok(posthog.includes('attributionCompleteness: rate(publicPageviewSessions - numberValue(health.source_missing_sessions), publicPageviewSessions)'), 'Attribution completeness must measure sessions with known traffic source, not landing-path completeness.');
assert.match(extended, />Stage reach — strict funnel deyil</, 'Independent discovery stages must be labeled as non-strict Stage Reach.');
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
assert.ok(types.includes('intentSessions: Metric;'), 'Founder Analytics must expose unique outbound-intent sessions.');
assert.ok(posthog.includes("AS intent_sessions") && posthog.includes("AS club_view_sessions"), 'PostHog overview must calculate unique intent and club-view sessions.');
assert.ok(posthog.includes("'tiktok_click'"), 'TikTok clicks must be included in the PostHog outbound-intent contract.');
assert.ok(posthog.includes("'whatsapp_booking_click'"), 'WhatsApp reservation clicks must be included in the PostHog outbound-intent contract.');
assert.ok(posthog.includes("countIf(event IN ('phone_click','instagram_click','tiktok_click','maps_click','whatsapp_booking_click')) AS cta_clicks"), 'PostHog overview must expose raw CTA clicks including WhatsApp reservation intent.');
assert.ok(types.includes('tiktokClicks: Metric;') && types.includes('tiktokClicks: number;'), 'Founder analytics contracts must expose TikTok click counts.');
assert.ok(types.includes('whatsappBookingClicks: Metric;') && types.includes('whatsappBookingClicks: number;'), 'Founder analytics contracts must expose WhatsApp reservation intent counts.');
assert.ok(types.includes("'social'") && types.includes('missingSocial: number;'), 'Data-quality contracts must treat social profile as Instagram-or-TikTok, not Instagram-only.');
assert.ok(supabase.includes("!club.instagram_url?.trim() && !club.tiktok_url?.trim()") && supabase.includes("missingFields.push('social')"), 'TikTok-only active clubs must not be penalized as missing social data.');
assert.ok(extended.includes('posthog.tiktokClicks') && page.includes('club.tiktokClicks'), 'Founder analytics UI must surface TikTok club intent.');
assert.ok(page.includes('club.whatsappBookingClicks') && page.includes('WhatsApp rezervasiya'), 'Founder analytics UI must surface WhatsApp reservation intent per club.');
assert.ok(page.includes('data.supabase.firstPartyIntent.whatsappBookingClicks') && page.includes('WhatsApp rezervasiya sorğusu'), 'Founder dashboard must surface first-party WhatsApp reservation intent alongside PostHog.');
assert.ok(page.includes('təsdiqlənmiş rezervasiya, müştəri və ya satış deyil'), 'Founder dashboard must not mislabel WhatsApp reservation intent as a confirmed booking or sale.');
assert.ok(extended.includes('posthog.whatsappBookingClicks') && extended.includes('club.whatsappBookingClicks'), 'Founder analytics UI must surface WhatsApp reservation intent.');
assert.ok(posthog.includes('conversionRate: metric(rate(currentIntentSessions, currentClubViewSessions), rate(previousIntentSessions, previousClubViewSessions))'), 'Primary intent conversion must use unique session denominators.');
assert.ok(types.includes('integrityOk: boolean'), 'Stage Reach contract must expose integrity state.');
assert.ok(extended.includes('funnel.integrityOk') && extended.includes('Reach integrity check keçib'), 'Stage Reach must surface subset integrity.');
assert.ok(extended.includes('D30 bu dashboard-da hesablanmır'), 'Retention UI must explicitly state that D30 is not calculated.');
assert.ok(extended.includes('user bazasına bölünmür'), 'Filter adoption denominator must be explicit in the UI.');
assert.ok(types.includes('firstPartyIntent:'), 'Supabase metrics must include first-party intent verification.');
assert.ok(supabase.includes("from('analytics_events')") && supabase.includes("['phone_click', 'instagram_click', 'maps_click', 'whatsapp_booking_click']"), 'Supabase must independently verify outbound intent events including WhatsApp reservation intent.');
assert.ok(dashboard.includes('getSupabaseMetrics(supabase, range)'), 'First-party verification must use the same selected date range.');
assert.ok(page.includes('Metodologiya guard:') && page.includes('cross-provider bölmə aparılmır'), 'Dashboard must guard provider identity semantics in user-visible copy.');
assert.ok(page.includes('Outbound intent sessiyası') && page.includes('firstPartyIntent.browserVisitors'), 'Dashboard must surface the intent North Star and first-party verifier.');
assert.ok(page.includes('GA4 key events = 0:') && page.includes('behavior tracking yoxdur demək deyil'), 'GA4 zero key-events must not be mislabeled as absent tracking.');
assert.ok(databaseTypes.includes('analytics_events: {') && databaseTypes.includes("AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row']"), 'Database types must include the production analytics_events table.');
assert.ok(types.includes('clubViewSessions: number;') && types.includes('ctaSessions: number;') && types.includes('viewSessions: number;') && types.includes('intentSessions: number;'), 'Founder metric contracts must keep raw events separate from unique-session reach.');
assert.ok(posthog.includes('AS club_view_sessions') && posthog.includes('AS cta_sessions') && posthog.includes('AS view_sessions') && posthog.includes('AS intent_sessions'), 'PostHog campaign and club queries must collect unique-session conversion denominators.');
assert.ok(normalization.includes('clubViewRate: rate(clubViewSessions, sessions)') && normalization.includes('conversionRate: rate(ctaSessions, sessions)'), 'Campaign rates must use unique session reach, not raw clicks.');
assert.ok(normalization.includes('intentRate: rate(intentSessions, viewSessions)'), 'Club intent rate must use unique session denominators.');
assert.ok(normalization.includes('ctaRate: rate(row.ctaSessions, row.sessions)'), 'Acquisition intent rate must use unique intent sessions.');
assert.ok(page.includes('Intent sess.') && extended.includes('Intent sess. rate') && extended.includes('Detail→intent'), 'Founder UI must visibly distinguish raw CTA events from unique intent sessions.');
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
assert.ok(posthog.includes("['founder-analytics-posthog-v11']"), 'PostHog cache key must be bumped when provider reliability semantics change.');
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
  assert.ok(source.includes("['founder-analytics-posthog-v11']") && source.includes('revalidate: 300'), 'Successful PostHog dashboard reads must use bounded caching.');
}

assert.ok(posthog.includes('toFloatOrZero(toString(properties.metric_value))'), 'PostHog web-vitals query must use the supported HogQL float conversion helper.');
assert.ok(!posthog.includes('toFloat64OrZero('), 'Unsupported HogQL toFloat64OrZero must not regress into Founder Analytics.');

assert.ok(posthog.includes("GAMEYER_POSTHOG_PROJECT_ID = '585472'"), 'GameYer analytics must have a verified project-id fallback.');
assert.ok(posthog.includes("GAMEYER_POSTHOG_HOST = 'https://us.posthog.com'"), 'GameYer analytics must use the verified US PostHog region fallback.');
assert.ok(posthog.includes('POSTHOG_CORE_TIMEOUT_MS = 4_000'), 'Core PostHog timeout must stay within the dashboard deadline budget and allow one bounded retry.');
assert.ok(posthog.includes('queryCoreHogQL(host, projectId, apiKey'), 'Core PostHog overview must run before optional query fan-out.');
assert.ok(posthog.includes('for (let attempt = 0; attempt < 2; attempt += 1)'), 'Core PostHog read must retry once for transient failures.');
assert.ok(posthog.includes("if (result.status.status !== 'ready') throw new Error(result.status.detail);"), 'Provider errors must not be stored as successful cached analytics.');
assert.ok(!posthog.includes('return fetchPostHogMetrics(range);'), 'A failed cached PostHog read must not trigger a second full live query in the same dashboard request.');
assert.ok(posthog.includes('POSTHOG_DASHBOARD_DEADLINE_MS = 9_000') && posthog.includes('Promise.race(['), 'PostHog dashboard reads must have a hard UI deadline.');
assert.ok(dashboard.includes('SECONDARY_PROVIDER_DEADLINE_MS = 4_500') && dashboard.includes('SUPABASE_DEADLINE_MS = 4_000'), 'Non-core providers must not block the entire Founder dashboard indefinitely.');
assert.ok(dashboard.includes("withDashboardDeadline('GA4'") && dashboard.includes("withDashboardDeadline('GSC'") && dashboard.includes("withDashboardDeadline('Meta Ads'") && dashboard.includes("withDashboardDeadline('Supabase'"), 'Founder dashboard must apply provider deadlines consistently.');
assert.ok(loading.includes('Analitika yüklənir') && loading.includes('aria-busy="true"'), 'Analytics route must render an immediate loading shell during server navigation.');

assert.ok(posthog.includes("const healthRetentionPromise = Promise.all(["), 'Health and retention must start concurrently with overview and optional PostHog reads.');
assert.ok(posthog.includes("queryCoreHogQL(host, projectId, apiKey"), 'Critical PostHog health/retention reads must use retrying core queries.');
assert.ok(posthog.includes("if (healthRows.length === 0 || retentionRows.length === 0)"), 'Missing critical CEO-signal inputs must fail closed instead of producing fake zero signals.');
assert.ok(posthog.includes('const overviewPromise = queryCoreHogQL') && posthog.includes('const optionalPromise = Promise.all(['), 'PostHog phases must launch without a sequential waterfall.');
assert.ok(posthog.includes('await Promise.all([overviewPromise, healthRetentionPromise, optionalPromise])'), 'PostHog phases must converge through one concurrent await.');
assert.ok(!posthog.includes("const [campaignRows, clubRows, trendRows, healthRows, retentionRows"), 'Health/retention must not remain in optional fail-soft result tuple.');

assert.ok(posthog.includes('integrityOk: numberValue(funnel.cta_sessions) <= numberValue(funnel.club_view_sessions)'), 'Stage Reach integrity must only enforce the true CTA subset invariant.');
assert.ok(extended.includes('CTA sessiyası klub-detail sessiyasının subsetidir'), 'Stage Reach UI must describe the true subset invariant instead of a fake strict funnel.');

assert.ok(posthog.includes('POSTHOG_CORE_TIMEOUT_MS = 4_000'), 'Core PostHog attempts must fit inside the dashboard deadline even with one bounded retry.');
assert.ok(posthog.includes('POSTHOG_MAX_CONCURRENCY = 6'), 'PostHog optional-query concurrency must remain bounded.');
assert.ok(posthog.includes('POSTHOG_DASHBOARD_DEADLINE_MS = 9_000'), 'Dashboard deadline must exceed the 8.35s worst-case bounded core retry topology.');
