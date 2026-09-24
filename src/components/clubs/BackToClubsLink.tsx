'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import Link from 'next/link';

const CLUB_ENTRY_ORIGIN_KEY = 'gameyer:club-entry-origin';
const MOBILE_EXPANDED_STATE_KEY = 'gameyer:mobile-expanded-state';

type ClubEntryOrigin = {
  origin: string;
  destination: string;
};

type MobileExpandedState = {
  origin?: string;
  scrollY?: number;
};

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function currentOrigin() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function rememberClubEntryOrigin(clubSlug: string) {
  if (typeof window === 'undefined') return;

  const origin = currentOrigin();
  const entry: ClubEntryOrigin = {
    origin,
    destination: `/klub/${encodeURIComponent(clubSlug)}`,
  };

  try {
    window.sessionStorage.setItem(CLUB_ENTRY_ORIGIN_KEY, JSON.stringify(entry));

    const rawExpandedState = window.sessionStorage.getItem(MOBILE_EXPANDED_STATE_KEY);
    if (rawExpandedState) {
      const expandedState = JSON.parse(rawExpandedState) as MobileExpandedState;
      if (expandedState.origin === origin) {
        window.sessionStorage.setItem(MOBILE_EXPANDED_STATE_KEY, JSON.stringify({
          origin,
          scrollY: Math.max(0, window.scrollY),
        }));
      }
    }
  } catch {
    // Navigation must still work when storage is unavailable.
  }
}

function returnLabel(origin: string) {
  try {
    const url = new URL(origin, 'https://gameyer.az');
    const params = url.searchParams;
    if (params.get('q')?.trim()) return 'Axtarış nəticələrinə qayıt';
    if (params.get('view') === 'map') return 'Xəritəyə qayıt';
    if (params.get('district') || params.get('type') || params.get('price_max')) return 'Filtrlənmiş klublara qayıt';
  } catch {
    // Fall back to the generic discovery label.
  }
  return 'Klublara qayıt';
}

export function BackToClubsLink({ className }: { className?: string }) {
  const [label, setLabel] = useState('Klublara qayıt');
  const [fallbackHref, setFallbackHref] = useState('/');

  useEffect(() => {
    try {
      const rawEntry = window.sessionStorage.getItem(CLUB_ENTRY_ORIGIN_KEY);
      if (!rawEntry) return;
      const entry = JSON.parse(rawEntry) as ClubEntryOrigin;
      if (
        entry.destination !== window.location.pathname ||
        !entry.origin.startsWith('/') ||
        entry.origin.startsWith('/klub/')
      ) {
        return;
      }

      setLabel(returnLabel(entry.origin));
      setFallbackHref(entry.origin);
    } catch {
      // Keep the generic fallback when the remembered origin is unavailable.
    }
  }, []);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isPlainLeftClick(event)) return;

    let entry: ClubEntryOrigin | null = null;
    try {
      const rawEntry = window.sessionStorage.getItem(CLUB_ENTRY_ORIGIN_KEY);
      if (rawEntry) entry = JSON.parse(rawEntry) as ClubEntryOrigin;
    } catch {
      entry = null;
    }

    if (
      !entry ||
      entry.destination !== window.location.pathname ||
      !entry.origin.startsWith('/') ||
      entry.origin.startsWith('/klub/')
    ) {
      return;
    }

    event.preventDefault();
    try {
      window.sessionStorage.removeItem(CLUB_ENTRY_ORIGIN_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }

    // Club details are reached through a client-side Link. Returning through the
    // same history entry reuses the already-rendered discovery route instead of
    // forcing a new document request/loading screen.
    window.history.back();
  }

  return (
    <Link href={fallbackHref} onClick={handleClick} className={className}>
      ← {label}
    </Link>
  );
}
