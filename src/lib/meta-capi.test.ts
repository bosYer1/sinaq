import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMetaCapiServerEvent,
  normalizeMetaCapiPixelId,
  normalizeMetaGraphApiVersion,
  sanitizeMetaCapiInput,
} from './meta-capi.ts';

const validInput = {
  eventId: 'gy_m123456789_abcdef123456',
  name: 'Contact',
  params: {
    channel: 'phone',
    club_id: 'club-1',
    club_slug: 'test-club',
    club_name: 'Test Club',
  },
  path: '/klub/test-club',
  fbp: 'fb.1.1234567890.123456789',
  fbc: 'fb.1.1234567890.AbCdEf',
} as const;

test('Meta CAPI identifiers and API version are strictly normalized', () => {
  assert.equal(normalizeMetaCapiPixelId('1234567890'), '1234567890');
  assert.equal(normalizeMetaCapiPixelId('not-a-pixel'), null);
  assert.equal(normalizeMetaGraphApiVersion('v26.0'), 'v26.0');
  assert.equal(normalizeMetaGraphApiVersion('latest'), null);
});

test('Meta CAPI input accepts only approved events, paths, cookies and custom fields', () => {
  assert.deepEqual(sanitizeMetaCapiInput(validInput), validInput);
  assert.equal(sanitizeMetaCapiInput({ ...validInput, name: 'Purchase' }), null);
  assert.equal(sanitizeMetaCapiInput({ ...validInput, path: '/admin' }), null);
  assert.equal(sanitizeMetaCapiInput({ ...validInput, params: { email: 'person@example.com' } }), null);
  assert.equal(sanitizeMetaCapiInput({ ...validInput, eventId: 'external-id' }), null);
});

test('SEO click attribution passes the bounded CAPI custom-data allowlist', () => {
  const seoClick = {
    ...validInput,
    name: 'ClubCardClick',
    params: {
      club_id: 'club-1',
      club_slug: 'test-club',
      club_name: 'Test Club',
      district: 'Nərimanov',
      source_surface: 'seo_landing',
      landing_path: '/bakida-playstation-klublari',
      list_position: '2',
    },
    path: '/bakida-playstation-klublari',
  };
  assert.deepEqual(sanitizeMetaCapiInput(seoClick), seoClick);
  assert.equal(sanitizeMetaCapiInput({ ...seoClick, params: { ...seoClick.params, email: 'x@y.com' } }), null);
});

test('Meta CAPI server event carries dedupe ids without PII or client IP', () => {
  const input = sanitizeMetaCapiInput(validInput);
  assert.ok(input);
  const event = buildMetaCapiServerEvent(
    input,
    'https://gameyer.az',
    'Mozilla/5.0 test-agent',
    1_800_000_000,
  );

  assert.equal(event.event_id, validInput.eventId);
  assert.equal(event.event_name, 'Contact');
  assert.equal(event.event_source_url, 'https://gameyer.az/klub/test-club');
  assert.equal(event.action_source, 'website');
  assert.equal(event.user_data.client_user_agent, 'Mozilla/5.0 test-agent');
  assert.equal(event.user_data.fbp, validInput.fbp);
  assert.equal(event.user_data.fbc, validInput.fbc);
  assert.equal(Object.hasOwn(event.user_data, 'client_ip_address'), false);
  assert.equal(Object.hasOwn(event.user_data, 'em'), false);
  assert.equal(Object.hasOwn(event.user_data, 'ph'), false);
});
