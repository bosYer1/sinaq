'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackGaEvent } from '@/lib/google-analytics';
import { submissionSuccessEvent, trackMetaCustomEvent } from '@/lib/meta-pixel';
import { trackPostHogEvent } from '@/lib/posthog';

const VISITOR_KEY = 'gameyer_visitor_id';
const VISIT_KEY = 'gameyer_visit_id';
const REFERRER_KEY = 'gameyer_entry_referrer';

function randomId(prefix: string) {
  const id = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}${id}`.slice(0, 64);
}

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing && existing.length >= 8 && existing.length <= 64) return existing;

    const next = randomId('v-');
    window.localStorage.setItem(VISITOR_KEY, next);
    return next;
  } catch {
    return randomId('temp-v-');
  }
}

function getVisitId() {
  try {
    const existing = window.sessionStorage.getItem(VISIT_KEY);
    if (existing && existing.length >= 8 && existing.length <= 64) return existing;

    const next = randomId('s-');
    window.sessionStorage.setItem(VISIT_KEY, next);
    return next;
  } catch {
    return randomId('temp-s-');
  }
}

function getEntryReferrerHost() {
  try {
    const stored = window.sessionStorage.getItem(REFERRER_KEY);
    if (stored !== null) return stored || null;

    let host: string | null = null;
    if (document.referrer) {
      const referrer = new URL(document.referrer);
      if (referrer.host && referrer.host !== window.location.host) host = referrer.host.slice(0, 255);
    }

    window.sessionStorage.setItem(REFERRER_KEY, host ?? '');
    return host;
  } catch {
    return null;
  }
}

function trackSubmissionSuccess(pathname: string) {
  if (pathname !== '/elaqe' && pathname !== '/klub-sahibi') return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('sent') !== '1') return;

  const surface = pathname === '/klub-sahibi' ? 'club_owner' : 'contact';
  const clubSlug = params.get('slug');
  const clubName = params.get('club');
  const key = `gameyer_submission_success:${surface}:${clubSlug ?? ''}:${clubName ?? ''}`;

  try {
    if (window.sessionStorage.getItem(key) === '1') return;
    window.sessionStorage.setItem(key, '1');
  } catch {
    // Session storage is optional; event capture can still proceed.
  }

  const eventProperties = {
    surface,
    club_slug: clubSlug,
    club_name: clubName,
  };
  trackPostHogEvent('submission_success', eventProperties);
  trackGaEvent('submission_success', eventProperties);
  trackMetaCustomEvent(submissionSuccessEvent(surface, clubSlug, clubName));
}

export function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    trackSubmissionSuccess(pathname);

    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    const visitorId = getVisitorId();
    const visitId = getVisitId();
    const referrerHost = getEntryReferrerHost();

    void fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: visitorId, visitId, path: pathname, referrerHost }),
      credentials: 'same-origin',
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
