import 'server-only';

import type { ProviderKey, ProviderStatus } from './types';

const LABELS: Record<ProviderKey, string> = {
  posthog: 'PostHog',
  supabase: 'Supabase',
  meta: 'Meta Ads',
  ga4: 'Google Analytics 4',
  gsc: 'Google Search Console',
};

const PROVIDER_ENV: Record<Exclude<ProviderKey, 'supabase'>, string[]> = {
  posthog: ['POSTHOG_PERSONAL_API_KEY', 'POSTHOG_PROJECT_ID'],
  meta: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'],
  ga4: ['GA4_PROPERTY_ID', 'GOOGLE_ANALYTICS_CLIENT_EMAIL', 'GOOGLE_ANALYTICS_PRIVATE_KEY'],
  gsc: ['GSC_SITE_URL', 'GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL', 'GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY'],
};

export function providerStatus(
  key: ProviderKey,
  status: ProviderStatus['status'],
  detail: string,
): ProviderStatus {
  return { key, label: LABELS[key], status, detail, checkedAt: new Date().toISOString() };
}

export function configuredProviderStatus(key: Exclude<ProviderKey, 'supabase' | 'posthog'>): ProviderStatus {
  const missing = PROVIDER_ENV[key].filter((name) => !process.env[name]?.trim());
  return missing.length === 0
    ? providerStatus(key, 'unavailable', 'Provider adapter hazırdır, data sorğusu V1-dən sonrakı mərhələyə saxlanılıb.')
    : providerStatus(key, 'unavailable', `Konfiqurasiya yoxdur: ${missing.join(', ')}`);
}
