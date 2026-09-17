'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
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

type UpdatesFilter = 'all' | ClubUpdateItem['kind'] | 'active';

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : BAKU_DATE_TIME.format(date);
}

function kindLabel(kind: ClubUpdateItem['kind']) {
  return kind === 'tournament' ? 'Turnir' : 'Təklif';
}

function updateAnchor(updateId: string) {
  return `teklif-${updateId}`;
}

function updateStatus(update: ClubUpdateItem, startsAt: string | null, endsAt: string | null) {
  if (update.kind === 'offer' && update.ends_at === null) return 'Davam edən təklif';
  if (update.kind === 'tournament' && startsAt) return `Başlayır: ${startsAt}`;
  if (endsAt) return `Bitir: ${endsAt}`;
  return 'Aktiv yenilik';
}

const FILTERS: Array<{ value: UpdatesFilter; label: string; icon?: string }> = [
  { value: 'all', label: 'Hamısı' },
  { value: 'offer', label: 'Təkliflər', icon: '🔥' },
  { value: 'tournament', label: 'Turnirlər', icon: '🏆' },
  { value: 'active', label: 'Aktiv', icon: '●' },
];

export function ClubUpdatesFeed({ updates, context }: { updates: ClubUpdateItem[]; context: 'discovery' | 'club_detail' }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<UpdatesFilter>('all');
  const isHomePreview = pathname === '/' && context === 'discovery';
  const isUpdatesPage = pathname === '/yenilikler' && context === 'discovery';
  const visibleUpdates = useMemo(() => {
    if (!isUpdatesPage || filter === 'all') return updates;
    if (filter === 'active') return updates.filter((update) => update.kind === 'offer' && update.ends_at === null);
    return updates.filter((update) => update.kind === filter);
  }, [filter, isUpdatesPage, updates]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || visibleUpdates.length === 0) return;

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
      const viewportHeight = document.documentElement.clientHeight;
      const viewportWidth = document.documentElement.clientWidth;
      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (
          rect.width > 0 && rect.height > 0
          && rect.bottom > 0 && rect.top < viewportHeight
          && rect.right > 0 && rect.left < viewportWidth
        ) capture(element);
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
  }, [context, isHomePreview, updates, visibleUpdates]);

  if (updates.length === 0) return null;

  if (isHomePreview) {
    return (
      <div
        ref={rootRef}
        className="-mx-4 flex snap-x snap-proximity gap-2.5 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
      >
        {updates.map((update) => (
          <Link
            key={update.id}
            data-update-impression-id={update.id}
            href={`/yenilikler#${updateAnchor(update.id)}`}
            onClick={() => trackPostHogEvent('club_update_detail_click', {
              update_id: update.id,
              update_kind: update.kind,
              club_id: update.club_id,
              club_slug: update.club.slug,
              context: 'home_preview',
            })}
            className="group grid min-h-[94px] w-[228px] shrink-0 snap-start grid-cols-[68px_minmax(0,1fr)] gap-2.5 rounded-xl border border-border/80 bg-surface p-2.5 text-left no-underline shadow-[0_3px_12px_rgba(31,35,48,0.04)] transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[0_6px_18px_rgba(31,35,48,0.07)]"
          >
            <ClubLogo
              slug={update.club.slug}
              name={update.club.name}
              profileImageUrl={update.club.profile_image_url}
              className="h-[68px] w-[68px] self-center rounded-xl border border-border/80 bg-bg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]"
              imageClassName="object-contain p-1.5"
            />
            <div className="min-w-0 self-center">
              <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.07em] text-primary">
                {kindLabel(update.kind)}
              </span>
              <h3 className="mt-1 line-clamp-2 font-display text-[13px] font-bold leading-[1.25] text-ink">{update.title}</h3>
              <p className="mt-1.5 line-clamp-1 text-[10px] font-semibold text-muted">
                {update.club.name}{update.club.district?.name ? ` · ${update.club.district.name}` : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  if (isUpdatesPage) {
    return (
      <div ref={rootRef}>
        <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Yenilik filtrləri">
          {FILTERS.map((item) => {
            const selected = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(item.value)}
                className={selected
                  ? 'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(112,78,255,0.18)] transition'
                  : 'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-ink transition hover:border-primary/40'}
              >
                {item.icon ? <span aria-hidden="true" className={item.value === 'active' ? 'text-emerald-500' : ''}>{item.icon}</span> : null}
                {item.label}
              </button>
            );
          })}
        </div>

        {visibleUpdates.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleUpdates.map((update) => {
              const startsAt = formatDate(update.starts_at);
              const endsAt = formatDate(update.ends_at);
              const isOngoingOffer = update.kind === 'offer' && update.ends_at === null;
              const status = updateStatus(update, startsAt, endsAt);

              return (
                <article
                  key={update.id}
                  id={updateAnchor(update.id)}
                  data-update-impression-id={update.id}
                  className="group scroll-mt-28 grid grid-cols-[112px_minmax(0,1fr)] gap-3 rounded-[24px] border border-border/80 bg-surface p-3 shadow-[0_8px_28px_rgba(31,35,48,0.06)] transition-[border-color,box-shadow,transform] target:border-primary target:ring-2 target:ring-primary/15 hover:border-primary/20 hover:shadow-[0_14px_36px_rgba(31,35,48,0.09)] sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-5 sm:p-4"
                >
                  <div className="relative aspect-square self-start overflow-hidden rounded-[18px] border border-border/70 bg-bg p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)] sm:p-4">
                    <ClubLogo
                      slug={update.club.slug}
                      name={update.club.name}
                      profileImageUrl={update.club.profile_image_url}
                      className="h-full w-full rounded-[14px] border-0 bg-transparent"
                      imageClassName="h-full w-full object-contain p-1 sm:p-2"
                    />
                  </div>

                  <div className="flex min-w-0 flex-col py-0.5">
                    <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary sm:text-[11px]">
                      {kindLabel(update.kind)}
                    </span>
                    <h3 className="mt-2 line-clamp-2 font-display text-[15px] font-bold leading-[1.25] text-ink sm:text-lg">{update.title}</h3>
                    {update.description ? <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-muted sm:text-sm">{update.description}</p> : null}

                    <div className="mt-3 flex min-w-0 items-center gap-2">
                      <ClubLogo
                        slug={update.club.slug}
                        name={update.club.name}
                        profileImageUrl={update.club.profile_image_url}
                        className="h-8 w-8 shrink-0 rounded-lg border border-border bg-bg sm:h-9 sm:w-9"
                        imageClassName="object-contain p-1"
                      />
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-[11px] font-bold text-ink sm:text-xs">{update.club.name}</p>
                        {update.club.district?.name ? <p className="mt-0.5 line-clamp-1 text-[10px] text-muted sm:text-[11px]">⌖ {update.club.district.name}</p> : null}
                      </div>
                    </div>

                    <div className={isOngoingOffer
                      ? 'mt-2.5 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 sm:text-[11px]'
                      : 'mt-2.5 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary sm:text-[11px]'}>
                      <span className={isOngoingOffer ? 'h-2 w-2 shrink-0 rounded-full bg-emerald-500' : 'h-2 w-2 shrink-0 rounded-full bg-primary'} aria-hidden="true" />
                      <span className="line-clamp-1">{status}</span>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
                      <Link
                        href={`/klub/${update.club.slug}`}
                        onClick={() => trackPostHogEvent('club_update_club_click', {
                          update_id: update.id,
                          update_kind: update.kind,
                          club_id: update.club_id,
                          club_slug: update.club.slug,
                          context,
                        })}
                        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-control bg-primary px-2.5 py-2 text-center text-xs font-semibold text-white no-underline transition hover:opacity-90"
                      >
                        <span aria-hidden="true">↗</span> Kluba bax
                      </Link>
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
                        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-control border border-border bg-bg px-2 py-2 text-center text-xs font-semibold text-ink no-underline transition hover:border-primary"
                      >
                        <span aria-hidden="true">↗</span> Rəsmi mənbə
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-border bg-surface px-5 py-10 text-center">
            <p className="font-display text-base font-bold text-ink">Bu filtr üzrə aktiv yenilik yoxdur</p>
            <p className="mt-1 text-sm text-muted">Digər kateqoriyanı seçərək aktiv təklif və turnirlərə bax.</p>
          </div>
        )}
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
          <article
            key={update.id}
            id={updateAnchor(update.id)}
            data-update-impression-id={update.id}
            className="scroll-mt-24 flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm target:border-primary target:ring-2 target:ring-primary/15"
          >
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