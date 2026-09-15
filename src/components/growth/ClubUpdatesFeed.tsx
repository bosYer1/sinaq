'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { ClubLogo } from '@/components/clubs/ClubLogo';
import { trackPostHogEvent } from '@/lib/posthog';
import type { ClubUpdateItem } from '@/lib/queries/club-updates';

const BAKU_DATE_TIME = new Intl.DateTimeFormat('az-AZ', {
  timeZone: 'Asia/Baku',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : BAKU_DATE_TIME.format(date);
}

function kindLabel(kind: ClubUpdateItem['kind']) {
  return kind === 'tournament' ? 'Turnir' : 'Təklif';
}

export function ClubUpdatesFeed({ updates, context }: { updates: ClubUpdateItem[]; context: 'discovery' | 'club_detail' }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const isHomePreview = pathname === '/' && context === 'discovery';

  useEffect(() => {
    const root = rootRef.current;
    if (!root || updates.length === 0) return;

    const updatesById = new Map(updates.map((update) => [update.id, update]));
    const seen = new Set<string>();
    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-update-impression-id]'));

    const capture = (element: HTMLElement) => {
      const updateId = element.dataset.updateImpressionId;
      if (!updateId || seen.has(updateId)) return;
      const update = updatesById.get(updateId);
      if (!update) return;
      seen.add(updateId);
      trackPostHogEvent('club_update_impression', {
        update_id: update.id,
        update_kind: update.kind,
        club_id: update.club_id,
        club_slug: update.club.slug,
        context: isHomePreview ? 'home_preview' : context,
      });
    };

    if (!('IntersectionObserver' in window)) {
      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) capture(element);
      }
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.25) continue;
        const element = entry.target as HTMLElement;
        capture(element);
        observer.unobserve(element);
      }
    }, { threshold: 0.25 });

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [context, isHomePreview, updates]);

  if (updates.length === 0) return null;

  if (isHomePreview) {
    return (
      <div ref={rootRef} className="grid gap-3 lg:grid-cols-3">
        {updates.map((update, index) => (
          <Link
            key={update.id}
            data-update-impression-id={update.id}
            href={`/klub/${update.club.slug}`}
            onClick={() => trackPostHogEvent('club_update_club_click', {
              update_id: update.id,
              update_kind: update.kind,
              club_id: update.club_id,
              club_slug: update.club.slug,
              context: 'home_preview',
            })}
            className={`group ${index === 0 ? 'grid' : 'hidden sm:grid'} min-h-[138px] grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-2xl border border-border/80 bg-surface p-3 text-left no-underline shadow-[0_5px_18px_rgba(31,35,48,0.04)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(31,35,48,0.08)] xl:grid-cols-[108px_minmax(0,1fr)]`}
          >
            <ClubLogo
              slug={update.club.slug}
              name={update.club.name}
              className="h-[112px] w-24 rounded-xl border border-border bg-bg xl:w-[108px]"
              imageClassName="object-cover p-0"
            />
            <div className="min-w-0 py-0.5">
              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                {kindLabel(update.kind)}
              </span>
              <h3 className="mt-1.5 line-clamp-1 font-display text-sm font-bold leading-snug text-ink xl:text-[15px]">{update.title}</h3>
              {update.description ? <p className="mt-1 line-clamp-2 text-xs leading-[1.45] text-muted">{update.description}</p> : null}
              <p className="mt-2 line-clamp-1 text-[11px] font-semibold text-ink">
                {update.club.name}{update.club.district?.name ? ` · ${update.club.district.name}` : ''}
              </p>
              <p className="mt-1 text-[11px] font-bold text-primary">Kluba bax →</p>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {updates.map((update) => {
        const startsAt = formatDate(update.starts_at);
        const endsAt = formatDate(update.ends_at);
        const isOngoingOffer = update.kind === 'offer' && update.ends_at === null;
        return (
          <article key={update.id} data-update-impression-id={update.id} className="flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">{kindLabel(update.kind)}</span>
                <h3 className="mt-2 font-display text-base font-bold leading-snug text-ink">{update.title}</h3>
              </div>
            </div>

            {update.description ? <p className="mt-2 text-sm leading-5 text-muted">{update.description}</p> : null}

            <div className="mt-3 space-y-1 text-xs text-muted">
              {startsAt ? <p>Başlayır: <span className="font-medium text-ink">{startsAt}</span></p> : null}
              {endsAt ? <p>Bitir: <span className="font-medium text-ink">{endsAt}</span></p> : null}
              {isOngoingOffer ? <p>Vəziyyət: <span className="font-medium text-ink">Davam edən təklif</span></p> : null}
              <p>Klub: <span className="font-medium text-ink">{update.club.name}{update.club.district?.name ? ` · ${update.club.district.name}` : ''}</span></p>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              {context === 'discovery' ? (
                <Link
                  href={`/klub/${update.club.slug}`}
                  onClick={() => trackPostHogEvent('club_update_club_click', {
                    update_id: update.id,
                    update_kind: update.kind,
                    club_id: update.club_id,
                    club_slug: update.club.slug,
                    context,
                  })}
                  className="rounded-control bg-primary px-3 py-2 text-xs font-semibold text-white no-underline transition hover:opacity-90"
                >
                  Kluba bax
                </Link>
              ) : null}
              <a
                href={update.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackPostHogEvent('club_update_source_click', {
                  update_id: update.id,
                  update_kind: update.kind,
                  club_id: update.club_id,
                  club_slug: update.club.slug,
                  source_type: update.source_type,
                  context,
                })}
                className={context === 'club_detail'
                  ? 'rounded-control bg-primary px-3 py-2 text-xs font-semibold text-white no-underline transition hover:opacity-90'
                  : 'rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink no-underline transition hover:border-primary'}
              >
                Rəsmi mənbə
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}