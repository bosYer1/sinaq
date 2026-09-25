'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { rememberClubEntryOrigin } from '@/components/clubs/BackToClubsLink';
import { trackPostHogEvent } from '@/lib/posthog';
import { readRecentClubs, type RecentClub } from '@/lib/recent-clubs';

type AvailableClub = {
  slug: string;
  name: string;
  district: string | null;
};

export function RecentlyViewedClubs({ clubs }: { clubs: AvailableClub[] }) {
  const [recent, setRecent] = useState<RecentClub[]>([]);
  const impressionTracked = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRecent(readRecentClubs());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const visibleClubs = useMemo(() => {
    if (recent.length === 0) return [];

    const clubsBySlug = new Map(clubs.map((club) => [club.slug, club]));
    return recent
      .map((entry) => clubsBySlug.get(entry.slug))
      .filter((club): club is AvailableClub => Boolean(club));
  }, [clubs, recent]);

  useEffect(() => {
    if (visibleClubs.length === 0 || impressionTracked.current) return;
    impressionTracked.current = true;
    trackPostHogEvent('recent_clubs_impression', {
      club_count: visibleClubs.length,
      surface: 'home_recently_viewed',
    });
  }, [visibleClubs.length]);

  if (visibleClubs.length === 0) return null;

  return (
    <section
      aria-label="Son baxdığın klublar"
      className="mb-3 rounded-2xl border border-border bg-surface px-3 py-3 sm:mb-4 sm:px-4"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold text-ink sm:text-base">Son baxdığın klublar</h2>
          <p className="mt-0.5 text-[11px] text-muted sm:text-xs">Qaldığın yerdən davam et.</p>
        </div>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleClubs.map((club, index) => (
          <Link
            key={club.slug}
            href={`/klub/${encodeURIComponent(club.slug)}`}
            prefetch={false}
            onClick={() => {
              rememberClubEntryOrigin(club.slug);
              trackPostHogEvent('recent_club_click', {
                club_slug: club.slug,
                club_name: club.name,
                list_position: index + 1,
                surface: 'home_recently_viewed',
              }, {
                send_instantly: true,
                transport: 'sendBeacon',
              });
            }}
            className="min-w-[190px] max-w-[230px] flex-1 rounded-xl border border-border bg-bg-elevated px-3 py-2.5 no-underline transition hover:border-primary/35 active:scale-[0.99]"
          >
            <p className="truncate text-sm font-bold text-ink">{club.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted">{club.district ?? 'Rayon göstərilməyib'}</p>
            <span className="mt-1.5 inline-flex text-[11px] font-bold text-primary">Yenidən bax →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
