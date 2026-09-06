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

export function trackPostHogEvent(
  event: string,
  properties?: Record<string, unknown>,
  options?: PostHogCaptureOptions,
) {
  if (typeof window === 'undefined') return;

  const isPublicHost = isPublicAnalyticsHostname(window.location.hostname);
  const isTestHost = isTestAnalyticsHostname(window.location.hostname);
  if (!isPublicHost && !isTestHost) return;
  if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/api')) return;

  const payload: Record<string, unknown> = {
    ...properties,
    gameyer_traffic_scope: 'public',
  };

  if (isTestHost) {
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
