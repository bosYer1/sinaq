import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [analytics, explore, clubMap, home] = await Promise.all([
  readFile(new URL('../src/components/analytics/PostHogAnalytics.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/map/ClubMap.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8'),
]);

assert.ok(explore.includes("trackPostHogEvent('mobile_map_preview_activated'"), 'Mobile map preview activation must be captured directly');
assert.ok(explore.includes("trackPostHogEvent('mobile_more_clubs_clicked'"), 'Mobile list toggle must be captured directly');
assert.ok(explore.includes("action: nextExpanded ? 'expand' : 'collapse'"), 'Toggle analytics must use next state');
assert.ok(!analytics.includes("'mobile_map_preview_activated'"), 'Delegated analytics must not double-capture map activation');
assert.ok(!analytics.includes("'mobile_more_clubs_clicked'"), 'Delegated analytics must not infer toggle state from text');
for (const event of ['location_sort_clicked', 'map_location_clicked']) assert.ok(analytics.includes(`'${event}'`), `${event} must stay wired`);
assert.ok(analytics.includes("document.addEventListener('click', onDocumentClick)"));
assert.ok(analytics.includes("document.removeEventListener('click', onDocumentClick)"));
for (const ui of ['data-mobile-list-map-container="true"','aria-label="Xəritəni aktiv et"','Daha çox klub göstər','Daha az klub göstər','Yaxınlığıma görə']) assert.ok(explore.includes(ui), `Missing UI contract: ${ui}`);
assert.ok(home.includes('id="club-search"'));
assert.ok(home.includes('id="club-discovery"'));
assert.ok(clubMap.includes("trackPostHogEvent('club_card_click'"));
assert.ok(clubMap.includes("discovery_surface: 'map_popup'"));
assert.ok(clubMap.includes("transport: 'sendBeacon'"));
console.log('Discovery controls analytics regression: PASS');
