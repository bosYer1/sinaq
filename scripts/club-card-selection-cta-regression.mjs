import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [card, exploreView] = await Promise.all([
  readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/explore/ExploreView.tsx', import.meta.url), 'utf8'),
]);

assert.ok(card.includes('data-club-card-cta="true"'), 'Club cards must keep an explicit visible selection cue.');
assert.ok(card.includes('Kluba bax →'), 'Club card CTA copy must stay visible.');
assert.ok(card.includes('aria-hidden="true"'), 'Decorative CTA cue must not duplicate the anchor accessible name.');
assert.ok(card.includes("trackPostHogEvent(\n      'club_card_click'"), 'Selection cue must not bypass club_card_click tracking.');
assert.ok(card.includes('window.location.assign(clubHref)'), 'Mobile hard navigation behavior must remain intact.');

const mobileListStart = exploreView.indexOf("{view === 'list' ? (");
const mobileMapIndex = exploreView.indexOf('data-mobile-list-map-container="true"', mobileListStart);
const mobileClubListIndex = exploreView.indexOf('<ClubList', mobileListStart);
assert.ok(mobileListStart >= 0, 'Mobile list view must remain present.');
assert.ok(mobileClubListIndex >= 0, 'Mobile list view must render club cards.');
assert.ok(mobileMapIndex >= 0, 'Mobile list view must keep the map preview available.');
assert.ok(mobileClubListIndex < mobileMapIndex, 'Mobile club cards must render before the map preview so paid visitors reach selectable inventory earlier.');
assert.ok(exploreView.includes('clubsWithDistance.slice(0, 4)'), 'Collapsed mobile discovery must keep four initial club choices before expansion.');

console.log('club-card-selection-cta regression: ok');
