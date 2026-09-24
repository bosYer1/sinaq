import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMobileNavDocumentTop,
  getRealPageMaxTop,
  isIOSWebKit,
  isPhantomBottomScroll,
} from './mobileViewport.ts';

test('detects iPhone Chrome/Safari as iOS WebKit hosts', () => {
  assert.equal(isIOSWebKit('Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) CriOS/153 Mobile/15E148 Safari/604.1'), true);
  assert.equal(isIOSWebKit('Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) Version/26.0 Mobile/15E148 Safari/604.1'), true);
});

test('detects touch iPad desktop UA fallback', () => {
  assert.equal(isIOSWebKit('Mozilla/5.0 Macintosh', 'MacIntel', 5), true);
  assert.equal(isIOSWebKit('Mozilla/5.0 Macintosh', 'MacIntel', 0), false);
});

test('absolute mobile nav follows visual viewport in document coordinates', () => {
  assert.equal(getMobileNavDocumentTop(1200, 844, 68), 1976);
  assert.equal(getMobileNavDocumentTop(0, 500, 68), 432);
});

test('real page max top ignores browser-created bottom overflow', () => {
  assert.equal(getRealPageMaxTop(2200, 844), 1356);
  assert.equal(getRealPageMaxTop(600, 844), 0);
});

test('phantom scroll is detected only past real content end', () => {
  assert.equal(isPhantomBottomScroll(1500, 1356), true);
  assert.equal(isPhantomBottomScroll(1357, 1356), false);
  assert.equal(isPhantomBottomScroll(1359, 1356), true);
});
