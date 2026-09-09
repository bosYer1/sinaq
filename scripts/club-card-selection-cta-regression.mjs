import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const card = await readFile(new URL('../src/components/clubs/ClubCard.tsx', import.meta.url), 'utf8');
const share = await readFile(new URL('../src/components/clubs/ShareClubButton.tsx', import.meta.url), 'utf8');

assert.ok(card.includes('data-club-card-cta="true"'), 'Club cards must keep an explicit visible selection cue.');
assert.ok(card.includes('Kluba bax →'), 'Club card CTA copy must stay visible.');
assert.ok(card.includes('aria-hidden="true"'), 'Decorative CTA cue must not duplicate the anchor accessible name.');
assert.match(card, /trackPostHogEvent\(\s*'club_card_click'/, 'Selection cue must not bypass club_card_click tracking.');
assert.ok(card.includes('window.location.assign(clubHref)'), 'Mobile hard navigation behavior must remain intact.');

assert.ok(share.includes("utm_source: 'gameyer_share'"), 'Shared club URLs must identify GameYer sharing as the source.');
assert.ok(share.includes("utm_medium: 'referral'"), 'Shared club URLs must enter the Referral acquisition channel.');
assert.ok(share.includes("utm_campaign: 'club_share'"), 'Shared club URLs must use a stable club-share campaign.');
assert.ok(share.includes("attributedUrl.search = ''"), 'Shared URLs must discard mutable incoming query attribution before adding share attribution.');
assert.ok(share.includes("attributedUrl.hash = ''"), 'Shared URLs must not leak page fragments.');
assert.match(share, /navigator\.share\([\s\S]*url: shareUrl/, 'Native sharing must use the attributed share URL.');
assert.match(share, /copyUrl\(shareUrl\)/, 'Clipboard fallback must use the same attributed share URL.');
assert.match(share, /trackPostHogEvent\(\s*'club_share'/, 'Successful club sharing must remain tracked.');
assert.doesNotMatch(share, /window\.location\.href/, 'Share attribution must not inherit the visitor current URL or incoming campaign parameters.');

console.log('club-card-selection-cta and referral-share regression: ok');
