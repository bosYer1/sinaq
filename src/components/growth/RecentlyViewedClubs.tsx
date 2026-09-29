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

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function RecentlyViewedClubs({ clubs }: { clubs: AvailableClub[] }) {
  const [recent, setRecent] = useState<RecentClub[]>([]);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installBusy, setInstallBusy] = useState(false);
  const impressionTracked = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRecent(readRecentClubs());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
    if (standalone) return;

    const onInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstallPrompt(null);
      setInstallBusy(false);
    };

    window.addEventListener('beforeinstallprompt', onInstallAvailable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallAvailable);
      window.removeEventListener('appinstalled', onInstalled);
    };
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

  async function handleInstall() {
    if (!installPrompt || installBusy) return;

    setInstallBusy(true);
    trackPostHogEvent('pwa_install_cta_click', {
      surface: 'home_recently_viewed',
      recent_club_count: visibleClubs.length,
    });

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      trackPostHogEvent('pwa_install_cta_result', {
        surface: 'home_recently_viewed',
        outcome: choice.outcome,
        recent_club_count: visibleClubs.length,
      });
    } finally {
      setInstallPrompt(null);
      setInstallBusy(false);
    }
  }

  if (visibleClubs.length === 0) return null;

  return (
    <section
      aria-label="Son baxdığın klublar"
      className="mb-3 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-3 sm:mb-4 sm:px-4"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary sm:text-[11px]">Davam et</p>
          <h2 className="mt-0.5 font-display text-sm font-bold text-ink sm:text-base">Son baxdığın klublar</h2>
          <p className="mt-0.5 text-[11px] text-muted sm:text-xs">Qaldığın yerdən bir toxunuşla davam et.</p>
        </div>

        {installPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            disabled={installBusy}
            className="inline-flex h-9 shrink-0 items-center rounded-full border border-primary/25 bg-surface px-3 text-[11px] font-bold text-primary transition hover:border-primary disabled:cursor-wait disabled:opacity-60 sm:text-xs"
          >
            {installBusy ? 'Açılır…' : 'GameYer-i quraşdır'}
          </button>
        ) : null}
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
            className="min-w-[190px] max-w-[230px] flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 no-underline transition hover:border-primary/35 active:scale-[0.99]"
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
