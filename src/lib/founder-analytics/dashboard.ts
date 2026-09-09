import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCeoSignals } from './calculations';
import { getGa4Metrics } from './ga4-server';
import { getGscMetrics } from './gsc-server';
import { getMetaAdsMetrics } from './meta-server';
import { getPostHogMetrics } from './posthog-server';
import { getSupabaseMetrics } from './supabase-server';
import type { Database } from '@/types/database';
import type { DateRange, FounderDashboard } from './types';

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
    providers,
    signals: buildCeoSignals(posthog, operational),
    generatedAt: new Date().toISOString(),
  };
}
