import 'server-only';

import { unstable_cache } from 'next/cache';
import { metric, rate } from './calculations';
import { aggregateAcquisition, normalizeCampaign, normalizeClubPerformance, numberValue, stringValue } from './normalization';
import { providerStatus } from './providers';
import type { DateRange, PostHogMetrics, TrendPoint } from './types';

type HogQLResponse = { columns?: string[]; results?: unknown[][] };
type Row = Record<string, unknown>;

const ALLOWED_HOSTS = new Set(['https://us.posthog.com', 'https://eu.posthog.com']);
const PRODUCT_TIME_ZONE = 'Asia/Baku';
const PRODUCT_ANALYTICS_STARTED_AT = '2026-08-18T20:00:00.000Z';
const POSTHOG_HISTORY_WINDOW_MS = 365 * 86_400_000;
const GAMEYER_POSTHOG_PROJECT_ID = '585472';
const GAMEYER_POSTHOG_HOST = 'https://us.posthog.com';
const POSTHOG_QUERY_TIMEOUT_MS = 6_000;
const POSTHOG_CORE_TIMEOUT_MS = 8_000;
const POSTHOG_DASHBOARD_DEADLINE_MS = 14_000;
const POSTHOG_OPTIONAL_PHASE_DEADLINE_MS = 5_000;
const POSTHOG_MAX_CONCURRENCY = 6;

function emptyMetrics(detail: string, status: 'unavailable' | 'error'): PostHogMetrics {
  const zero = metric(0, 0);
  return {
    status: providerStatus('posthog', status, detail),
    pageviews: zero, visitors: zero, sessions: zero, clubViews: zero, clubClicks: zero,
    ctaClicks: zero, intentSessions: zero, searchQueries: zero, filterChanges: zero, exploreViewChanges: zero,
    mapUsage: zero, phoneClicks: zero, instagramClicks: zero, tiktokClicks: zero, mapsClicks: zero, whatsappBookingClicks: zero,
    newUsers: 0, returningUsers: 0, returningRate: 0, sessionsPerUser: 0, usersWithThreeSessions: 0,
    conversionRate: zero, acquisition: [], campaigns: [], clubs: [], trend: [],
    tracking: { latestEventAt: null, publicEvents: 0, testEvents: 0, missingSessionAttribution: 0, missingCampaignAttribution: 0, noResultSearches: 0, botEvents: 0, sourceMissingSessions: 0, attributionCompleteness: 0 },
    funnel: { landingSessions: 0, discoverySessions: 0, clubViewSessions: 0, ctaSessions: 0, profileToLeadRate: 0, integrityOk: true },
    retention: { d1: null, d3: null, d7: null, d1CohortUsers: 0, d3CohortUsers: 0, d7CohortUsers: 0, cohortUsers: 0 },
    pwa: { installAvailable: 0, installed: 0, standaloneOpened: 0 },
    returnLoop: { updateImpressions: 0, updateDetailClicks: 0, updateClubClicks: 0, updateSourceClicks: 0, updateUsers: 0, updateSessions: 0, downstreamClubViewSessions: 0, downstreamCtaSessions: 0, returningUpdateUsers: 0, returningUpdateRate: 0, clubViewReachRate: 0, ctaReachRate: 0 },
    supplyFunnel: { ownerClaimViews: 0, newClubViews: 0, correctionViews: 0, ownerClaimStarts: 0, ownerClaimAttempts: 0, ownerClaimSent: 0, newClubSent: 0, correctionSent: 0, ownerClaimErrors: 0, ownerClaimRateLimited: 0, startRate: 0, submitRate: 0 },
    discoveryQuality: { searchSessions: 0, zeroResultSearchSessions: 0, zeroResultRate: 0, filterSessions: 0, filterAdoptionRate: 0, mapSessions: 0, mapAdoptionRate: 0, clubImpressionSessions: 0, clubClickSessions: 0, clubCtr: 0 },
    webVitals: { lcpP75: null, lcpSamples: 0, inpP75: null, inpSamples: 0, clsP75: null, clsSamples: 0 },
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

async function queryHogQL(
  host: string,
  projectId: string,
  apiKey: string,
  query: string,
  timeoutMs = POSTHOG_QUERY_TIMEOUT_MS,
): Promise<Row[]> {
  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`PostHog sorğusu ${response.status} statusu qaytardı.`);
  return rows(await response.json() as HogQLResponse);
}

function isTimeoutError(error: unknown) {
  return error instanceof Error
    && (error.name === 'TimeoutError' || /timeout/i.test(error.message));
}

async function queryCoreHogQL(host: string, projectId: string, apiKey: string, query: string): Promise<Row[]> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await queryHogQL(host, projectId, apiKey, query, POSTHOG_CORE_TIMEOUT_MS);
    } catch (error) {
      lastError = error;
      // A slow query is unlikely to become fast on an immediate retry and a second
      // full timeout can consume the whole dashboard budget. Retry only non-timeout
      // transient failures.
      if (isTimeoutError(error)) break;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('PostHog əsas sorğusu uğursuz oldu.');
}

async function withPostHogPhaseDeadline<T>(
  label: string,
  promise: Promise<T>,
  fallback: T,
  errors: string[],
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          errors.push(`${label} phase deadline exceeded (${POSTHOG_OPTIONAL_PHASE_DEADLINE_MS / 1000}s)`);
          resolve(fallback);
        }, POSTHOG_OPTIONAL_PHASE_DEADLINE_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function periodClause(range: DateRange) {
  const from = safeIso(range.from);
  const to = safeIso(range.to);
  const previousFrom = safeIso(range.previousFrom);
  const oneYearBefore = new Date(new Date(from).getTime() - POSTHOG_HISTORY_WINDOW_MS);
  const productStart = new Date(PRODUCT_ANALYTICS_STARTED_AT);
  const historyFrom = safeIso((oneYearBefore > productStart ? oneYearBefore : productStart).toISOString());
  return { from, to, previousFrom, historyFrom };
}

function createLimitedPostHogRunner(host: string, projectId: string, apiKey: string, errors: string[]) {
  let active = 0;
  const waiters: Array<() => void> = [];

  async function acquire() {
    if (active < POSTHOG_MAX_CONCURRENCY) {
      active += 1;
      return;
    }

    await new Promise<void>((resolve) => {
      waiters.push(() => {
        active += 1;
        resolve();
      });
    });
  }

  function release() {
    active = Math.max(0, active - 1);
    waiters.shift()?.();
  }

  return async (query: string): Promise<Row[]> => {
    await acquire();
    try {
      return await queryHogQL(host, projectId, apiKey, query);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'PostHog sorğusu uğursuz oldu.';
      errors.push(detail);
      return [];
    } finally {
      release();
    }
  };
}

async function fetchPostHogMetrics(range: DateRange): Promise<PostHogMetrics> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  const configuredProjectId = process.env.POSTHOG_PROJECT_ID?.trim();
  const configuredHost = (process.env.POSTHOG_API_HOST?.trim() || '').replace(/\/$/, '');
  const projectId = configuredProjectId && /^\d+$/.test(configuredProjectId)
    ? configuredProjectId
    : GAMEYER_POSTHOG_PROJECT_ID;
  const host = ALLOWED_HOSTS.has(configuredHost) ? configuredHost : GAMEYER_POSTHOG_HOST;
  if (!apiKey) return emptyMetrics('PostHog server read credential konfiqurasiya olunmayıb.', 'unavailable');

  const { from, to, previousFrom, historyFrom } = periodClause(range);
  const productionPublicScope = "properties.gameyer_traffic_scope = 'public' AND properties.$host = 'gameyer.az'";
  const publicScope = `${productionPublicScope} AND (properties.$virt_is_bot != true OR isNull(properties.$virt_is_bot))`;
  const fromDay = `toDate(toTimeZone(toDateTime('${from}'), '${PRODUCT_TIME_ZONE}'))`;
  const toDay = `toDate(toTimeZone(toDateTime('${to}'), '${PRODUCT_TIME_ZONE}'))`;
  const queryErrors: string[] = [];
  const runHogQL = createLimitedPostHogRunner(host, projectId, apiKey, queryErrors);

  try {
    const overviewPromise = queryCoreHogQL(host, projectId, apiKey, `
        SELECT
          if(timestamp >= toDateTime('${from}'), 'current', 'previous') AS period,
          countIf(event = '$pageview') AS pageviews,
          uniqIf(person_id, event = '$pageview') AS visitors,
          uniqIf(properties.$session_id, event = '$pageview') AS sessions,
          countIf(event = 'club_view') AS club_views,
          countIf(event = 'club_card_click') AS club_clicks,
          countIf(event = 'phone_click') AS phone_clicks,
          countIf(event = 'instagram_click') AS instagram_clicks,
          countIf(event = 'tiktok_click') AS tiktok_clicks,
          countIf(event = 'maps_click') AS maps_clicks,
          countIf(event = 'whatsapp_booking_click') AS whatsapp_booking_clicks,
          countIf(event IN ('phone_click','instagram_click','tiktok_click','maps_click','whatsapp_booking_click')) AS cta_clicks,
          uniqIf(properties.$session_id, event IN ('phone_click','instagram_click','tiktok_click','maps_click','whatsapp_booking_click') AND notEmpty(properties.$session_id)) AS intent_sessions,
          uniqIf(properties.$session_id, event = 'club_view' AND notEmpty(properties.$session_id)) AS club_view_sessions,
          countIf(event IN ('map_location_clicked','location_sort_clicked')) AS map_usage,
          countIf(event = 'search_query') AS searches,
          countIf(event = 'filter_changed') AS filters,
          countIf(event = 'explore_view_changed') AS explore_changes,
          countIf(event = 'pwa_install_available') AS pwa_install_available,
          countIf(event = 'pwa_installed') AS pwa_installed,
          countIf(event = 'pwa_standalone_opened') AS pwa_standalone_opened
        FROM events
        WHERE timestamp >= toDateTime('${previousFrom}') AND timestamp < toDateTime('${to}') AND ${publicScope}
        GROUP BY period
      `);

    const healthPromise = queryCoreHogQL(host, projectId, apiKey, `
        SELECT
          maxIf(timestamp, ${publicScope}) AS latest_event_at,
          countIf(${publicScope}) AS public_events,
          countIf(properties.gameyer_traffic_scope = 'test' AND properties.$host = 'gameyer.az') AS test_events,
          uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview' AND empty(properties.gameyer_session_landing_path)) AS missing_session,
          uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview'
            AND (notEmpty(properties.gameyer_first_fbclid) OR notEmpty(properties.gameyer_session_fbclid) OR notEmpty(properties.fbclid))
            AND empty(properties.gameyer_first_utm_campaign)
            AND empty(properties.gameyer_session_utm_campaign)
            AND empty(properties.utm_campaign)) AS missing_campaign,
          countIf(${publicScope} AND event = 'search_query' AND properties.no_results = true) AS no_result_searches,
          countIf(${productionPublicScope} AND properties.$virt_is_bot = true) AS bot_events,
          uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview'
            AND empty(properties.gameyer_first_referrer)
            AND empty(properties.gameyer_session_referrer)
            AND empty(properties.gameyer_first_utm_source)
            AND empty(properties.gameyer_session_utm_source)
            AND empty(properties.utm_source)
            AND empty(properties.gameyer_first_fbclid)
            AND empty(properties.gameyer_session_fbclid)
            AND empty(properties.fbclid)) AS source_missing_sessions,
          uniqIf(properties.$session_id, ${publicScope} AND event = '$pageview') AS public_pageview_sessions
        FROM events
        WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}')
      `);
    const retentionPromise = queryCoreHogQL(host, projectId, apiKey, `
        SELECT
          count() AS users,
          countIf(first_seen < toDateTime('${from}')) AS returning_users,
          countIf(current_sessions >= 3) AS three_session_users,
          round(avg(current_sessions), 2) AS sessions_per_user
        FROM (
          SELECT
            person_id,
            min(timestamp) AS first_seen,
            uniqIf(properties.$session_id, timestamp >= toDateTime('${from}')) AS current_sessions
          FROM events
          WHERE timestamp >= toDateTime('${historyFrom}')
            AND timestamp < toDateTime('${to}')
            AND ${publicScope}
            AND event = '$pageview'
          GROUP BY person_id
        )
        WHERE current_sessions > 0
      `),      `).catch((error) => {
      const detail = error instanceof Error ? error.message : 'Retention sorğusu uğursuz oldu.';
      queryErrors.push(`Retention: ${detail}`);
      return [] as Row[];
    });

    const [overviewRows, healthRows] = await Promise.all([overviewPromise, healthPromise]);

    if (healthRows.length === 0) {
      return emptyMetrics('PostHog tracking sağlamlığı datası alınmadı.', 'error');
    }

    if (overviewRows.length === 0) {
      return emptyMetrics(queryErrors[0] ?? 'PostHog əsas overview sorğusu data qaytarmadı.', 'error');
    }

    const optionalPromise = Promise.all([
      runHogQL(`
        SELECT
          source,
          medium,
          campaign,
          uniq(person_id) AS visitors,
          count() AS sessions,
          uniqIf(person_id, person_id IN (
            SELECT person_id
            FROM events
            WHERE timestamp >= toDateTime('${historyFrom}')
              AND timestamp < toDateTime('${from}')
              AND ${publicScope}
              AND event = '$pageview'
            GROUP BY person_id
          )) AS returning_users,
          sum(pageviews) AS pageviews,
          sum(club_views) AS club_views,
          sum(club_view_sessions) AS club_view_sessions,
          sum(club_clicks) AS club_clicks,
          sum(cta_clicks) AS cta_clicks,
          sum(cta_sessions) AS cta_sessions
        FROM (
          SELECT
            properties.$session_id AS session_id,
            argMinIf(person_id, timestamp, event = '$pageview') AS person_id,
            argMinIf(
              multiIf(
                notEmpty(coalesce(nullIf(properties.gameyer_session_utm_source, ''), nullIf(properties.gameyer_first_utm_source, ''), nullIf(properties.utm_source, ''))),
                  lower(coalesce(nullIf(properties.gameyer_session_utm_source, ''), nullIf(properties.gameyer_first_utm_source, ''), nullIf(properties.utm_source, ''))),
                notEmpty(coalesce(nullIf(properties.gameyer_session_fbclid, ''), nullIf(properties.gameyer_first_fbclid, ''), nullIf(properties.fbclid, ''))), 'facebook',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'google.') > 0, 'google',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'bing.') > 0, 'bing',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'yandex.') > 0, 'yandex',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'instagram.com') > 0, 'instagram',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'facebook.com') > 0, 'facebook',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'tiktok.com') > 0, 'tiktok',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'chatgpt.com') > 0
                  OR positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'openai.com') > 0, 'chatgpt',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'perplexity.ai') > 0, 'perplexity',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'claude.ai') > 0, 'claude',
                empty(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')))
                  OR lower(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, ''))) = '(direct)'
                  OR positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'gameyer.az') > 0, 'direct',
                'referral'
              ),
              timestamp,
              event = '$pageview'
            ) AS source,
            argMinIf(
              multiIf(
                notEmpty(coalesce(nullIf(properties.gameyer_session_utm_medium, ''), nullIf(properties.gameyer_first_utm_medium, ''), nullIf(properties.utm_medium, ''))),
                  lower(coalesce(nullIf(properties.gameyer_session_utm_medium, ''), nullIf(properties.gameyer_first_utm_medium, ''), nullIf(properties.utm_medium, ''))),
                notEmpty(coalesce(nullIf(properties.gameyer_session_fbclid, ''), nullIf(properties.gameyer_first_fbclid, ''), nullIf(properties.fbclid, ''))), 'paid_social',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'google.') > 0
                  OR positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'bing.') > 0
                  OR positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'yandex.') > 0, 'organic',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'instagram.com') > 0
                  OR positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'facebook.com') > 0
                  OR positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'tiktok.com') > 0, 'organic_social',
                positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'chatgpt.com') > 0
                  OR positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'openai.com') > 0
                  OR positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'perplexity.ai') > 0
                  OR positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'claude.ai') > 0, 'ai',
                notEmpty(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')))
                  AND lower(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, ''))) != '(direct)'
                  AND positionCaseInsensitive(coalesce(nullIf(properties.gameyer_session_referrer, ''), nullIf(properties.gameyer_first_referrer, ''), nullIf(properties.$referrer, '')), 'gameyer.az') = 0, 'referral',
                '—'
              ),
              timestamp,
              event = '$pageview'
            ) AS medium,
            argMinIf(
              coalesce(nullIf(properties.gameyer_session_utm_campaign, ''), nullIf(properties.gameyer_first_utm_campaign, ''), nullIf(properties.utm_campaign, ''), '(kampaniyasız)'),
              timestamp,
              event = '$pageview'
            ) AS campaign,
            countIf(event = '$pageview') AS pageviews,
            countIf(event = 'club_view') AS club_views,
            uniqIf(properties.$session_id, event = 'club_view' AND notEmpty(properties.$session_id)) AS club_view_sessions,
            countIf(event = 'club_card_click') AS club_clicks,
            countIf(event IN ('phone_click','instagram_click','tiktok_click','maps_click','whatsapp_booking_click')) AS cta_clicks,
            uniqIf(properties.$session_id, event IN ('phone_click','instagram_click','tiktok_click','maps_click','whatsapp_booking_click') AND notEmpty(properties.$session_id)) AS cta_sessions
          FROM events
          WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}')
            AND ${publicScope}
            AND notEmpty(properties.$session_id)
          GROUP BY session_id
          HAVING pageviews > 0
        )
        GROUP BY source, medium, campaign
        ORDER BY cta_clicks DESC, visitors DESC
        LIMIT 20
      `),
      runHogQL(`
        SELECT
          coalesce(nullIf(properties.club_slug, ''), '(slug yoxdur)') AS slug,
          coalesce(nullIf(properties.club_name, ''), slug) AS name,
          coalesce(nullIf(anyIf(properties.district, notEmpty(properties.district)), ''), 'Məlum deyil') AS district,
          countIf(event = 'club_impression') AS impressions,
          countIf(event = 'club_view') AS views,
          uniqIf(properties.$session_id, event = 'club_view' AND notEmpty(properties.$session_id)) AS view_sessions,
          countIf(event = 'club_card_click') AS card_clicks,
          countIf(event = 'phone_click') AS phone_clicks,
          countIf(event = 'instagram_click') AS instagram_clicks,
          countIf(event = 'tiktok_click') AS tiktok_clicks,
          countIf(event = 'maps_click') AS maps_clicks,
          countIf(event = 'whatsapp_booking_click') AS whatsapp_booking_clicks,
          uniqIf(properties.$session_id, event IN ('phone_click','instagram_click','tiktok_click','maps_click','whatsapp_booking_click') AND notEmpty(properties.$session_id)) AS intent_sessions
        FROM events
        WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}')
          AND ${publicScope}
          AND event IN ('club_impression','club_view','club_card_click','phone_click','instagram_click','tiktok_click','maps_click','whatsapp_booking_click')
        GROUP BY slug, name
        ORDER BY views DESC, card_clicks DESC
        LIMIT 20
      `),
      runHogQL(`
        SELECT
          toString(toDate(toTimeZone(timestamp, '${PRODUCT_TIME_ZONE}'))) AS date,
          countIf(event = '$pageview') AS pageviews,
          uniqIf(person_id, event = '$pageview') AS visitors,
          countIf(event IN ('phone_click','instagram_click','tiktok_click','maps_click','whatsapp_booking_click')) AS cta_clicks
        FROM events
        WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}') AND ${publicScope}
        GROUP BY date
        ORDER BY date
      `),


      runHogQL(`
        SELECT
          uniqIf(properties.$session_id, event = '$pageview') AS landing_sessions,
          uniqIf(properties.$session_id, event IN ('club_card_click','club_view')) AS discovery_sessions,
          uniqIf(properties.$session_id, event = 'club_view') AS club_view_sessions,
          uniqIf(properties.$session_id, event IN ('phone_click','instagram_click','tiktok_click','maps_click','whatsapp_booking_click')) AS cta_sessions
        FROM events
        WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}') AND ${publicScope}
      `),
      runHogQL(`
        SELECT
          countIf(first_day >= ${fromDay} AND first_day < addDays(${toDay}, -1)) AS d1_cohort_users,
          countIf(first_day >= ${fromDay} AND first_day < addDays(${toDay}, -1) AND has(active_days, addDays(first_day, 1))) AS d1_users,
          countIf(first_day >= ${fromDay} AND first_day < addDays(${toDay}, -3)) AS d3_cohort_users,
          countIf(first_day >= ${fromDay} AND first_day < addDays(${toDay}, -3) AND has(active_days, addDays(first_day, 3))) AS d3_users,
          countIf(first_day >= ${fromDay} AND first_day < addDays(${toDay}, -7)) AS d7_cohort_users,
          countIf(first_day >= ${fromDay} AND first_day < addDays(${toDay}, -7) AND has(active_days, addDays(first_day, 7))) AS d7_users
        FROM (
          SELECT
            person_id,
            min(toDate(toTimeZone(timestamp, '${PRODUCT_TIME_ZONE}'))) AS first_day,
            groupUniqArray(toDate(toTimeZone(timestamp, '${PRODUCT_TIME_ZONE}'))) AS active_days
          FROM events
          WHERE timestamp >= toDateTime('${historyFrom}')
            AND timestamp < toDateTime('${to}')
            AND ${publicScope}
            AND event = '$pageview'
          GROUP BY person_id
        )
      `),
      runHogQL(`
        SELECT
          countIf(event = 'club_update_impression') AS update_impressions,
          countIf(event = 'club_update_detail_click') AS update_detail_clicks,
          countIf(event = 'club_update_club_click') AS update_club_clicks,
          countIf(event = 'club_update_source_click') AS update_source_clicks,
          uniqIf(person_id, event IN ('club_update_impression','club_update_detail_click','club_update_club_click','club_update_source_click')) AS update_users,
          uniqIf(properties.$session_id, event IN ('club_update_impression','club_update_detail_click','club_update_club_click','club_update_source_click') AND notEmpty(properties.$session_id)) AS update_sessions,
          uniqIf(properties.$session_id, event = 'club_view' AND notEmpty(properties.$session_id)
            AND (properties.$session_id, properties.club_id) IN (
              SELECT properties.$session_id, properties.club_id
              FROM events
              WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}')
                AND ${publicScope}
                AND event = 'club_update_club_click'
                AND notEmpty(properties.$session_id)
                AND notEmpty(properties.club_id)
            )) AS downstream_club_view_sessions,
          uniqIf(properties.$session_id, event IN ('phone_click','instagram_click','tiktok_click','maps_click','whatsapp_booking_click') AND notEmpty(properties.$session_id)
            AND (properties.$session_id, properties.club_id) IN (
              SELECT properties.$session_id, properties.club_id
              FROM events
              WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}')
                AND ${publicScope}
                AND event = 'club_update_club_click'
                AND notEmpty(properties.$session_id)
                AND notEmpty(properties.club_id)
            )) AS downstream_cta_sessions,
          uniqIf(person_id, event IN ('club_update_impression','club_update_detail_click','club_update_club_click','club_update_source_click')
            AND person_id IN (
              SELECT person_id
              FROM events
              WHERE timestamp >= toDateTime('${historyFrom}')
                AND timestamp < toDateTime('${from}')
                AND ${publicScope}
                AND event = '$pageview'
              GROUP BY person_id
            )) AS returning_update_users
        FROM events
        WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}') AND ${publicScope}
      `),
      runHogQL(`
        SELECT
          countIf(event = 'submission_form_viewed' AND properties.submission_kind = 'owner_claim') AS owner_claim_views,
          countIf(event = 'submission_form_viewed' AND properties.submission_kind = 'new_club') AS new_club_views,
          countIf(event = 'submission_form_viewed' AND properties.submission_kind = 'correction') AS correction_views,
          countIf(event = 'submission_form_started' AND properties.submission_kind = 'owner_claim') AS owner_claim_starts,
          countIf(event = 'submission_submit_attempt' AND properties.submission_kind = 'owner_claim') AS owner_claim_attempts,
          countIf(event = 'submission_result' AND properties.submission_kind = 'owner_claim' AND properties.result = 'sent') AS owner_claim_sent,
          countIf(event = 'submission_result' AND properties.submission_kind = 'new_club' AND properties.result = 'sent') AS new_club_sent,
          countIf(event = 'submission_result' AND properties.submission_kind = 'correction' AND properties.result = 'sent') AS correction_sent,
          countIf(event = 'submission_result' AND properties.submission_kind = 'owner_claim' AND properties.result = 'error') AS owner_claim_errors,
          countIf(event = 'submission_result' AND properties.submission_kind = 'owner_claim' AND properties.result = 'rate_limited') AS owner_claim_rate_limited
        FROM events
        WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}')
          AND ${publicScope}
      `),
      runHogQL(`
        SELECT
          uniqIf(properties.$session_id, event = 'search_query' AND notEmpty(properties.$session_id)) AS search_sessions,
          uniqIf(properties.$session_id, event = 'search_query' AND properties.no_results = true AND notEmpty(properties.$session_id)) AS zero_result_search_sessions,
          uniqIf(properties.$session_id, event = 'filter_changed' AND properties.filter_name IN ('district','club_type','price_max') AND notEmpty(properties.$session_id)) AS filter_sessions,
          uniqIf(properties.$session_id, event IN ('map_location_clicked','location_sort_clicked') AND notEmpty(properties.$session_id)) AS map_sessions,
          uniqIf(properties.$session_id, event = 'club_impression' AND notEmpty(properties.$session_id)) AS club_impression_sessions,
          uniqIf(properties.$session_id, event = 'club_card_click' AND notEmpty(properties.$session_id)) AS club_click_sessions
        FROM events
        WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}') AND ${publicScope}
      `),
      runHogQL(`
        SELECT
          quantileIf(0.75)(toFloatOrZero(toString(properties.metric_value)), properties.metric_name = 'LCP') AS lcp_p75,
          countIf(properties.metric_name = 'LCP') AS lcp_samples,
          quantileIf(0.75)(toFloatOrZero(toString(properties.metric_value)), properties.metric_name = 'INP') AS inp_p75,
          countIf(properties.metric_name = 'INP') AS inp_samples,
          quantileIf(0.75)(toFloatOrZero(toString(properties.metric_value)), properties.metric_name = 'CLS') AS cls_p75,
          countIf(properties.metric_name = 'CLS') AS cls_samples
        FROM events
        WHERE timestamp >= toDateTime('${from}') AND timestamp < toDateTime('${to}') AND ${publicScope} AND event = 'web_vital'
      `),
    ]);

    const optionalFallback = Array.from({ length: 9 }, () => [] as Row[]);
    const [
      retentionRows,
      [campaignRows, clubRows, trendRows, funnelRows, cohortRows, returnLoopRows, supplyFunnelRows, discoveryQualityRows, webVitalRows],
    ] = await Promise.all([
      withPostHogPhaseDeadline('Retention', retentionPromise, [] as Row[], queryErrors),
      withPostHogPhaseDeadline('Optional analytics', optionalPromise, optionalFallback, queryErrors),
    ]);

    const current = overviewRows.find((row) => row.period === 'current') ?? {};
    const previous = overviewRows.find((row) => row.period === 'previous') ?? {};
    const currentCta = numberValue(current.cta_clicks);
    const previousCta = numberValue(previous.cta_clicks);
    const currentViews = numberValue(current.club_views);
    const previousViews = numberValue(previous.club_views);
    const currentIntentSessions = numberValue(current.intent_sessions);
    const previousIntentSessions = numberValue(previous.intent_sessions);
    const currentClubViewSessions = numberValue(current.club_view_sessions);
    const previousClubViewSessions = numberValue(previous.club_view_sessions);
    const health = healthRows[0] ?? {};
    const retention = retentionRows[0] ?? {};
    const funnel = funnelRows[0] ?? {};
    const cohort = cohortRows[0] ?? {};
    const returnLoop = returnLoopRows[0] ?? {};
    const supplyFunnel = supplyFunnelRows[0] ?? {};
    const discoveryQuality = discoveryQualityRows[0] ?? {};
    const webVitals = webVitalRows[0] ?? {};

    const campaigns = campaignRows.map(normalizeCampaign);
    const clubs = clubRows.map(normalizeClubPerformance);
    const trend: TrendPoint[] = trendRows.map((row) => ({
      date: stringValue(row.date),
      pageviews: numberValue(row.pageviews),
      visitors: numberValue(row.visitors),
      ctaClicks: numberValue(row.cta_clicks),
    }));
    const publicPageviewSessions = numberValue(health.public_pageview_sessions);
    const missingSessionAttribution = numberValue(health.missing_session);
    const updateUsers = numberValue(returnLoop.update_users);
    const updateSessions = numberValue(returnLoop.update_sessions);
    const returningUpdateUsers = numberValue(returnLoop.returning_update_users);
    const downstreamClubViewSessions = numberValue(returnLoop.downstream_club_view_sessions);
    const downstreamCtaSessions = numberValue(returnLoop.downstream_cta_sessions);
    const d1CohortUsers = numberValue(cohort.d1_cohort_users);
    const d3CohortUsers = numberValue(cohort.d3_cohort_users);
    const d7CohortUsers = numberValue(cohort.d7_cohort_users);

    return {
      status: providerStatus(
        'posthog',
        'ready',
        queryErrors.length > 0
          ? `Əsas PostHog datası işləyir; ${queryErrors.length} əlavə sorğu bu yükləmədə alınmadı. Səhifə qismən data ilə fail-soft göstərildi.`
          : 'Real production public event datası server-side PostHog API-dən oxundu; məlum botlar çıxarıldı.',
      ),
      pageviews: metric(numberValue(current.pageviews), numberValue(previous.pageviews)),
      visitors: metric(numberValue(current.visitors), numberValue(previous.visitors)),
      sessions: metric(numberValue(current.sessions), numberValue(previous.sessions)),
      clubViews: metric(currentViews, previousViews),
      clubClicks: metric(numberValue(current.club_clicks), numberValue(previous.club_clicks)),
      ctaClicks: metric(currentCta, previousCta),
      intentSessions: metric(currentIntentSessions, previousIntentSessions),
      phoneClicks: metric(numberValue(current.phone_clicks), numberValue(previous.phone_clicks)),
      instagramClicks: metric(numberValue(current.instagram_clicks), numberValue(previous.instagram_clicks)),
      tiktokClicks: metric(numberValue(current.tiktok_clicks), numberValue(previous.tiktok_clicks)),
      mapsClicks: metric(numberValue(current.maps_clicks), numberValue(previous.maps_clicks)),
      whatsappBookingClicks: metric(numberValue(current.whatsapp_booking_clicks), numberValue(previous.whatsapp_booking_clicks)),
      mapUsage: metric(numberValue(current.map_usage), numberValue(previous.map_usage)),
      searchQueries: metric(numberValue(current.searches), numberValue(previous.searches)),
      filterChanges: metric(numberValue(current.filters), numberValue(previous.filters)),
      exploreViewChanges: metric(numberValue(current.explore_changes), numberValue(previous.explore_changes)),
      newUsers: Math.max(0, numberValue(retention.users) - numberValue(retention.returning_users)),
      returningUsers: numberValue(retention.returning_users),
      returningRate: rate(numberValue(retention.returning_users), numberValue(retention.users)),
      sessionsPerUser: numberValue(retention.sessions_per_user),
      usersWithThreeSessions: numberValue(retention.three_session_users),
      conversionRate: metric(rate(currentIntentSessions, currentClubViewSessions), rate(previousIntentSessions, previousClubViewSessions)),
      acquisition: aggregateAcquisition(campaigns),
      campaigns,
      clubs,
      trend,
      tracking: {
        latestEventAt: typeof health.latest_event_at === 'string' ? health.latest_event_at : null,
        publicEvents: numberValue(health.public_events),
        testEvents: numberValue(health.test_events),
        missingSessionAttribution,
        missingCampaignAttribution: numberValue(health.missing_campaign),
        noResultSearches: numberValue(health.no_result_searches),
        botEvents: numberValue(health.bot_events),
        sourceMissingSessions: numberValue(health.source_missing_sessions),
        attributionCompleteness: rate(publicPageviewSessions - numberValue(health.source_missing_sessions), publicPageviewSessions),
      },
      funnel: {
        landingSessions: numberValue(funnel.landing_sessions),
        discoverySessions: numberValue(funnel.discovery_sessions),
        clubViewSessions: numberValue(funnel.club_view_sessions),
        ctaSessions: numberValue(funnel.cta_sessions),
        profileToLeadRate: rate(numberValue(funnel.cta_sessions), numberValue(funnel.club_view_sessions)),
        integrityOk: numberValue(funnel.cta_sessions) <= numberValue(funnel.club_view_sessions),
      },
      retention: {
        d1: d1CohortUsers > 0 ? rate(numberValue(cohort.d1_users), d1CohortUsers) : null,
        d3: d3CohortUsers > 0 ? rate(numberValue(cohort.d3_users), d3CohortUsers) : null,
        d7: d7CohortUsers > 0 ? rate(numberValue(cohort.d7_users), d7CohortUsers) : null,
        d1CohortUsers,
        d3CohortUsers,
        d7CohortUsers,
        cohortUsers: d7CohortUsers,
      },
      pwa: {
        installAvailable: numberValue(current.pwa_install_available),
        installed: numberValue(current.pwa_installed),
        standaloneOpened: numberValue(current.pwa_standalone_opened),
      },
      webVitals: {
        lcpP75: numberValue(webVitals.lcp_samples) > 0 ? numberValue(webVitals.lcp_p75) : null,
        lcpSamples: numberValue(webVitals.lcp_samples),
        inpP75: numberValue(webVitals.inp_samples) > 0 ? numberValue(webVitals.inp_p75) : null,
        inpSamples: numberValue(webVitals.inp_samples),
        clsP75: numberValue(webVitals.cls_samples) > 0 ? numberValue(webVitals.cls_p75) : null,
        clsSamples: numberValue(webVitals.cls_samples),
      },
      discoveryQuality: {
        searchSessions: numberValue(discoveryQuality.search_sessions),
        zeroResultSearchSessions: numberValue(discoveryQuality.zero_result_search_sessions),
        zeroResultRate: rate(numberValue(discoveryQuality.zero_result_search_sessions), numberValue(discoveryQuality.search_sessions)),
        filterSessions: numberValue(discoveryQuality.filter_sessions),
        filterAdoptionRate: rate(numberValue(discoveryQuality.filter_sessions), numberValue(funnel.discovery_sessions)),
        mapSessions: numberValue(discoveryQuality.map_sessions),
        mapAdoptionRate: rate(numberValue(discoveryQuality.map_sessions), numberValue(funnel.discovery_sessions)),
        clubImpressionSessions: numberValue(discoveryQuality.club_impression_sessions),
        clubClickSessions: numberValue(discoveryQuality.club_click_sessions),
        clubCtr: rate(numberValue(discoveryQuality.club_click_sessions), numberValue(discoveryQuality.club_impression_sessions)),
      },
      supplyFunnel: {
        ownerClaimViews: numberValue(supplyFunnel.owner_claim_views),
        newClubViews: numberValue(supplyFunnel.new_club_views),
        correctionViews: numberValue(supplyFunnel.correction_views),
        ownerClaimStarts: numberValue(supplyFunnel.owner_claim_starts),
        ownerClaimAttempts: numberValue(supplyFunnel.owner_claim_attempts),
        ownerClaimSent: numberValue(supplyFunnel.owner_claim_sent),
        newClubSent: numberValue(supplyFunnel.new_club_sent),
        correctionSent: numberValue(supplyFunnel.correction_sent),
        ownerClaimErrors: numberValue(supplyFunnel.owner_claim_errors),
        ownerClaimRateLimited: numberValue(supplyFunnel.owner_claim_rate_limited),
        startRate: rate(numberValue(supplyFunnel.owner_claim_starts), numberValue(supplyFunnel.owner_claim_views)),
        submitRate: rate(numberValue(supplyFunnel.owner_claim_sent), numberValue(supplyFunnel.owner_claim_attempts)),
      },
      returnLoop: {
        updateImpressions: numberValue(returnLoop.update_impressions),
        updateDetailClicks: numberValue(returnLoop.update_detail_clicks),
        updateClubClicks: numberValue(returnLoop.update_club_clicks),
        updateSourceClicks: numberValue(returnLoop.update_source_clicks),
        updateUsers,
        updateSessions,
        downstreamClubViewSessions,
        downstreamCtaSessions,
        returningUpdateUsers,
        returningUpdateRate: rate(returningUpdateUsers, updateUsers),
        clubViewReachRate: rate(downstreamClubViewSessions, updateSessions),
        ctaReachRate: rate(downstreamCtaSessions, updateSessions),
      },
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'PostHog sorğusu uğursuz oldu.';
    return emptyMetrics(detail, 'error');
  }
}

const getCachedPostHogMetrics = unstable_cache(
  async (range: DateRange) => {
    const result = await fetchPostHogMetrics(range);
    if (result.status.status !== 'ready') throw new Error(result.status.detail);
    return result;
  },
  ['founder-analytics-posthog-v14'],
  { revalidate: 300, tags: ['founder-analytics'] },
);

export async function getPostHogMetrics(range: DateRange): Promise<PostHogMetrics> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      getCachedPostHogMetrics(range),
      new Promise<PostHogMetrics>((resolve) => {
        timer = setTimeout(
          () => resolve(emptyMetrics(`PostHog dashboard deadline exceeded (${POSTHOG_DASHBOARD_DEADLINE_MS / 1000}s)`, 'error')),
          POSTHOG_DASHBOARD_DEADLINE_MS,
        );
      }),
    ]);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'PostHog sorğusu uğursuz oldu.';
    // Failed provider results are not cached as successful analytics and are not retried
    // synchronously in the same dashboard request, avoiding a second full query waterfall.
    return emptyMetrics(detail, 'error');
  } finally {
    if (timer) clearTimeout(timer);
  }
}