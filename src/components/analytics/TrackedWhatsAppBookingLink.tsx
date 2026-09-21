'use client';

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { trackGaEvent } from '@/lib/google-analytics';
import { trackPostHogEvent } from '@/lib/posthog';
import { cn } from '@/lib/utils';

interface TrackedWhatsAppBookingLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
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
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return `temp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`.slice(0, 64);
  }
}

export function TrackedWhatsAppBookingLink({
  href,
  clubId,
  clubSlug,
  clubName,
  children,
  onClick,
  className,
  ...props
}: TrackedWhatsAppBookingLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const properties = {
      club_id: clubId,
      club_slug: clubSlug,
      club_name: clubName,
      cta_surface: 'contact_whatsapp_booking',
      booking_channel: 'whatsapp',
      booking_status: 'intent_only',
    };

    trackGaEvent('whatsapp_booking_click', properties);
    trackPostHogEvent('whatsapp_booking_click', properties);

    const body = JSON.stringify({
      sessionId: visitorId(),
      path: window.location.pathname,
      eventType: 'whatsapp_booking_click',
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

  return (
    <a
      href={href}
      onClick={handleClick}
      {...props}
      className={cn(className, FOCUS_RING)}
    >
      {children}
    </a>
  );
}
