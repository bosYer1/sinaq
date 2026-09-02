'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';

const CLUB_ENTRY_ORIGIN_KEY = 'gameyer:club-entry-origin';

type ClubEntryOrigin = {
  origin: string;
  destination: string;
};

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function rememberClubEntryOrigin(clubSlug: string) {
  if (typeof window === 'undefined') return;

  const entry: ClubEntryOrigin = {
    origin: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    destination: `/klub/${encodeURIComponent(clubSlug)}`,
  };

  try {
    window.sessionStorage.setItem(CLUB_ENTRY_ORIGIN_KEY, JSON.stringify(entry));
  } catch {
    // Navigation must still work when storage is unavailable.
  }
}

export function BackToClubsLink({ className }: { className?: string }) {
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

    const origin = entry.origin;
    event.preventDefault();
    try {
      window.sessionStorage.removeItem(CLUB_ENTRY_ORIGIN_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }

    // Do not restore the cached App Router history snapshot here. On mobile,
    // that snapshot can leave the discovery page visually restored but with
    // stale client state/listeners. Replacing the detail entry with the exact
    // remembered discovery URL gives us a clean interactive page while still
    // preserving filters/search in the URL.
    window.location.replace(origin);
  }

  return (
    <Link href="/" onClick={handleClick} className={className}>
      ← Klublara qayıt
    </Link>
  );
}
