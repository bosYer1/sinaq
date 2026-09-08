import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCeoSignals } from './calculations';
import { getPostHogMetrics } from './posthog-server';
import { configuredProviderStatus } from './providers';
import { getSupabaseMetrics } from './supabase-server';
import type { Database } from '@/types/database';
import type { DateRange, FounderDashboard } from './types';

export async function getFounderDashboard(
  range: DateRange,
  supabase: SupabaseClient<Database>,
): Promise<FounderDashboard> {
  const [posthog, operational] = await Promise.all([
    getPostHogMetrics(range),
    getSupabaseMetrics(supabase),
  ]);
  const providers = [
    posthog.status,
    operational.status,
    configuredProviderStatus('meta'),
    configuredProviderStatus('ga4'),
    configuredProviderStatus('gsc'),
  ];
  return {
    range,
    posthog,
    supabase: operational,
    providers,
    signals: buildCeoSignals(posthog, operational),
    generatedAt: new Date().toISOString(),
  };
}
