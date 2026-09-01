import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [card, link, detail, pageview, errorPage, notFound, posthog, eventRoute, visitRoute, googleAnalytics, correctionAnalyticsMigration, analyticsServer, serverOnlyAnalyticsMigration, trustedIngest] = await Promise.all([
  readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/analytics/TrackedClubLink.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/clubs/ClubDetail.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/analytics/PageViewTracker.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/error.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/not-found.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/posthog.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/api/analytics/event/route.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/api/analytics/visit/route.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/analytics/GoogleAnalytics.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/20260831163000_add_club_correction_analytics_event.sql', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/supabase/analytics-server.ts', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/20260831183000_server_only_analytics_writes.sql', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/functions/gameyer-analytics-ingest/index.ts', import.meta.url), 'utf8'),
]);

for (const token of ['trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(card.includes(token), `ClubCard must keep ${token}`);
for (const token of ['trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(link.includes(token), `TrackedClubLink must keep ${token}`);
assert.ok(card.includes('club_card_click'), 'club_card_click must stay wired');
for (const event of ['phone_click', 'instagram_click', 'maps_click', 'club_correction_click']) assert.ok(link.includes(event), `${event} must stay wired`);
for (const surface of ['header_maps', 'contact_phone', 'contact_instagram', 'contact_maps', 'correction']) assert.ok(link.includes(`'${surface}'`), `TrackedClubLink must keep CTA surface ${surface}`);
assert.ok(link.includes('cta_surface'), 'Club action analytics must keep CTA surface attribution');
assert.ok(link.includes("closest('aside')"), 'Maps CTA attribution must distinguish header and contact-card surfaces without visual selectors or text');
for (const event of ['phone_click', 'instagram_click', 'maps_click', 'club_correction_click']) assert.ok(detail.includes(`eventType="${event}"`), `ClubDetail must keep ${event} conversion wiring`);
for (const event of ['phone_click', 'instagram_click', 'maps_click', 'club_correction_click']) assert.ok(eventRoute.includes(`'${event}'`), `Analytics API must accept ${event}`);
for (const event of ['phone_click', 'instagram_click', 'maps_click', 'club_correction_click']) assert.ok(correctionAnalyticsMigration.includes(`'${event}'`), `Analytics DB migration must accept ${event}`);
assert.ok(correctionAnalyticsMigration.includes('analytics_events_type_valid'), 'Analytics DB event CHECK constraint must stay aligned');
assert.ok(correctionAnalyticsMigration.includes('anon_insert_analytics_events'), 'Historical correction migration must keep its rollout insert policy');
assert.ok(correctionAnalyticsMigration.includes('authenticated_insert_analytics_events'), 'Historical correction migration must keep its rollout authenticated insert policy');
assert.ok(correctionAnalyticsMigration.includes('enforce_analytics_event_rate_limit'), 'Analytics DB abuse backstop must stay aligned');
assert.ok(correctionAnalyticsMigration.includes('session_count >= 30') && correctionAnalyticsMigration.includes('global_count >= 1500'), 'Analytics DB rate limits must not be weakened while adding correction parity');
assert.ok((detail.match(/eventType="maps_click"/g) ?? []).length >= 2, 'ClubDetail must keep both route CTA surfaces tracked');
assert.ok(!detail.includes('Bu klubun sahibisiniz?'), 'Premature club-owner claim CTA must remain hidden until the owner flow is ready');
for (const token of ['submission_success', 'trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(pageview.includes(token), `submission parity must keep ${token}`);
assert.ok(errorPage.includes('runtime_error'), 'runtime_error observability must stay wired');
assert.ok(notFound.includes('not_found'), 'not_found observability must stay wired');
assert.ok(posthog.includes('/admin') && posthog.includes('/api'), 'PostHog must keep admin/API exclusions');
assert.ok(posthog.includes("gameyer_traffic_scope: 'public'"), 'PostHog custom events must keep the reusable public traffic scope marker');
assert.ok(posthog.includes('captureWhenReady'), 'PostHog custom events must retry while the afterInteractive SDK initializes');
assert.ok(posthog.includes('POSTHOG_INIT_MAX_ATTEMPTS') && posthog.includes('window.setTimeout'), 'PostHog initialization retry must remain bounded and asynchronous');
for (const token of ['lcp_element_tag', 'lcp_element_id', 'lcp_element_classes', 'lcp_element_size']) assert.ok(googleAnalytics.includes(token), `LCP attribution must keep ${token}`);
for (const token of ['inp_event_type', 'inp_element_tag', 'inp_element_id', 'inp_element_classes']) assert.ok(googleAnalytics.includes(token), `INP attribution must keep ${token}`);
assert.ok(googleAnalytics.includes('targetSelector'), 'INP attribution must preserve a browser selector fallback when the interaction target detaches');
assert.ok(googleAnalytics.includes('selectorAttribution'), 'INP selector fallback must stay sanitized before analytics capture');
assert.ok(googleAnalytics.includes("metric.name === 'LCP'"), 'LCP attribution must only enrich LCP web-vital events');
assert.ok(googleAnalytics.includes("metric.name === 'INP'"), 'INP attribution must only enrich INP web-vital events');
assert.ok(!googleAnalytics.includes('textContent') && !googleAnalytics.includes('innerText'), 'Web-vital attribution must not collect rendered text');
assert.ok(!googleAnalytics.includes('entry.url') && !googleAnalytics.includes('currentSrc'), 'Web-vital attribution must not collect resource URLs');

for (const route of [eventRoute, visitRoute]) {
  assert.ok(route.includes('writeAnalyticsRecord'), 'First-party analytics routes must use the trusted server analytics writer');
  assert.ok(route.includes('requestVercelOidcToken'), 'First-party analytics routes must forward the request-scoped Vercel OIDC token');
  assert.ok(route.includes('x-gameyer-analytics-write'), 'Analytics rollout must expose a non-secret write-mode header for production verification');
}
assert.ok(analyticsServer.includes('SUPABASE_SECRET_KEY'), 'Server analytics writer must still support a direct modern Supabase secret when available');
assert.ok(analyticsServer.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Server analytics writer must still support the legacy service-role key when available');
assert.ok(analyticsServer.includes("request.headers.get('x-vercel-oidc-token')"), 'Server analytics writer must consume the fresh per-request Vercel OIDC token');
assert.ok(analyticsServer.includes('gameyer-analytics-ingest'), 'Server analytics writer must target the trusted Supabase Edge Function');
assert.ok(!analyticsServer.includes('public-fallback'), 'Public PostgREST analytics fallback must be removed before DB revocation');
assert.ok(analyticsServer.includes("'vercel-oidc-edge'"), 'OIDC analytics mode must be explicitly observable');

for (const token of [
  "VERCEL_ISSUER = 'https://oidc.vercel.com/gameyer'",
  "VERCEL_AUDIENCE = 'https://vercel.com/gameyer'",
  "VERCEL_SUBJECT = 'owner:gameyer:project:gameyer:environment:production'",
  'jwtVerify',
  'SUPABASE_SECRET_KEYS',
  'SUPABASE_SERVICE_ROLE_KEY',
]) assert.ok(trustedIngest.includes(token), `Trusted ingest must enforce ${token}`);
assert.ok(trustedIngest.includes("request.headers.get('x-gameyer-vercel-oidc')"), 'Trusted ingest must require the server-only Vercel OIDC token');
assert.ok(!trustedIngest.includes("Access-Control-Allow-Origin: '*'"), 'Trusted ingest must never become a public CORS analytics endpoint');

for (const policy of [
  'anon_insert_page_views',
  'authenticated_insert_page_views',
  'anon_insert_analytics_events',
  'authenticated_insert_analytics_events',
]) assert.ok(serverOnlyAnalyticsMigration.includes(`DROP POLICY IF EXISTS ${policy}`), `Server-only migration must remove ${policy}`);
assert.ok(serverOnlyAnalyticsMigration.includes('REVOKE INSERT (session_id, visit_id, path, referrer_host, user_agent)'), 'Server-only migration must revoke public page-view insert columns');
assert.ok(serverOnlyAnalyticsMigration.includes('REVOKE INSERT (session_id, path, event_type, club_slug)'), 'Server-only migration must revoke public analytics-event insert columns');
assert.ok(serverOnlyAnalyticsMigration.includes('FROM anon, authenticated'), 'Server-only migration must revoke both public PostgREST roles');

const combined = [card, link, detail, pageview, errorPage, notFound, posthog, eventRoute, visitRoute, googleAnalytics, correctionAnalyticsMigration, analyticsServer, serverOnlyAnalyticsMigration, trustedIngest].join('\n');
for (const forbidden of ['phone_number', 'user_location', 'coordinates:', 'email:']) assert.ok(!combined.includes(forbidden), `analytics code must not deliberately send ${forbidden}`);

console.log('Analytics parity regression contract: PASS');
