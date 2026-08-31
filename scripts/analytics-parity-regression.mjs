import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [card, link, pageview, errorPage, notFound, posthog] = await Promise.all([
  readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/analytics/TrackedClubLink.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/analytics/PageViewTracker.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/error.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/not-found.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/posthog.ts', import.meta.url), 'utf8'),
]);

for (const token of ['trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(card.includes(token), `ClubCard must keep ${token}`);
for (const token of ['trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(link.includes(token), `TrackedClubLink must keep ${token}`);
assert.ok(card.includes('club_card_click'), 'club_card_click must stay wired');
for (const event of ['phone_click', 'instagram_click', 'maps_click']) assert.ok(link.includes(event), `${event} must stay wired`);
for (const token of ['submission_success', 'trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(pageview.includes(token), `submission parity must keep ${token}`);
assert.ok(errorPage.includes('runtime_error'), 'runtime_error observability must stay wired');
assert.ok(notFound.includes('not_found'), 'not_found observability must stay wired');
assert.ok(posthog.includes('/admin') && posthog.includes('/api'), 'PostHog must keep admin/API exclusions');
assert.ok(posthog.includes("gameyer_traffic_scope: 'public'"), 'PostHog custom events must keep the reusable public traffic scope marker');
assert.ok(posthog.includes('captureWhenReady'), 'PostHog custom events must retry while the afterInteractive SDK initializes');
assert.ok(posthog.includes('POSTHOG_INIT_MAX_ATTEMPTS') && posthog.includes('window.setTimeout'), 'PostHog initialization retry must remain bounded and asynchronous');
const combined = [card, link, pageview, errorPage, notFound, posthog].join('\n');
for (const forbidden of ['phone_number', 'user_location', 'coordinates:', 'email:']) assert.ok(!combined.includes(forbidden), `analytics code must not deliberately send ${forbidden}`);

console.log('Analytics parity regression contract: PASS');
