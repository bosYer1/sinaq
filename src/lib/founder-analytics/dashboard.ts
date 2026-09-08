import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCeoSignals } from './calculations';
import { getGa4Metrics } from './ga4-server';
import { getPostHogMetrics } from './posthog-server';
import { configuredProviderStatus } from './providers';
import { getSupabaseMetrics } from './supabase-server';
import type { Database } from '@/types/database';
import type { DateRange, FounderDashboard } from './types';

export async function getFounderDashboard(
  range: DateRange,
  supabase: SupabaseClient<Database>,
): Promise<FounderDashboard> {
  const [posthog, ga4, operational] = await Promise.all([
    getPostHogMetrics(range),
    getGa4Metrics(range),
    getSupabaseMetrics(supabase),
  ]);
  const providers = [
    posthog.status,
    operational.status,
    configuredProviderStatus('meta'),
    ga4.status,
    configuredProviderStatus('gsc'),
  ];
  return {
    range,
    posthog,
    ga4,
    supabase: operational,
    providers,
    signals: buildCeoSignals(posthog, operational),
    generatedAt: new Date().toISOString(),
  };
}
