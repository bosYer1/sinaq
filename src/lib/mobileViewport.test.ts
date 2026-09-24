import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMobileNavDocumentTop,
  getRealLayoutMaxScrollTop,
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

test('real layout max scroll accounts for visual viewport browser chrome offset', () => {
  assert.equal(getRealLayoutMaxScrollTop(2200, 0, 844), 1356);
  assert.equal(getRealLayoutMaxScrollTop(2200, 44, 700), 1456);
  assert.equal(getRealLayoutMaxScrollTop(600, 44, 700), 0);
});

test('phantom scroll ignores normal visual viewport toolbar offset', () => {
  assert.equal(isPhantomBottomScroll(1456, 1456), false);
  assert.equal(isPhantomBottomScroll(1457, 1456), false);
  assert.equal(isPhantomBottomScroll(1459, 1456), true);
});
