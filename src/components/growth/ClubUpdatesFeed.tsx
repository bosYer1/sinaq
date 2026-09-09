'use client';

import Link from 'next/link';
import { useEffect } from 'react';
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
  useEffect(() => {
    for (const update of updates) {
      trackPostHogEvent('club_update_impression', {
        update_id: update.id,
        update_kind: update.kind,
        club_id: update.club_id,
        club_slug: update.club.slug,
        context,
      });
    }
  }, [context, updates]);

  if (updates.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {updates.map((update) => {
        const startsAt = formatDate(update.starts_at);
        const endsAt = formatDate(update.ends_at);
        return (
          <article key={update.id} className="flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm">
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
