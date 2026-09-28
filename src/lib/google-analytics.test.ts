import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGaBootstrap, createGaRouteTracker, isGaAnalyticsTestTraffic, normalizeGaMeasurementId } from './google-analytics.ts';

test('normalizes valid GA4 Measurement IDs and rejects invalid values', () => {
  assert.equal(normalizeGaMeasurementId(' g-gc6lnk1w6d '), 'G-GC6LNK1W6D');
  assert.equal(normalizeGaMeasurementId(undefined), null);
  assert.equal(normalizeGaMeasurementId('UA-12345-1'), null);
});

test('bootstrap initializes GA4 for normal traffic and guards the tagged analytics smoke', () => {
  const script = buildGaBootstrap('G-GC6LNK1W6D');
  assert.match(script, /__analytics_smoke/);
  assert.match(script, /gtag\('js',new Date\(\)\)/);
  assert.match(script, /gtag\('config','G-GC6LNK1W6D'/);
  assert.equal((script.match(/gtag\('config'/g) ?? []).length, 1);
});

test('analytics smoke marker is the only explicit GA4 test-traffic exclusion', () => {
  assert.equal(isGaAnalyticsTestTraffic('?__analytics_smoke=1'), true);
  assert.equal(isGaAnalyticsTestTraffic('?foo=1&__analytics_smoke=1'), true);
  assert.equal(isGaAnalyticsTestTraffic('?__analytics_smoke=0'), false);
  assert.equal(isGaAnalyticsTestTraffic('?foo=1'), false);
});

test('route tracker skips the initial route, duplicates, admin and API paths', () => {
  const shouldTrack = createGaRouteTracker('/');
  assert.equal(shouldTrack('/'), false);
  assert.equal(shouldTrack('/klub/test'), true);
  assert.equal(shouldTrack('/klub/test'), false);
  assert.equal(shouldTrack('/admin'), false);
  assert.equal(shouldTrack('/api/health'), false);
  assert.equal(shouldTrack('/bakida-pc-klublari'), true);
});
