import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [card, link, pageview, errorPage, notFound, posthog] = await Promise.all([
  readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/clubs/TrackedClubLink.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/analytics/PageViewTracker.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/error.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/not-found.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/posthog.ts', import.meta.url), 'utf8'),
]);

for (const token of ['trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(card.includes(token), `ClubCard must keep ${token}`);
for (const token of ['trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(link.includes(token), `TrackedClubLink must keep ${token}`);
for (const event of ['club_card_click']) assert.ok(card.includes(event), `${event} must stay wired`);
for (const event of ['phone_click', 'instagram_click', 'maps_click']) assert.ok(link.includes(event), `${event} must stay wired`);
for (const token of ['submission_success', 'trackGaEvent', 'trackMetaCustomEvent', 'trackPostHogEvent']) assert.ok(pageview.includes(token), `submission parity must keep ${token}`);
assert.ok(errorPage.includes("runtime_error"), 'runtime_error observability must stay wired');
assert.ok(notFound.includes("not_found"), 'not_found observability must stay wired');
assert.ok(posthog.includes("/admin") && posthog.includes("/api"), 'PostHog must keep admin/API exclusions');
assert.ok(posthog.includes('01a053ae-c894-77db-80bc-889fba23279a1'), 'known Cloud Browser test visitor must remain excluded');
const combined = [card, link, pageview, errorPage, notFound, posthog].join('\n');
for (const forbidden of ['phone_number', 'user_location', 'coordinates:', 'email:']) assert.ok(!combined.includes(forbidden), `analytics code must not deliberately send ${forbidden}`);

console.log('Analytics parity regression contract: PASS');
