import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [card, link, detail, pageview, errorPage, notFound, posthog, eventRoute, googleAnalytics] = await Promise.all([
  readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/analytics/TrackedClubLink.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/clubs/ClubDetail.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/analytics/PageViewTracker.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/error.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/not-found.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/posthog.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/api/analytics/event/route.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/analytics/GoogleAnalytics.tsx', import.meta.url), 'utf8'),
]);

for (const token of ['trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(card.includes(token), `ClubCard must keep ${token}`);
for (const token of ['trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(link.includes(token), `TrackedClubLink must keep ${token}`);
assert.ok(card.includes('club_card_click'), 'club_card_click must stay wired');
for (const event of ['phone_click', 'instagram_click', 'maps_click', 'club_correction_click']) assert.ok(link.includes(event), `${event} must stay wired`);
for (const event of ['phone_click', 'instagram_click', 'maps_click', 'club_correction_click']) assert.ok(detail.includes(`eventType="${event}"`), `ClubDetail must keep ${event} conversion wiring`);
for (const event of ['phone_click', 'instagram_click', 'maps_click', 'club_correction_click']) assert.ok(eventRoute.includes(`'${event}'`), `Analytics API must accept ${event}`);
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
assert.ok(googleAnalytics.includes("metric.name === 'LCP'"), 'LCP attribution must only enrich LCP web-vital events');
assert.ok(!googleAnalytics.includes('textContent') && !googleAnalytics.includes('innerText'), 'LCP attribution must not collect rendered text');
assert.ok(!googleAnalytics.includes('entry.url') && !googleAnalytics.includes('currentSrc'), 'LCP attribution must not collect resource URLs');
const combined = [card, link, detail, pageview, errorPage, notFound, posthog, eventRoute, googleAnalytics].join('\n');
for (const forbidden of ['phone_number', 'user_location', 'coordinates:', 'email:']) assert.ok(!combined.includes(forbidden), `analytics code must not deliberately send ${forbidden}`);

console.log('Analytics parity regression contract: PASS');
