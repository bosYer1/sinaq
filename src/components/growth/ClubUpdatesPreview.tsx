'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ClubLogo } from '@/components/clubs/ClubLogo';
import { trackPostHogEvent } from '@/lib/posthog';
import type { ClubUpdateItem } from '@/lib/queries/club-updates';

function kindLabel(kind: ClubUpdateItem['kind']) {
  return kind === 'tournament' ? 'Turnir' : 'Təklif';
}

export function ClubUpdatesPreview({ updates }: { updates: ClubUpdateItem[] }) {
  useEffect(() => {
    for (const update of updates) {
      trackPostHogEvent('club_update_impression', {
        update_id: update.id,
        update_kind: update.kind,
        club_id: update.club_id,
        club_slug: update.club.slug,
        context: 'home_preview',
      });
    }
  }, [updates]);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {updates.map((update) => (
        <Link
          key={update.id}
          href={`/klub/${update.club.slug}`}
          onClick={() => trackPostHogEvent('club_update_club_click', {
            update_id: update.id,
            update_kind: update.kind,
            club_id: update.club_id,
            club_slug: update.club.slug,
            context: 'home_preview',
          })}
          className="group grid min-h-[138px] grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-2xl border border-border/80 bg-surface p-3 text-left no-underline shadow-[0_5px_18px_rgba(31,35,48,0.04)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(31,35,48,0.08)] xl:grid-cols-[108px_minmax(0,1fr)]"
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
            <h3 className="mt-1.5 line-clamp-1 font-display text-sm font-bold leading-snug text-ink xl:text-[15px]">
              {update.title}
            </h3>
            {update.description ? (
              <p className="mt-1 line-clamp-2 text-xs leading-[1.45] text-muted">{update.description}</p>
            ) : null}
            <p className="mt-2 line-clamp-1 text-[11px] font-semibold text-ink">
              {update.club.name}{update.club.district?.name ? ` · ${update.club.district.name}` : ''}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
