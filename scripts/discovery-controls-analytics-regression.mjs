import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [analytics, explore] = await Promise.all([
  readFile(new URL('../src/components/analytics/PostHogAnalytics.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
]);

for (const event of [
  'mobile_map_preview_activated',
  'mobile_more_clubs_clicked',
  'location_sort_clicked',
  'map_location_clicked',
]) {
  assert.ok(analytics.includes(`'${event}'`), `${event} must stay wired to PostHog`);
}

assert.ok(analytics.includes("button.closest('[data-mobile-list-map-container=\"true\"]')"), 'Mobile map activation must stay scoped to the list map preview');
assert.ok(analytics.includes("text.startsWith('Daha çox klub göstər')"), 'Mobile expand intent must stay measurable');
assert.ok(analytics.includes("text === 'Daha az klub göstər'"), 'Mobile collapse intent must stay measurable');
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

console.log('Discovery controls analytics regression: PASS');
