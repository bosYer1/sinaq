import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCeoSignals, metric } from './calculations';
import { getGa4Metrics } from './ga4-server';
import { getGscMetrics } from './gsc-server';
import { getMetaAdsMetrics } from './meta-server';
import { getPostHogMetrics } from './posthog-server';
import { providerStatus } from './providers';
import { getSupabaseMetrics } from './supabase-server';
import type { Database } from '@/types/database';
import type {
  ClubDataPriorityRow,
  DateRange,
  FounderDashboard,
  Ga4Metrics,
  GscMetrics,
  MetaAdsMetrics,
  PostHogMetrics,
  SupabaseMetrics,
} from './types';

const SECONDARY_PROVIDER_DEADLINE_MS = 4_500;
const SUPABASE_DEADLINE_MS = 4_000;

async function withDashboardDeadline<T>(
  label: string,
  promise: Promise<T>,
  timeoutMs: number,
  fallback: (detail: string) => T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(
          () => resolve(fallback(`${label} dashboard deadline exceeded (${timeoutMs / 1000}s)`)),
          timeoutMs,
        );
      }),
    ]);
  } catch (error) {
    const detail = error instanceof Error ? error.message : `${label} sorğusu uğursuz oldu`;
    return fallback(detail);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function unavailableGa4(detail: string): Ga4Metrics {
  const zero = metric(0, 0);
  return {
    status: providerStatus('ga4', 'error', detail),
    sessions: zero, activeUsers: zero, totalUsers: zero, newUsers: zero,
    pageviews: zero, engagementRate: zero, bounceRate: zero,
    averageSessionDuration: zero, eventCount: zero, keyEvents: zero,
  };
}

function unavailableGsc(detail: string): GscMetrics {
  const zero = metric(0, 0);
  return {
    status: providerStatus('gsc', 'error', detail),
    clicks: zero, impressions: zero, ctr: zero, averagePosition: zero,
    topQueries: [], topPages: [],
  };
}

function unavailableMeta(detail: string): MetaAdsMetrics {
  const zero = metric(0, 0);
  return {
    status: providerStatus('meta', 'error', detail),
    currency: null,
    spend: zero, impressions: zero, reach: zero, clicks: zero, ctr: zero, cpc: zero, cpm: zero,
    campaigns: [],
    reportingNote: 'Provider dashboard deadline-i aşdı; Meta məlumatı bu request-də paneli bloklamır.',
  };
}

function unavailableSupabase(detail: string): SupabaseMetrics {
  return {
    status: providerStatus('supabase', 'error', detail),
    activeClubs: 0,
    verifiedClubs: 0,
    pendingSubmissions: 0,
    staleSubmissions: 0,
    submissionBacklogByKind: { ownerClaim: 0, newClub: 0, correction: 0 },
    completeness: { total: 0, missingImage: 0, missingPhone: 0, missingSocial: 0, missingCoordinates: 0, missingType: 0 },
    qualityBacklog: [],
    firstPartyIntent: {
      available: false,
      detail,
      events: 0,
      browserVisitors: 0,
      phoneClicks: 0,
      instagramClicks: 0,
      mapsClicks: 0,
    },
  };
}

function buildClubDataPriorities(posthog: PostHogMetrics, operational: SupabaseMetrics): ClubDataPriorityRow[] {
  const demand = new Map(posthog.clubs.map((club) => [club.slug, club]));
  return operational.qualityBacklog.map((club) => {
    const behavior = demand.get(club.slug);
    const views = behavior?.views ?? 0;
    const ctaClicks = behavior ? behavior.phoneClicks + behavior.instagramClicks + behavior.tiktokClicks + behavior.mapsClicks : 0;
    const intentSessions = behavior?.intentSessions ?? 0;
    const gapPoints = 100 - club.completenessScore;
    const demandPoints = Math.min(60, views * 2 + intentSessions * 4);
    const evidencePoints = club.evidenceState === 'missing' ? 10 : club.evidenceState === 'stale' ? 5 : 0;
    return { ...club, views, ctaClicks, priorityScore: gapPoints + demandPoints + evidencePoints };
  }).sort((a, b) => b.priorityScore - a.priorityScore || b.views - a.views || a.name.localeCompare(b.name, 'az'));
}

export async function getFounderDashboard(
  range: DateRange,
  supabase: SupabaseClient<Database>,
): Promise<FounderDashboard> {
  const [posthog, operational, meta, ga4, gsc] = await Promise.all([
    getPostHogMetrics(range),
    withDashboardDeadline('Supabase', getSupabaseMetrics(supabase, range), SUPABASE_DEADLINE_MS, unavailableSupabase),
    withDashboardDeadline('Meta Ads', getMetaAdsMetrics(range), SECONDARY_PROVIDER_DEADLINE_MS, unavailableMeta),
    withDashboardDeadline('GA4', getGa4Metrics(range), SECONDARY_PROVIDER_DEADLINE_MS, unavailableGa4),
    withDashboardDeadline('GSC', getGscMetrics(range), SECONDARY_PROVIDER_DEADLINE_MS, unavailableGsc),
  ]);
  const providers = [posthog.status, operational.status, meta.status, ga4.status, gsc.status];
  return {
    range,
    posthog,
    meta,
    ga4,
    gsc,
    supabase: operational,
    clubDataPriorities: buildClubDataPriorities(posthog, operational),
    providers,
    signals: buildCeoSignals(posthog, operational),
    generatedAt: new Date().toISOString(),
  };
}
