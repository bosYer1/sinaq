import 'server-only';

import { unstable_cache } from 'next/cache';
import { metric, rate } from './calculations';
import { aggregateAcquisition, normalizeCampaign, normalizeClubPerformance, numberValue, stringValue } from './normalization';
import { providerStatus } from './providers';
import type { DateRange, PostHogMetrics, TrendPoint } from './types';

type HogQLResponse = { columns?: string[]; results?: unknown[][] };
type Row = Record<string, unknown>;

const ALLOWED_HOSTS = new Set(['https://us.posthog.com', 'https://eu.posthog.com']);

function emptyMetrics(detail: string, status: 'unavailable' | 'error'): PostHogMetrics {
  const zero = metric(0, 0);
  return {
    status: providerStatus('posthog', status, detail),
    pageviews: zero, visitors: zero, sessions: zero, clubViews: zero, clubClicks: zero,
    ctaClicks: zero, searchQueries: zero, filterChanges: zero, exploreViewChanges: zero,
    mapUsage: zero, phoneClicks: zero, instagramClicks: zero, mapsClicks: zero,
    returningUsers: 0, returningRate: 0, sessionsPerUser: 0, usersWithThreeSessions: 0,
    conversionRate: zero, acquisition: [], campaigns: [], clubs: [], trend: [],
    tracking: { latestEventAt: null, publicEvents: 0, testEvents: 0, missingSessionAttribution: 0, missingCampaignAttribution: 0, noResultSearches: 0, botEvents: 0, sourceMissingSessions: 0, attributionCompleteness: 0 },
    funnel: { landingSessions: 0, discoverySessions: 0, clubViewSessions: 0, ctaSessions: 0 },
    retention: { d1: null, d3: null, d7: null, cohortUsers: 0 },
  };
}

function safeIso(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error('Yanlış tarix intervalı.');
  return parsed.toISOString().replace(/'/g, '');
}

function rows(response: HogQLResponse): Row[] {
  if (!Array.isArray(response.columns) || !Array.isArray(response.results)) return [];
  return response.results.map((values) => Object.fromEntries(response.columns!.map((column, index) => [column, values[index]])));
}

async function queryHogQL(host: string, projectId: string, apiKey: string, query: string): Promise<Row[]> {
  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`PostHog sorğusu ${response.status} statusu qaytardı.`);
  return rows(await response.json() as HogQLResponse);
}

function periodClause(range: DateRange) {
  const from = safeIso(range.from);
  const to = safeIso(range.to);
  const previousFrom = safeIso(range.previousFrom);
  return { from, to, previousFrom };
}

async function fetchPostHogMetrics(range: DateRange): Promise<PostHogMetrics> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
  const host = (process.env.POSTHOG_API_HOST?.trim() || 'https://us.posthog.com').replace(/\/$/, '');
  if (!apiKey || !projectId) return emptyMetrics('POSTHOG_PERSONAL_API_KEY və ya POSTHOG_PROJECT_ID yoxdur.', 'unavailable');
  if (!/^\d+$/.test(projectId) || !ALLOWED_HOSTS.has(host)) return emptyMetrics('PostHog project ID və ya API host təhlükəsiz deyil.', 'error');

  const { from, to, previousFrom } = periodClause(range);
  const publicScope = "properties.gameyer_traffic_scope = 'public'";
  try {
    const [overviewRows, campaignRows, clubRows, trendRows, healthRows, retentionRows, funnelRows, cohortRows] = await Promise.all([
      queryHogQL(host, projectId, apiKey, `SELECT if(timestamp >= toDateTime('${from}'), 'current', 'previous') AS period, countIf(event = '$pageview') AS pageviews, uniqIf(person_id, event = '$pageview') AS visitors, uniqIf(properties.$session_id, event = '$pageview') AS sessions, countIf(event = 'club_view') AS club_views, countIf(event = 'club_card_click') AS club_clicks, countIf(event = 'phone_click') AS phone_clicks, countIf(event = 'instagram_click') AS instagram_clicks, countIf(event = 'maps_click') AS maps_clicks, countIf(event IN ('map_location_clicked','location_sort_clicked')) AS map_usage, countIf(event = 'search_query') AS searches, countIf(event = 'filter_changed') AS filters, countIf(event = 'explore_view_changed') AS explore_changes FROM events WHERE timestamp >= toDateTime('${previousFrom}') AND timestamp < toDateTime('${to}') AND ${publicScope} GROUP BY period`),
      queryHogQL(host, projectId, apiKey, `SELECT source, medium, campaign, count() AS visitors, sum(person_sessions) AS sessions, countIf(person_id IN (SELECT person_id FROM events WHERE timestamp >= toDateTime('${from}') - INTERVAL 365 DAY AND timestamp < toDateTime('${from}') AND ${publicScope} AND event = '$pageview' GROUP BY person_id)) AS returning_users, sum(pageviews) AS pageviews, sum(club_views) AS club_views, sum(club_clicks) AS club_clicks, sum(cta_clicks) AS cta_clicks FROM (SELECT coalesce(nullIf(properties.gameyer_first_utm_source, ''), if(notEmpty(properties.gameyer_first_fbclid), 'facebook', 'direct')) AS source, coalesce(nullIf(properties.gameyer_first_utm_medium, ''), '—') AS medium, coalesce(nullIf(properties.gameyer_first_utm_campaign, ''), '(kampaniyasız)') AS campaign, person_id, uniq(properties.$session_id) AS person_sessions, countIf(event = '$pageview') AS pageviews, countIf(event = 'club_view') AS club_views, countIf(event = 'club_card_click') AS club_clicks, countIf(event IN ('phone_click','instagram_click','maps_click')) AS cta_clicks FROM events WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}') AND ${publicScope} GROUP BY source, medium, campaign, person_id) GROUP BY source, medium, campaign ORDER BY cta_clicks DESC, visitors DESC LIMIT 20`),
      queryHogQL(host, projectId, apiKey, `SELECT coalesce(nullIf(properties.club_slug, ''), '(slug yoxdur)') AS slug, coalesce(nullIf(properties.club_name, ''), slug) AS name, coalesce(nullIf(anyIf(properties.district, notEmpty(properties.district)), ''), 'Məlum deyil') AS district, countIf(event = 'club_impression') AS impressions, countIf(event = 'club_view') AS views, countIf(event = 'club_card_click') AS card_clicks, countIf(event = 'phone_click') AS phone_clicks, countIf(event = 'instagram_click') AS instagram_clicks, countIf(event = 'maps_click') AS maps_clicks FROM events WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}') AND ${publicScope} AND event IN ('club_impression','club_view','club_card_click','phone_click','instagram_click','maps_click') GROUP BY slug, name ORDER BY views DESC, card_clicks DESC LIMIT 20`),
      queryHogQL(host, projectId, apiKey, `SELECT toString(toDate(timestamp)) AS date, countIf(event = '$pageview') AS pageviews, uniqIf(person_id, event = '$pageview') AS visitors, countIf(event IN ('phone_click','instagram_click','maps_click')) AS cta_clicks FROM events WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}') AND ${publicScope} GROUP BY date ORDER BY date`),
      queryHogQL(host, projectId, apiKey, `SELECT maxIf(timestamp, ${publicScope}) AS latest_event_at, countIf(${publicScope}) AS public_events, countIf(properties.gameyer_traffic_scope = 'test') AS test_events, uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview' AND empty(properties.gameyer_session_landing_path)) AS missing_session, uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview' AND (notEmpty(properties.gameyer_first_fbclid) OR notEmpty(properties.gameyer_session_fbclid) OR notEmpty(properties.fbclid)) AND empty(properties.gameyer_first_utm_campaign) AND empty(properties.gameyer_session_utm_campaign) AND empty(properties.utm_campaign)) AS missing_campaign, countIf(${publicScope} AND event = 'search_query' AND properties.no_results = true) AS no_result_searches, countIf(${publicScope} AND properties.$virt_is_bot = true) AS bot_events, uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview' AND empty(properties.gameyer_first_referrer) AND empty(properties.gameyer_session_referrer) AND empty(properties.gameyer_first_utm_source) AND empty(properties.gameyer_session_utm_source) AND empty(properties.utm_source) AND empty(properties.gameyer_first_fbclid) AND empty(properties.gameyer_session_fbclid) AND empty(properties.fbclid)) AS source_missing_sessions, uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview') AS public_pageview_sessions FROM events WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}')`),
      queryHogQL(host, projectId, apiKey, `SELECT count() AS users, countIf(first_seen < toDateTime('${from}')) AS returning_users, countIf(current_sessions >= 3) AS three_session_users, round(avg(current_sessions), 2) AS sessions_per_user FROM (SELECT person_id, min(timestamp) AS first_seen, uniqIf(properties.$session_id, timestamp >= toDateTime('${from}')) AS current_sessions FROM events WHERE timestamp >= toDateTime('${from}') - INTERVAL 365 DAY AND timestamp < toDateTime('${to}') AND ${publicScope} AND event = '$pageview' GROUP BY person_id) WHERE current_sessions > 0`),
      queryHogQL(host, projectId, apiKey, `SELECT uniqIf(properties.$session_id, event = '$pageview') AS landing_sessions, uniqIf(properties.$session_id, event IN ('club_card_click','club_view')) AS discovery_sessions, uniqIf(properties.$session_id, event = 'club_view') AS club_view_sessions, uniqIf(properties.$session_id, event IN ('phone_click','instagram_click','maps_click')) AS cta_sessions FROM events WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}') AND ${publicScope}`),
      queryHogQL(host, projectId, apiKey, `SELECT count() AS cohort_users, countIf(has(active_days, addDays(first_day, 1))) AS d1_users, countIf(has(active_days, addDays(first_day, 3))) AS d3_users, countIf(has(active_days, addDays(first_day, 7))) AS d7_users FROM (SELECT person_id, min(toDate(timestamp)) AS first_day, groupUniqArray(toDate(timestamp)) AS active_days FROM events WHERE timestamp >= toDateTime('${previousFrom}') - INTERVAL 90 DAY AND timestamp < toDateTime('${to}') AND ${publicScope} AND event = '$pageview' GROUP BY person_id) WHERE first_day >= toDate(toDateTime('${from}')) AND first_day < addDays(toDate(toDateTime('${to}')), -7)`),
    ]);

    const current = overviewRows.find((row) => row.period === 'current') ?? {};
    const previous = overviewRows.find((row) => row.period === 'previous') ?? {};
    const currentCta = numberValue(current.cta_clicks);
    const previousCta = numberValue(previous.cta_clicks);
    const currentViews = numberValue(current.club_views);
    const previousViews = numberValue(previous.club_views);
    const health = healthRows[0] ?? {};
    const retention = retentionRows[0] ?? {};
    const funnel = funnelRows[0] ?? {};
    const cohort = cohortRows[0] ?? {};

    const campaigns = campaignRows.map(normalizeCampaign);
    const clubs = clubRows.map(normalizeClubPerformance);
    const trend: TrendPoint[] = trendRows.map((row) => ({ date: stringValue(row.date), pageviews: numberValue(row.pageviews), visitors: numberValue(row.visitors), ctaClicks: numberValue(row.cta_clicks) }));
    const publicPageviewSessions = numberValue(health.public_pageview_sessions);
    const missingSessionAttribution = numberValue(health.missing_session);

    return {
      status: providerStatus('posthog', 'ready', 'Real public event datası server-side PostHog API-dən oxundu.'),
      pageviews: metric(numberValue(current.pageviews), numberValue(previous.pageviews)),
      visitors: metric(numberValue(current.visitors), numberValue(previous.visitors)),
      sessions: metric(numberValue(current.sessions), numberValue(previous.sessions)),
      clubViews: metric(currentViews, previousViews),
      clubClicks: metric(numberValue(current.club_clicks), numberValue(previous.club_clicks)),
      ctaClicks: metric(currentCta, previousCta),
      phoneClicks: metric(numberValue(current.phone_clicks), numberValue(previous.phone_clicks)),
      instagramClicks: metric(numberValue(current.instagram_clicks), numberValue(previous.instagram_clicks)),
      mapsClicks: metric(numberValue(current.maps_clicks), numberValue(previous.maps_clicks)),
      mapUsage: metric(numberValue(current.map_usage), numberValue(previous.map_usage)),
      searchQueries: metric(numberValue(current.searches), numberValue(previous.searches)),
      filterChanges: metric(numberValue(current.filters), numberValue(previous.filters)),
      exploreViewChanges: metric(numberValue(current.explore_changes), numberValue(previous.explore_changes)),
      returningUsers: numberValue(retention.returning_users),
      returningRate: rate(numberValue(retention.returning_users), numberValue(retention.users)),
      sessionsPerUser: numberValue(retention.sessions_per_user),
      usersWithThreeSessions: numberValue(retention.three_session_users),
      conversionRate: metric(rate(currentCta, currentViews), rate(previousCta, previousViews)),
      acquisition: aggregateAcquisition(campaigns), campaigns, clubs, trend,
      tracking: { latestEventAt: typeof health.latest_event_at === 'string' ? health.latest_event_at : null, publicEvents: numberValue(health.public_events), testEvents: numberValue(health.test_events), missingSessionAttribution, missingCampaignAttribution: numberValue(health.missing_campaign), noResultSearches: numberValue(health.no_result_searches), botEvents: numberValue(health.bot_events), sourceMissingSessions: numberValue(health.source_missing_sessions), attributionCompleteness: rate(publicPageviewSessions - missingSessionAttribution, publicPageviewSessions) },
      funnel: { landingSessions: numberValue(funnel.landing_sessions), discoverySessions: numberValue(funnel.discovery_sessions), clubViewSessions: numberValue(funnel.club_view_sessions), ctaSessions: numberValue(funnel.cta_sessions) },
      retention: { d1: numberValue(cohort.cohort_users) > 0 ? rate(numberValue(cohort.d1_users), numberValue(cohort.cohort_users)) : null, d3: numberValue(cohort.cohort_users) > 0 ? rate(numberValue(cohort.d3_users), numberValue(cohort.cohort_users)) : null, d7: numberValue(cohort.cohort_users) > 0 ? rate(numberValue(cohort.d7_users), numberValue(cohort.cohort_users)) : null, cohortUsers: numberValue(cohort.cohort_users) },
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'PostHog sorğusu uğursuz oldu.';
    return emptyMetrics(detail, 'error');
  }
}

export const getPostHogMetrics = unstable_cache(
  fetchPostHogMetrics,
  ['founder-analytics-posthog-v1'],
  { revalidate: 300, tags: ['founder-analytics'] },
);
