'use client';

type PostHogCaptureOptions = {
  send_instantly?: boolean;
  transport?: 'XHR' | 'fetch' | 'sendBeacon';
};

type PostHogClient = {
  __loaded?: boolean;
  capture?: (event: string, properties?: Record<string, unknown>, options?: PostHogCaptureOptions) => void;
};

declare global {
  interface Window {
    posthog?: PostHogClient;
  }
}

const POSTHOG_INIT_RETRY_MS = 100;
const POSTHOG_INIT_MAX_ATTEMPTS = 50;

function normalizeAnalyticsHostname(hostname: string | null | undefined) {
  return (hostname ?? '').trim().toLowerCase();
}

export function isPublicAnalyticsHostname(hostname: string | null | undefined) {
  const normalizedHostname = normalizeAnalyticsHostname(hostname);
  return normalizedHostname === 'gameyer.az' || normalizedHostname === 'www.gameyer.az';
}

export function isTestAnalyticsHostname(hostname: string | null | undefined) {
  const normalizedHostname = normalizeAnalyticsHostname(hostname);
  return normalizedHostname === 'localhost'
    || normalizedHostname === '127.0.0.1'
    || normalizedHostname === '::1'
    || normalizedHostname.endsWith('.localhost')
    || normalizedHostname.endsWith('.vercel.app');
}

export function getAnalyticsTrafficScope(hostname: string | null | undefined): 'public' | 'test' | null {
  if (isPublicAnalyticsHostname(hostname)) return 'public';
  if (isTestAnalyticsHostname(hostname)) return 'test';
  return null;
}

export function trackPostHogEvent(
  event: string,
  properties?: Record<string, unknown>,
  options?: PostHogCaptureOptions,
) {
  if (typeof window === 'undefined') return;

  const trafficScope = getAnalyticsTrafficScope(window.location.hostname);
  if (!trafficScope) return;
  if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/api')) return;

  const payload: Record<string, unknown> = {
    ...properties,
    gameyer_traffic_scope: trafficScope,
  };

  if (trafficScope === 'test') {
    payload.gameyer_analytics_test = true;
  }

  const captureWhenReady = (attempt = 0) => {
    try {
      const client = window.posthog;
      if (client?.__loaded === true && client.capture) {
        client.capture(event, payload, options);
        return;
      }
    } catch {
      return;
    }

    if (attempt >= POSTHOG_INIT_MAX_ATTEMPTS) return;
    window.setTimeout(() => captureWhenReady(attempt + 1), POSTHOG_INIT_RETRY_MS);
  };

  captureWhenReady();
}
