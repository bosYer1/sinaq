'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CLUB_ENTRY_ORIGIN_KEY = 'gameyer:club-entry-origin';

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function rememberClubEntryOrigin() {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(
      CLUB_ENTRY_ORIGIN_KEY,
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  } catch {
    // Navigation must still work when storage is unavailable.
  }
}

export function BackToClubsLink({ className }: { className?: string }) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isPlainLeftClick(event)) return;

    let origin: string | null = null;
    try {
      origin = window.sessionStorage.getItem(CLUB_ENTRY_ORIGIN_KEY);
    } catch {
      origin = null;
    }

    if (!origin || !origin.startsWith('/') || origin.startsWith('/klub/')) return;

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
