import assert from 'node:assert/strict';
import test from 'node:test';
import { getDatabaseHealth } from './health.ts';

test('health database probe is healthy when at least one active club exists', async () => {
  const status = await getDatabaseHealth(async () => ({
    data: [{ id: 'club-1' }],
    error: null,
  }));

  assert.equal(status, 'ok');
});

test('health database probe fails closed on Supabase error', async () => {
  const status = await getDatabaseHealth(async () => ({
    data: null,
    error: new Error('supabase error'),
  }));

  assert.equal(status, 'error');
});

test('health database probe fails closed on empty active-club result', async () => {
  const status = await getDatabaseHealth(async () => ({
    data: [],
    error: null,
  }));

  assert.equal(status, 'error');
});

test('health database probe reports unavailable when dependency throws', async () => {
  const status = await getDatabaseHealth(async () => {
    throw new Error('dependency unavailable');
  });

  assert.equal(status, 'unavailable');
});
