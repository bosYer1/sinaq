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
  const row = normalizeCampaign({ source: 'facebook', medium: 'paid_social', campaign: 'launch', visitors: '10', sessions: 12, pageviews: 20, club_views: 8, club_view_sessions: 6, club_clicks: 6, cta_clicks: 4, cta_sessions: 2 });
  assert.equal(row.key, 'facebook|paid_social|launch');
  assert.equal(row.ctaClicks, 4);
  assert.equal(row.ctaSessions, 2);
  assert.equal(row.clubViewRate, 50);
  assert.equal(row.conversionRate, 16.67);
});

test('absent attribution is labeled without inventing a campaign', () => {
  const row = normalizeCampaign({ club_views: 0, cta_clicks: 0 });
  assert.equal(row.source, 'direct');
  assert.equal(row.campaign, '(kampaniyasız)');
});

test('acquisition groups paid and organic campaign rows without losing totals', () => {
  const paid = normalizeCampaign({ source: 'ig', medium: 'paid', campaign: 'one', visitors: 4, sessions: 5, club_views: 3, club_view_sessions: 2, cta_clicks: 3, cta_sessions: 1 });
  const organic = normalizeCampaign({ source: 'google', medium: 'organic', campaign: '', visitors: 3, sessions: 3, club_views: 1, club_view_sessions: 1, cta_clicks: 0, cta_sessions: 0 });
  const grouped = aggregateAcquisition([paid, organic]);
  assert.equal(acquisitionChannel('ig', 'paid'), 'Paid');
  assert.equal(grouped.find((row) => row.channel === 'Paid')?.sessions, 5);
  assert.equal(grouped.find((row) => row.channel === 'Organic')?.visitors, 3);
  assert.equal(grouped.find((row) => row.channel === 'Paid')?.ctaRate, 20);
});

test('club intent combines only tracked contact actions', () => {
  const row = normalizeClubPerformance({ slug: 'arena', name: 'Arena', views: 10, view_sessions: 5, phone_clicks: 2, instagram_clicks: 2, tiktok_clicks: 2, maps_clicks: 2, whatsapp_booking_clicks: 2, intent_sessions: 2 });
  assert.equal(row.phoneClicks + row.instagramClicks + row.tiktokClicks + row.mapsClicks + row.whatsappBookingClicks, 10);
  assert.equal(row.intentSessions, 2);
  assert.equal(row.intentRate, 40);
});

test('data quality handles null and relation-backed images', () => {
  const clubs = [{ id: 'a', phone: null, instagram_url: null, tiktok_url: null, profile_image_url: null, latitude: null, longitude: null }, { id: 'b', phone: '123', instagram_url: null, tiktok_url: 'https://www.tiktok.com/@bclub', profile_image_url: null, latitude: 40, longitude: 49 }];
  const result = calculateCompleteness(clubs, new Set(['b']), new Set(['b']));
  assert.deepEqual(result, { total: 2, missingImage: 1, missingPhone: 1, missingSocial: 1, missingCoordinates: 1, missingType: 1 });
});

test('CEO signals expose provider unavailability instead of fake metrics', () => {
  const zero = metric(0, 0);
  const posthog: PostHogMetrics = {
    status: { key: 'posthog', label: 'PostHog', status: 'unavailable', detail: 'config missing', checkedAt: '' },
    pageviews: zero,
    visitors: zero,
    sessions: zero,
    clubViews: zero,
    clubClicks: zero,
    ctaClicks: zero,
    intentSessions: zero,
    searchQueries: zero,
    filterChanges: zero,
    exploreViewChanges: zero,
    mapUsage: zero,
    phoneClicks: zero,
    instagramClicks: zero,
    tiktokClicks: zero,
    mapsClicks: zero,
    whatsappBookingClicks: zero,
    newUsers: 0,
    returningUsers: 0,
    returningRate: 0,
    sessionsPerUser: 0,
    usersWithThreeSessions: 0,
    conversionRate: zero,
    acquisition: [],
    campaigns: [],
    clubs: [],
    trend: [],
    tracking: { latestEventAt: null, publicEvents: 0, testEvents: 0, missingSessionAttribution: 0, missingCampaignAttribution: 0, noResultSearches: 0, botEvents: 0, sourceMissingSessions: 0, attributionCompleteness: 0 },
    funnel: { landingSessions: 0, discoverySessions: 0, clubViewSessions: 0, ctaSessions: 0, profileToLeadRate: 0, integrityOk: true },
    retention: { d1: null, d3: null, d7: null, d1CohortUsers: 0, d3CohortUsers: 0, d7CohortUsers: 0, cohortUsers: 0 },
    pwa: { installAvailable: 0, installed: 0, standaloneOpened: 0 },
    returnLoop: { updateImpressions: 0, updateDetailClicks: 0, updateClubClicks: 0, updateSourceClicks: 0, updateUsers: 0, updateSessions: 0, downstreamClubViewSessions: 0, downstreamCtaSessions: 0, returningUpdateUsers: 0, returningUpdateRate: 0, clubViewReachRate: 0, ctaReachRate: 0 },
    supplyFunnel: { ownerClaimViews: 0, newClubViews: 0, correctionViews: 0, ownerClaimStarts: 0, ownerClaimAttempts: 0, ownerClaimSent: 0, newClubSent: 0, correctionSent: 0, ownerClaimErrors: 0, ownerClaimRateLimited: 0, startRate: 0, submitRate: 0 },
    discoveryQuality: { searchSessions: 0, zeroResultSearchSessions: 0, zeroResultRate: 0, filterSessions: 0, filterAdoptionRate: 0, mapSessions: 0, mapAdoptionRate: 0, clubImpressionSessions: 0, clubClickSessions: 0, clubCtr: 0 },
    webVitals: { lcpP75: null, lcpSamples: 0, inpP75: null, inpSamples: 0, clsP75: null, clsSamples: 0 },
  };
  const supabase: SupabaseMetrics = {
    status: { key: 'supabase', label: 'Supabase', status: 'ready', detail: '', checkedAt: '' },
    activeClubs: 0,
    verifiedClubs: 0,
    pendingSubmissions: 0,
    staleSubmissions: 0,
    submissionBacklogByKind: { ownerClaim: 0, newClub: 0, correction: 0 },
    completeness: { total: 0, missingImage: 0, missingPhone: 0, missingSocial: 0, missingCoordinates: 0, missingType: 0 },
    qualityBacklog: [],
    firstPartyIntent: { available: true, detail: 'test', events: 0, browserVisitors: 0, phoneClicks: 0, instagramClicks: 0, mapsClicks: 0 },
  };
  assert.equal(buildCeoSignals(posthog, supabase)[0].severity, 'critical');
});

test('CEO signals surface open supply queues without treating them as verified inventory', () => {
  const zero = metric(0, 0);
  const posthog = {
    status: { key: 'posthog', label: 'PostHog', status: 'ready', detail: '', checkedAt: '' }, pageviews: zero, visitors: zero, sessions: zero, clubViews: zero, clubClicks: zero, ctaClicks: zero, intentSessions: zero, searchQueries: zero, filterChanges: zero, exploreViewChanges: zero, mapUsage: zero, phoneClicks: zero, instagramClicks: zero, tiktokClicks: zero, mapsClicks: zero, whatsappBookingClicks: zero, newUsers: 0, returningUsers: 0, returningRate: 0, sessionsPerUser: 0, usersWithThreeSessions: 0, conversionRate: zero, acquisition: [], campaigns: [], clubs: [], trend: [], tracking: { latestEventAt: new Date().toISOString(), publicEvents: 0, testEvents: 0, missingSessionAttribution: 0, missingCampaignAttribution: 0, noResultSearches: 0, botEvents: 0, sourceMissingSessions: 0, attributionCompleteness: 100 }, funnel: { landingSessions: 0, discoverySessions: 0, clubViewSessions: 0, ctaSessions: 0, profileToLeadRate: 0, integrityOk: true }, retention: { d1: null, d3: null, d7: null, d1CohortUsers: 0, d3CohortUsers: 0, d7CohortUsers: 0, cohortUsers: 0 }, pwa: { installAvailable: 0, installed: 0, standaloneOpened: 0 }, returnLoop: { updateImpressions: 0, updateDetailClicks: 0, updateClubClicks: 0, updateSourceClicks: 0, updateUsers: 0, updateSessions: 0, downstreamClubViewSessions: 0, downstreamCtaSessions: 0, returningUpdateUsers: 0, returningUpdateRate: 0, clubViewReachRate: 0, ctaReachRate: 0 }, supplyFunnel: { ownerClaimViews: 0, newClubViews: 0, correctionViews: 0, ownerClaimStarts: 0, ownerClaimAttempts: 0, ownerClaimSent: 0, newClubSent: 0, correctionSent: 0, ownerClaimErrors: 0, ownerClaimRateLimited: 0, startRate: 0, submitRate: 0 }, discoveryQuality: { searchSessions: 0, zeroResultSearchSessions: 0, zeroResultRate: 0, filterSessions: 0, filterAdoptionRate: 0, mapSessions: 0, mapAdoptionRate: 0, clubImpressionSessions: 0, clubClickSessions: 0, clubCtr: 0 }, webVitals: { lcpP75: null, lcpSamples: 0, inpP75: null, inpSamples: 0, clsP75: null, clsSamples: 0 },
  } satisfies PostHogMetrics;
  const supabase: SupabaseMetrics = { status: { key: 'supabase', label: 'Supabase', status: 'ready', detail: '', checkedAt: '' }, activeClubs: 0, verifiedClubs: 0, pendingSubmissions: 3, staleSubmissions: 0, submissionBacklogByKind: { ownerClaim: 1, newClub: 1, correction: 1 }, completeness: { total: 0, missingImage: 0, missingPhone: 0, missingSocial: 0, missingCoordinates: 0, missingType: 0 }, qualityBacklog: [], firstPartyIntent: { available: true, detail: 'test', events: 0, browserVisitors: 0, phoneClicks: 0, instagramClicks: 0, mapsClicks: 0 } };
  const titles = buildCeoSignals(posthog, supabase).map((signal) => signal.title);
  assert.ok(titles.includes('Klub sahibi müraciəti gözləyir'));
  assert.ok(titles.includes('Yeni klub təklifləri növbədədir'));
  assert.ok(titles.includes('Klub data düzəlişləri növbədədir'));
});


test('CEO signal cap never hides a later critical signal behind lower-severity noise', () => {
  const zero = metric(0, 0);
  const posthog = {
    status: { key: 'posthog', label: 'PostHog', status: 'ready', detail: '', checkedAt: '' },
    pageviews: zero, visitors: metric(25, 20), sessions: metric(25, 20), clubViews: zero, clubClicks: zero,
    ctaClicks: metric(25, 10), intentSessions: metric(8, 4), searchQueries: metric(10, 0), filterChanges: zero, exploreViewChanges: zero,
    mapUsage: zero, phoneClicks: zero, instagramClicks: zero, tiktokClicks: zero, mapsClicks: zero, whatsappBookingClicks: zero, newUsers: 25,
    returningUsers: 0, returningRate: 0, sessionsPerUser: 1, usersWithThreeSessions: 0, conversionRate: zero,
    acquisition: [], campaigns: [{ key: 'a', source: 'x', medium: 'paid', campaign: 'a', visitors: 8, sessions: 8, pageviews: 8, clubViews: 0, clubViewSessions: 0, clubClicks: 0, ctaClicks: 0, ctaSessions: 0, returningUsers: 0, sessionsPerUser: 1, clubViewRate: 0, conversionRate: 0 }, { key: 'b', source: 'x', medium: 'paid', campaign: 'b', visitors: 2, sessions: 2, pageviews: 2, clubViews: 0, clubViewSessions: 0, clubClicks: 0, ctaClicks: 0, ctaSessions: 0, returningUsers: 0, sessionsPerUser: 1, clubViewRate: 0, conversionRate: 0 }],
    clubs: [], trend: [],
    tracking: { latestEventAt: new Date().toISOString(), publicEvents: 25, testEvents: 0, missingSessionAttribution: 0, missingCampaignAttribution: 0, noResultSearches: 5, botEvents: 0, sourceMissingSessions: 10, attributionCompleteness: 60 },
    funnel: { landingSessions: 25, discoverySessions: 0, clubViewSessions: 0, ctaSessions: 0, profileToLeadRate: 0, integrityOk: true },
    retention: { d1: null, d3: null, d7: null, d1CohortUsers: 0, d3CohortUsers: 0, d7CohortUsers: 0, cohortUsers: 0 },
    pwa: { installAvailable: 0, installed: 0, standaloneOpened: 0 },
    returnLoop: { updateImpressions: 0, updateDetailClicks: 0, updateClubClicks: 0, updateSourceClicks: 0, updateUsers: 0, updateSessions: 0, downstreamClubViewSessions: 0, downstreamCtaSessions: 0, returningUpdateUsers: 0, returningUpdateRate: 0, clubViewReachRate: 0, ctaReachRate: 0 },
    supplyFunnel: { ownerClaimViews: 0, newClubViews: 0, correctionViews: 0, ownerClaimStarts: 0, ownerClaimAttempts: 0, ownerClaimSent: 0, newClubSent: 0, correctionSent: 0, ownerClaimErrors: 0, ownerClaimRateLimited: 0, startRate: 0, submitRate: 0 },
    discoveryQuality: { searchSessions: 0, zeroResultSearchSessions: 0, zeroResultRate: 0, filterSessions: 0, filterAdoptionRate: 0, mapSessions: 0, mapAdoptionRate: 0, clubImpressionSessions: 0, clubClickSessions: 0, clubCtr: 0 },
    webVitals: { lcpP75: null, lcpSamples: 0, inpP75: null, inpSamples: 0, clsP75: null, clsSamples: 0 },
  } satisfies PostHogMetrics;
  const supabase: SupabaseMetrics = {
    status: { key: 'supabase', label: 'Supabase', status: 'ready', detail: '', checkedAt: '' },
    activeClubs: 1, verifiedClubs: 1, pendingSubmissions: 4, staleSubmissions: 1,
    submissionBacklogByKind: { ownerClaim: 1, newClub: 1, correction: 1 },
    completeness: { total: 1, missingImage: 1, missingPhone: 1, missingSocial: 0, missingCoordinates: 1, missingType: 0 },
    qualityBacklog: [],
    firstPartyIntent: { available: true, detail: 'test', events: 0, browserVisitors: 0, phoneClicks: 0, instagramClicks: 0, mapsClicks: 0 },
  };
  const signals = buildCeoSignals(posthog, supabase);
  assert.equal(signals.length, 6);
  assert.equal(signals[0].title, 'Gecikmiş müraciətlər var');
  assert.equal(signals[0].severity, 'critical');
});
