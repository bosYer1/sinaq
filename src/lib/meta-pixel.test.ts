import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMetaPixelBootstrap, clubActionEvent, clubViewEvent, createMetaRouteTracker, normalizeMetaPixelId } from './meta-pixel.ts';

const club = { clubId: 'club-1', clubSlug: 'test-club', clubName: 'Test Club' };

test('missing or invalid Pixel ID does not produce a script', () => {
  assert.equal(normalizeMetaPixelId(undefined), null);
  assert.equal(normalizeMetaPixelId('not-a-pixel'), null);
  assert.equal(buildMetaPixelBootstrap('not-a-pixel'), '');
});

test('valid Pixel ID initializes and sends exactly one bootstrap PageView', () => {
  const script = buildMetaPixelBootstrap('1234567890');
  assert.match(script, /fbq\('init','1234567890'\)/);
  assert.equal(script.match(/fbq\('track','PageView'\)/g)?.length, 1);
  assert.ok(script.indexOf("fbq('init'") < script.indexOf("fbq('track','PageView')"));
});

test('route tracker skips bootstrap path and emits once per later public pathname', () => {
  const shouldTrack = createMetaRouteTracker('/');
  assert.equal(shouldTrack('/'), false);
  assert.equal(shouldTrack('/klub/test-club'), true);
  assert.equal(shouldTrack('/klub/test-club'), false);
  assert.equal(shouldTrack('/admin'), false);
});

test('ClubView contains only the approved club fields', () => {
  const event = clubViewEvent({ ...club, district: 'Nərimanov', clubTypes: ['pc', 'playstation'] });
  assert.deepEqual(event, { name: 'ClubView', params: { club_id: 'club-1', club_slug: 'test-club', club_name: 'Test Club', district: 'Nərimanov', club_types: 'pc,playstation' } });
});

test('club CTA events map to their Meta names', () => {
  assert.equal(clubActionEvent('phone_click', club).name, 'Contact');
  assert.equal(clubActionEvent('instagram_click', club).name, 'InstagramClick');
  assert.equal(clubActionEvent('maps_click', club).name, 'DirectionsClick');
});

test('Meta event params exclude PII and location fields', () => {
  const events = [clubViewEvent({ ...club, district: null, clubTypes: [] }), clubActionEvent('phone_click', club), clubActionEvent('instagram_click', club), clubActionEvent('maps_click', club)];
  const forbidden = ['phone', 'phone_number', 'email', 'latitude', 'longitude', 'coordinates', 'user_location', 'instagram_url'];
  for (const event of events) {
    for (const key of forbidden) assert.equal(Object.hasOwn(event.params, key), false, `${event.name} includes ${key}`);
  }
});
