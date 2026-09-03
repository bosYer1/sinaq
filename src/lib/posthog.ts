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

export function trackPostHogEvent(
  event: string,
  properties?: Record<string, unknown>,
  options?: PostHogCaptureOptions,
) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/api')) return;

  const payload = {
    ...properties,
    gameyer_traffic_scope: 'public',
  };

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
