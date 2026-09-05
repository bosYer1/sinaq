import assert from 'node:assert/strict';
import test from 'node:test';
import { isCloudflareStandby } from './cloudflare-standby.ts';

test('standby mode is enabled only by an explicit 1 value', () => {
  assert.equal(isCloudflareStandby('1'), true);
  assert.equal(isCloudflareStandby(' 1 '), true);
  assert.equal(isCloudflareStandby(undefined), false);
  assert.equal(isCloudflareStandby('0'), false);
  assert.equal(isCloudflareStandby('true'), false);
});
