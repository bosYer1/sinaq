'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'gameyer_visitor_id';
const REFERRER_KEY = 'gameyer_entry_referrer';

function getVisitorId() {
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

export function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    const visitorId = getVisitorId();
    const referrerHost = getEntryReferrerHost();
    const controller = new AbortController();

    void fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: visitorId, path: pathname, referrerHost }),
      credentials: 'same-origin',
      keepalive: true,
      signal: controller.signal,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [pathname]);

  return null;
}
