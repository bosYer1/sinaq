import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getAnalyticsTrafficScope,
  isPublicAnalyticsHostname,
  isTestAnalyticsHostname,
} from './posthog.ts';

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

test('local and Vercel preview hosts are classified as analytics test hosts', () => {
  assert.equal(isTestAnalyticsHostname('localhost'), true);
  assert.equal(isTestAnalyticsHostname('127.0.0.1'), true);
  assert.equal(isTestAnalyticsHostname('::1'), true);
  assert.equal(isTestAnalyticsHostname('app.localhost'), true);
  assert.equal(isTestAnalyticsHostname('sinaq-xi.vercel.app'), true);
  assert.equal(isTestAnalyticsHostname('gameyer.az'), false);
  assert.equal(isTestAnalyticsHostname('example.com'), false);
});

test('analytics traffic scope never marks local or preview hosts as public', () => {
  assert.equal(getAnalyticsTrafficScope('gameyer.az'), 'public');
  assert.equal(getAnalyticsTrafficScope('www.gameyer.az'), 'public');
  assert.equal(getAnalyticsTrafficScope('localhost'), 'test');
  assert.equal(getAnalyticsTrafficScope('127.0.0.1'), 'test');
  assert.equal(getAnalyticsTrafficScope('::1'), 'test');
  assert.equal(getAnalyticsTrafficScope('app.localhost'), 'test');
  assert.equal(getAnalyticsTrafficScope('gameyer-git-test.vercel.app'), 'test');
  assert.equal(getAnalyticsTrafficScope('example.com'), null);
  assert.equal(getAnalyticsTrafficScope(undefined), null);
});

test('PostHog emission boundary remaps test hosts before assigning traffic scope', () => {
  const source = readFileSync(new URL('../components/analytics/PostHogAnalytics.tsx', import.meta.url), 'utf8');
  assert.match(source, /if\(!isPublicHost&&!isTestHost\)return null/);
  assert.match(source, /if\(isTestHost\)\{props\.gameyer_analytics_test=true;props\.gameyer_traffic_scope=['"]test['"];/);
  assert.match(source, /else\{[^}]*props\.gameyer_traffic_scope=['"]public['"]/);
});

test('PostHog normalizes only the known Meta an/paid attribution pair', () => {
  const source = readFileSync(new URL('../components/analytics/PostHogAnalytics.tsx', import.meta.url), 'utf8');
  assert.match(source, /params\.get\(['"]utm_source['"]\)===['"]an['"]&&params\.get\(['"]utm_medium['"]\)===['"]paid['"]/);
  assert.match(source, /props\.utm_source=['"]ig['"];props\.utm_medium=['"]paid_social['"]/);
  assert.match(source, /if\(utmSource===['"]an['"]&&utmMedium===['"]paid['"]\)\{utmSource=['"]ig['"];utmMedium=['"]paid_social['"];/);
});
