'use client';

import { useSyncExternalStore, type MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

function currentDiscoveryScrollTop() {
  const scrollRoot = document.querySelector<HTMLElement>('[data-mobile-scroll-root="true"]');
  return Math.max(0, scrollRoot?.scrollTop ?? window.scrollY);
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
          scrollY: currentDiscoveryScrollTop(),
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

function subscribeClubEntryOrigin() {
  return () => {};
}

function getClubEntryOriginSnapshot() {
  try {
    return window.sessionStorage.getItem(CLUB_ENTRY_ORIGIN_KEY) ?? '';
  } catch {
    return '';
  }
}

function getServerClubEntryOriginSnapshot() {
  return '';
}

function parseClubEntryOrigin(rawEntry: string, pathname: string): ClubEntryOrigin | null {
  if (!rawEntry) return null;

  try {
    const entry = JSON.parse(rawEntry) as ClubEntryOrigin;
    if (
      entry.destination !== pathname ||
      !entry.origin.startsWith('/') ||
      entry.origin.startsWith('/klub/')
    ) {
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function BackToClubsLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const rawEntry = useSyncExternalStore(
    subscribeClubEntryOrigin,
    getClubEntryOriginSnapshot,
    getServerClubEntryOriginSnapshot,
  );
  const entry = parseClubEntryOrigin(rawEntry, pathname);
  const label = entry ? returnLabel(entry.origin) : 'Klublara qayıt';
  const fallbackHref = entry?.origin ?? '/';

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isPlainLeftClick(event) || !entry) return;

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
    <Link href={fallbackHref} onClick={handleClick} className={className} data-back-to-clubs="true">
      ← {label}
    </Link>
  );
}
