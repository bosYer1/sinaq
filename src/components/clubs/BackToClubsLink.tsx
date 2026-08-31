'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isPlainLeftClick(event)) return;

    let entry: ClubEntryOrigin | null = null;
    try {
      const rawEntry = window.sessionStorage.getItem(CLUB_ENTRY_ORIGIN_KEY);
      if (rawEntry) entry = JSON.parse(rawEntry) as ClubEntryOrigin;
    } catch {
      entry = null;
    }

    const validEntry =
      entry &&
      entry.destination === window.location.pathname &&
      entry.origin.startsWith('/') &&
      !entry.origin.startsWith('/klub/');

    if (!validEntry) return;

    event.preventDefault();
    try {
      window.sessionStorage.removeItem(CLUB_ENTRY_ORIGIN_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }

    // Reuse the existing history entry instead of rendering a fresh homepage.
    // This preserves the previous list/filter/scroll snapshot and avoids the return flicker.
    router.back();
  }

  return (
    <Link href="/" onClick={handleClick} className={className}>
      ← Klublara qayıt
    </Link>
  );
}
