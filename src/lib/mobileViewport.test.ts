import test from 'node:test';
import assert from 'node:assert/strict';
import { getMobileNavVisualTop } from './mobileViewport.ts';

test('mobile nav aligns to the visual viewport bottom without layout viewport input', () => {
  assert.equal(getMobileNavVisualTop(0, 844, 68), 776);
});

test('mobile nav follows dynamic browser chrome offsets', () => {
  assert.equal(getMobileNavVisualTop(44, 700, 68), 676);
});

test('mobile nav follows the keyboard-resized visual viewport', () => {
  assert.equal(getMobileNavVisualTop(0, 500, 68), 432);
});

test('mobile nav never places its top above the visual viewport', () => {
  assert.equal(getMobileNavVisualTop(20, 60, 100), 20);
});

test('mobile nav ignores invalid visual viewport metrics', () => {
  assert.equal(getMobileNavVisualTop(Number.NaN, 844, 68), 0);
  assert.equal(getMobileNavVisualTop(0, Number.NaN, 68), 0);
  assert.equal(getMobileNavVisualTop(0, 844, Number.NaN), 0);
  assert.equal(getMobileNavVisualTop(0, 0, 68), 0);
});
