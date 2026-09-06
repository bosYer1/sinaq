import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isCloudflareAuthoritative,
  isDnsNameWithinZone,
  isFastFailoverTtlReady,
  isValidDnsZone,
  normalizeDnsName,
} from './dr-dns.ts';

test('DNS snapshot names stay inside the requested zone', () => {
  assert.equal(normalizeDnsName('WWW.GameYer.az...'), 'www.gameyer.az');
  assert.equal(isValidDnsZone('gameyer.az'), true);
  assert.equal(isValidDnsZone('_invalid.gameyer.az'), false);
  assert.equal(isValidDnsZone('localhost'), false);
  assert.equal(isDnsNameWithinZone('www.gameyer.az', 'gameyer.az'), true);
  assert.equal(isDnsNameWithinZone('_dmarc.gameyer.az', 'gameyer.az'), true);
  assert.equal(isDnsNameWithinZone('bad label.gameyer.az', 'gameyer.az'), false);
  assert.equal(isDnsNameWithinZone('gameyer.az.example.com', 'gameyer.az'), false);
});

test('Cloudflare authority requires at least two Cloudflare nameservers', () => {
  assert.equal(isCloudflareAuthoritative(['ada.ns.cloudflare.com.', 'bob.ns.cloudflare.com.']), true);
  assert.equal(isCloudflareAuthoritative(['ns1.vercel-dns.com', 'ns2.vercel-dns.com']), false);
  assert.equal(isCloudflareAuthoritative(['ada.ns.cloudflare.com']), false);
});

test('fast failover TTL requires every observed web record at 60 seconds or less', () => {
  assert.equal(isFastFailoverTtlReady([60, 60]), true);
  assert.equal(isFastFailoverTtlReady([60, 300]), false);
  assert.equal(isFastFailoverTtlReady([]), false);
});
