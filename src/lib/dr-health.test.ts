import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyPublicClubRead } from './dr-health.ts';

test('public club health requires at least one readable active club', () => {
  assert.equal(classifyPublicClubRead([{ id: 'club-id' }], null), 'ok');
  assert.equal(classifyPublicClubRead([], null), 'empty');
  assert.equal(classifyPublicClubRead(null, null), 'empty');
});

test('public club health reports query failures without exposing the error', () => {
  assert.equal(classifyPublicClubRead(null, new Error('sensitive detail')), 'error');
});
