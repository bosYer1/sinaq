import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const card = (await readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8'))
  .replace(/\r\n/g, '\n');

assert.ok(card.includes('data-club-card-cta="true"'), 'Club cards must keep an explicit visible selection cue.');
assert.ok(card.includes('Kluba bax →'), 'Club card CTA copy must stay visible.');
assert.ok(card.includes('aria-hidden="true"'), 'Decorative CTA cue must not duplicate the anchor accessible name.');
assert.ok(card.includes("trackPostHogEvent(\n      'club_card_click'"), 'Selection cue must not bypass club_card_click tracking.');
assert.ok(card.includes('window.location.assign(clubHref)'), 'Mobile hard navigation behavior must remain intact.');

console.log('club-card-selection-cta regression: ok');
