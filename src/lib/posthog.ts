'use client';

type PostHogClient = {
  capture?: (event: string, properties?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    posthog?: PostHogClient;
  }
}

export function trackPostHogEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/api')) return;

  try {
    window.posthog?.capture?.(event, {
      ...properties,
      gameyer_traffic_scope: 'public',
    });
  } catch {
    // Analytics must never break product interactions.
  }
}
