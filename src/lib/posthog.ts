'use client';

type PostHogClient = {
  capture?: (event: string, properties?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    posthog?: PostHogClient;
  }
}

const POSTHOG_INIT_RETRY_MS = 100;
const POSTHOG_INIT_MAX_ATTEMPTS = 50;

export function trackPostHogEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/api')) return;

  const payload = {
    ...properties,
    gameyer_traffic_scope: 'public',
  };

  const captureWhenReady = (attempt = 0) => {
    try {
      if (window.posthog?.capture) {
        window.posthog.capture(event, payload);
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
