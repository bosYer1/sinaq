import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [analytics, explore, clubMap, home] = await Promise.all([
  readFile(new URL('../src/components/analytics/PostHogAnalytics.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/map/ClubMap.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8'),
]);

for (const event of [
  'mobile_map_preview_activated',
  'mobile_more_clubs_clicked',
  'location_sort_clicked',
  'map_location_clicked',
  'home_club_jump_clicked',
]) {
  assert.ok(analytics.includes(`'${event}'`), `${event} must stay wired to PostHog`);
}

assert.ok(analytics.includes("button.closest('[data-mobile-list-map-container=\"true\"]')"), 'Mobile map activation must stay scoped to the list map preview');
assert.ok(analytics.includes("text.startsWith('Daha çox klub göstər')"), 'Mobile expand intent must stay measurable');
assert.ok(analytics.includes("text === 'Daha az klub göstər'"), 'Mobile collapse intent must stay measurable');
assert.ok(analytics.includes("target.closest('[data-home-club-jump=\"true\"]')"), 'Homepage jump-to-clubs intent must stay measurable');
assert.ok(analytics.includes("document.addEventListener('click', onDocumentClick)"), 'Discovery control tracking must use one delegated click listener');
assert.ok(analytics.includes("document.removeEventListener('click', onDocumentClick)"), 'Discovery control tracking must clean up its delegated listener');

for (const uiContract of [
  'data-mobile-list-map-container="true"',
  'aria-label="Xəritəni aktiv et"',
  'Daha çox klub göstər',
  'Daha az klub göstər',
  'Yaxınlığıma görə',
]) {
  assert.ok(explore.includes(uiContract), `ExploreView must keep analytics UI contract: ${uiContract}`);
}

assert.ok(home.includes('data-home-club-jump="true"') && home.includes('href="#club-discovery"'), 'Homepage must keep a direct jump to club discovery');
assert.ok(home.includes('id="club-discovery"'), 'Homepage club discovery anchor target must remain stable');

assert.ok(clubMap.includes("isPlainLeftClick") && clubMap.includes("if (isPlainLeftClick) rememberClubEntryOrigin(club.slug)"), 'Map popup must preserve return origin only for same-tab plain-left navigation');
assert.ok(clubMap.includes("trackPostHogEvent('club_card_click'"), 'Map popup club opens must stay measurable as club-card discovery clicks');
assert.ok(clubMap.includes("discovery_surface: 'map_popup'"), 'Map popup clicks must preserve their discovery surface');
assert.ok(clubMap.includes("transport: 'sendBeacon'"), 'Map popup navigation tracking must use unload-safe transport');
assert.ok(clubMap.includes("map_popup_title") && clubMap.includes("map_popup_details"), 'Both map popup club links must remain instrumented');

console.log('Discovery controls analytics regression: PASS');
