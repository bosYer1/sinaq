import test from 'node:test';
import assert from 'node:assert/strict';
import { getMobileNavBottomOffset } from './mobileViewport.ts';

test('mobile nav viewport offset stays zero when layout and visual viewport match', () => {
  assert.equal(getMobileNavBottomOffset(844, 0, 844), 0);
});

test('mobile nav moves above an open keyboard when visual viewport is shorter', () => {
  assert.equal(getMobileNavBottomOffset(844, 0, 500), 344);
});

test('mobile nav can move downward when layout viewport is stale after keyboard closes', () => {
  assert.equal(getMobileNavBottomOffset(500, 0, 844), -344);
});

test('mobile nav includes visual viewport top offset in the alignment calculation', () => {
  assert.equal(getMobileNavBottomOffset(844, 44, 700), 100);
});

test('mobile nav ignores invalid viewport metrics', () => {
  assert.equal(getMobileNavBottomOffset(Number.NaN, 0, 844), 0);
  assert.equal(getMobileNavBottomOffset(844, Number.NaN, 844), 0);
  assert.equal(getMobileNavBottomOffset(844, 0, Number.NaN), 0);
});
