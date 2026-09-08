import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCeoSignals, metric, rate } from './calculations.ts';
import { acquisitionChannel, aggregateAcquisition, calculateCompleteness, normalizeCampaign, normalizeClubPerformance, numberValue } from './normalization.ts';
import { resolveDateRange } from './range.ts';
import type { PostHogMetrics, SupabaseMetrics } from './types.ts';

test('range presets include an equal previous comparison period', () => {
  const range = resolveDateRange('7d', undefined, undefined, new Date('2026-09-08T12:00:00.000Z'));
  assert.equal(Date.parse(range.to) - Date.parse(range.from), Date.parse(range.previousTo) - Date.parse(range.previousFrom));
});

test('invalid custom range fails safely to seven days', () => {
  assert.equal(resolveDateRange('custom', 'bad', '2026-09-08').preset, '7d');
});

test('metric and CTA rate never emit invalid numbers', () => {
  assert.deepEqual(metric(120, 100), { current: 120, previous: 100, changePercent: 20 });
  assert.equal(rate(5, 0), 0);
  assert.equal(numberValue('not-a-number'), 0);
});

test('campaign normalization preserves attribution and calculates intent', () => {
  const row = normalizeCampaign({ source: 'facebook', medium: 'paid_social', campaign: 'launch', visitors: '10', sessions: 12, pageviews: 20, club_views: 8, club_clicks: 6, cta_clicks: 2 });
  assert.equal(row.key, 'facebook|paid_social|launch');
  assert.equal(row.clubViewRate, 66.67);
  assert.equal(row.conversionRate, 16.67);
});

test('absent attribution is labeled without inventing a campaign', () => {
  const row = normalizeCampaign({ club_views: 0, cta_clicks: 0 });
  assert.equal(row.source, 'direct');
  assert.equal(row.campaign, '(kampaniyasız)');
});

test('acquisition groups paid and organic campaign rows without losing totals', () => {
  const paid = normalizeCampaign({ source: 'ig', medium: 'paid', campaign: 'one', visitors: 4, sessions: 5, club_views: 2, cta_clicks: 1 });
  const organic = normalizeCampaign({ source: 'google', medium: 'organic', campaign: '', visitors: 3, sessions: 3, club_views: 1, cta_clicks: 0 });
  const grouped = aggregateAcquisition([paid, organic]);
  assert.equal(acquisitionChannel('ig', 'paid'), 'Paid');
  assert.equal(grouped.find((row) => row.channel === 'Paid')?.sessions, 5);
  assert.equal(grouped.find((row) => row.channel === 'Organic')?.visitors, 3);
});

test('club intent combines only tracked contact actions', () => {
  const row = normalizeClubPerformance({ slug: 'arena', name: 'Arena', views: 10, phone_clicks: 1, instagram_clicks: 2, maps_clicks: 1 });
  assert.equal(row.intentRate, 40);
});

test('data quality handles null and relation-backed images', () => {
  const clubs = [{ id: 'a', phone: null, instagram_url: null, profile_image_url: null, latitude: null, longitude: null }, { id: 'b', phone: '123', instagram_url: 'https://instagram.com/b', profile_image_url: null, latitude: 40, longitude: 49 }];
  const result = calculateCompleteness(clubs, new Set(['b']), new Set(['b']));
  assert.deepEqual(result, { total: 2, missingImage: 1, missingPhone: 1, missingInstagram: 1, missingCoordinates: 1, missingType: 1 });
});

test('CEO signals expose provider unavailability instead of fake metrics', () => {
  const zero = metric(0, 0);
  const posthog = { status: { key: 'posthog', label: 'PostHog', status: 'unavailable', detail: 'config missing', checkedAt: '' }, pageviews: zero, visitors: zero, sessions: zero, clubViews: zero, clubClicks: zero, ctaClicks: zero, searchQueries: zero, filterChanges: zero, exploreViewChanges: zero, mapUsage: zero, phoneClicks: zero, instagramClicks: zero, mapsClicks: zero, returningUsers: 0, returningRate: 0, sessionsPerUser: 0, usersWithThreeSessions: 0, conversionRate: zero, acquisition: [], campaigns: [], clubs: [], trend: [], tracking: { latestEventAt: null, publicEvents: 0, testEvents: 0, missingSessionAttribution: 0, missingCampaignAttribution: 0, noResultSearches: 0, botEvents: 0, sourceMissingSessions: 0, attributionCompleteness: 0 }, funnel: { landingSessions: 0, discoverySessions: 0, clubViewSessions: 0, ctaSessions: 0 }, retention: { d1: null, d3: null, d7: null, cohortUsers: 0 } } as PostHogMetrics;
  const supabase = { status: { key: 'supabase', label: 'Supabase', status: 'ready', detail: '', checkedAt: '' }, activeClubs: 0, verifiedClubs: 0, pendingSubmissions: 0, staleSubmissions: 0, completeness: { total: 0, missingImage: 0, missingPhone: 0, missingInstagram: 0, missingCoordinates: 0, missingType: 0 } } as SupabaseMetrics;
  assert.equal(buildCeoSignals(posthog, supabase)[0].severity, 'critical');
});
