'use client';

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { trackGaEvent } from '@/lib/google-analytics';
import { clubActionEvent, trackMetaCustomEvent } from '@/lib/meta-pixel';
import { trackPostHogEvent } from '@/lib/posthog';

type EventType = 'maps_click' | 'phone_click' | 'instagram_click' | 'club_correction_click';
type CtaSurface = 'header_maps' | 'contact_phone' | 'contact_instagram' | 'contact_maps' | 'correction';

interface TrackedClubLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  eventType: EventType;
  clubId: string;
  clubSlug: string;
  clubName: string;
  ctaSurface?: CtaSurface;
  children: ReactNode;
}

const STORAGE_KEY = 'gameyer_visitor_id';

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

export function TrackedClubLink({ href, eventType, clubId, clubSlug, clubName, ctaSurface, children, onClick, ...props }: TrackedClubLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const eventProperties = {
      club_id: clubId,
      club_slug: clubSlug,
      club_name: clubName,
      ...(ctaSurface ? { cta_surface: ctaSurface } : {}),
    };
    trackMetaCustomEvent(clubActionEvent(eventType, { clubId, clubSlug, clubName }));
    trackGaEvent(eventType, eventProperties);
    trackPostHogEvent(eventType, eventProperties);

    const body = JSON.stringify({
      sessionId: visitorId(),
      path: window.location.pathname,
      eventType,
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

  return <a href={href} onClick={handleClick} {...props}>{children}</a>;
}
