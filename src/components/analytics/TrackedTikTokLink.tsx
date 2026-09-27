'use client';

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { trackGaEvent } from '@/lib/google-analytics';
import { trackPostHogEvent } from '@/lib/posthog';
import { cn } from '@/lib/utils';

interface TrackedTikTokLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  children: ReactNode;
}

const STORAGE_KEY = 'gameyer_visitor_id';
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

function visitorId() {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8 && existing.length <= 64) return existing;
    const next = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : (() => {
          const bytes = new Uint8Array(16);
          crypto.getRandomValues(bytes);
          return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
        })();
    window.localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return `temp-${Date.now().toString(36)}`.slice(0, 64);
  }
}

export function TrackedTikTokLink({ href, clubId, clubSlug, clubName, children, onClick, className, ...props }: TrackedTikTokLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const eventProperties = {
      club_id: clubId,
      club_slug: clubSlug,
      club_name: clubName,
      cta_surface: 'contact_tiktok',
    };

    trackGaEvent('tiktok_click', eventProperties);
    trackPostHogEvent('tiktok_click', eventProperties);

    const body = JSON.stringify({
      sessionId: visitorId(),
      path: window.location.pathname,
      eventType: 'tiktok_click',
      clubSlug,
    });

    try {
      if (navigator.sendBeacon) {
        const sent = navigator.sendBeacon('/api/analytics/event', new Blob([body], { type: 'application/json' }));
        if (sent) return;
      }
    } catch {
      // Fall through to keepalive fetch. Analytics must never block navigation.
    }

    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      credentials: 'same-origin',
      keepalive: true,
    }).catch(() => undefined);
  }

  return <a href={href} onClick={handleClick} {...props} className={cn(className, 'inline-flex min-h-11 items-center rounded-md px-2', FOCUS_RING)}>{children}</a>;
}
