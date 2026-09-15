import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCeoSignals } from './calculations';
import { getGa4Metrics } from './ga4-server';
import { getGscMetrics } from './gsc-server';
import { getMetaAdsMetrics } from './meta-server';
import { getPostHogMetrics } from './posthog-server';
import { getSupabaseMetrics } from './supabase-server';
import type { Database } from '@/types/database';
import type { ClubDataPriorityRow, DateRange, FounderDashboard, PostHogMetrics, SupabaseMetrics } from './types';

function buildClubDataPriorities(posthog: PostHogMetrics, operational: SupabaseMetrics): ClubDataPriorityRow[] {
  const demand = new Map(posthog.clubs.map((club) => [club.slug, club]));
  return operational.qualityBacklog.map((club) => {
    const behavior = demand.get(club.slug);
    const views = behavior?.views ?? 0;
    const ctaClicks = behavior ? behavior.phoneClicks + behavior.instagramClicks + behavior.mapsClicks : 0;
    const gapPoints = 100 - club.completenessScore;
    const demandPoints = Math.min(60, views * 2 + ctaClicks * 4);
    const evidencePoints = club.evidenceState === 'missing' ? 10 : club.evidenceState === 'stale' ? 5 : 0;
    return { ...club, views, ctaClicks, priorityScore: gapPoints + demandPoints + evidencePoints };
  }).sort((a, b) => b.priorityScore - a.priorityScore || b.views - a.views || a.name.localeCompare(b.name, 'az'));
}

export async function getFounderDashboard(
  range: DateRange,
  supabase: SupabaseClient<Database>,
): Promise<FounderDashboard> {
  const [posthog, meta, ga4, gsc, operational] = await Promise.all([
    getPostHogMetrics(range),
    getMetaAdsMetrics(range),
    getGa4Metrics(range),
    getGscMetrics(range),
    getSupabaseMetrics(supabase),
  ]);
  const providers = [
    posthog.status,
    operational.status,
    meta.status,
    ga4.status,
    gsc.status,
  ];
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