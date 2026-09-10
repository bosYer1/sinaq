import assert from 'node:assert/strict';
import test from 'node:test';
import { guardPublicPost } from './publicRequestGuard.ts';

test('identity churn stays bounded and expired buckets are reclaimed on new requests', () => {
  const realNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  const buckets = (globalThis as typeof globalThis & {
    __gameyerPublicRateBuckets: Map<string, unknown>;
  }).__gameyerPublicRateBuckets;
  const options = { keyPrefix: 'test', limit: 1, windowMs: 60_000 };
  const request = (ip: string) => new Request('https://gameyer.az/api/client-error', {
    method: 'POST', headers: { origin: 'https://gameyer.az', 'x-forwarded-for': ip },
  });
  try {
    buckets.clear();
    for (let i = 0; i < 1000; i++) assert.equal(guardPublicPost(request(String(i)), options).ok, true);
    for (let i = 1000; i < 1100; i++) assert.equal(guardPublicPost(request(String(i)), options).status, 429);
    assert.equal(buckets.size, 1000);
    assert.equal(guardPublicPost(request('0'), options).status, 429);
    now += 60_000;
    assert.equal(guardPublicPost(request('new'), options).ok, true);
    assert.equal(buckets.size, 1);
  } finally {
    Date.now = realNow;
    buckets.clear();
  }
});

test('cleanup preserves longer active windows across API routes', () => {
  const realNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  const buckets = (globalThis as typeof globalThis & {
    __gameyerPublicRateBuckets: Map<string, unknown>;
  }).__gameyerPublicRateBuckets;
  const request = new Request('https://gameyer.az/api/analytics/event', {
    method: 'POST', headers: { origin: 'https://gameyer.az' },
  });
  try {
    buckets.clear();
    guardPublicPost(request, { keyPrefix: 'long', limit: 1, windowMs: 300_000 });
    for (let i = 0; i < 999; i++) guardPublicPost(request, { keyPrefix: `short-${i}`, limit: 1, windowMs: 60_000 });
    now += 60_000;
    assert.equal(guardPublicPost(request, { keyPrefix: 'new', limit: 1, windowMs: 60_000 }).ok, true);
    assert.equal(guardPublicPost(request, { keyPrefix: 'long', limit: 1, windowMs: 300_000 }).status, 429);
    assert.equal(buckets.size, 2);
  } finally {
    Date.now = realNow;
    buckets.clear();
  }
});
