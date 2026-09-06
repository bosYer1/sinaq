import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { isPublicAnalyticsHostname } from './posthog.ts';

test('only canonical GameYer hosts are classified as public analytics traffic', () => {
  assert.equal(isPublicAnalyticsHostname('gameyer.az'), true);
  assert.equal(isPublicAnalyticsHostname('www.gameyer.az'), true);
  assert.equal(isPublicAnalyticsHostname(' GAMEYER.AZ '), true);

  assert.equal(isPublicAnalyticsHostname('localhost'), false);
  assert.equal(isPublicAnalyticsHostname('127.0.0.1'), false);
  assert.equal(isPublicAnalyticsHostname('::1'), false);
  assert.equal(isPublicAnalyticsHostname('sinaq-xi.vercel.app'), false);
  assert.equal(isPublicAnalyticsHostname('gameyer-git-test.vercel.app'), false);
  assert.equal(isPublicAnalyticsHostname(undefined), false);
});

test('PostHog automatic events drop non-canonical hosts before assigning public scope', () => {
  const source = readFileSync(
    new URL('../components/analytics/PostHogAnalytics.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /host!==['"]gameyer\.az['"]&&host!==['"]www\.gameyer\.az['"]\)return null/);
  assert.match(source, /props\.gameyer_traffic_scope=['"]public['"]/);
});
