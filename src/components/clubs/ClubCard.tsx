'use client';

import { forwardRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ClubWithDistance } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { ClubLogo } from '@/components/clubs/ClubLogo';
import { MapPinIcon } from '@/components/ui/Icon';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { cn, formatPriceRange, isClubOpenNow, isPremiumActive } from '@/lib/utils';
import { formatDistance } from '@/lib/geo';

interface ClubCardProps {
  club: ClubWithDistance;
  active?: boolean;
  onMouseEnter?: () => void;
}

export const ClubCard = forwardRef<HTMLAnchorElement, ClubCardProps>(function ClubCard({ club, active, onMouseEnter }, ref) {
  const isVerified = club.is_verified;
  const cover = club.images.find((image) => image.is_cover) ?? club.images[0];
  const hasHours = club.opening_hours.length > 0;
  const [openNow, setOpenNow] = useState(() => hasHours ? isClubOpenNow(club.opening_hours) : false);
  const [premiumActive, setPremiumActive] = useState(() => isPremiumActive(club));

  useEffect(() => {
    const refreshLiveState = () => {
      setOpenNow(hasHours ? isClubOpenNow(club.opening_hours) : false);
      setPremiumActive(isPremiumActive(club));
    };
    refreshLiveState();
    const timer = window.setInterval(refreshLiveState, 60_000);
    return () => window.clearInterval(timer);
  }, [club, hasHours]);

  const statusLabel = !hasHours ? 'İş saatı məlum deyil' : openNow ? 'Açıqdır' : 'Bağlıdır';
  const typeSlugs = inferClubTypeSlugs(club);
  const realPricing = club.pricing.filter((pricing) => pricing.price_from > 0);
  const cheapestPricing = [...realPricing].sort((a, b) => a.price_from - b.price_from)[0];

  return (
    <Link
      ref={ref}
      href={`/klub/${encodeURIComponent(club.slug)}`}
      onMouseEnter={onMouseEnter}
      onFocus={onMouseEnter}
      className={cn(
        'group relative flex gap-3 overflow-hidden rounded-card border bg-surface p-3 transition-all duration-150 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-gradient-to-b before:from-primary before:to-ps before:opacity-0 before:transition-opacity',
        active
          ? 'border-primary shadow-card-hover ring-1 ring-primary/15 before:opacity-100'
          : 'border-border shadow-card hover:-translate-y-px hover:border-primary/35 hover:shadow-card-hover hover:before:opacity-100'
      )}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[12px] bg-gradient-to-br from-pc-tint to-surface-alt ring-1 ring-border">
        {cover ? (
          <Image src={cover.url} alt={club.name} fill sizes="80px" className="object-cover transition-transform duration-200 group-hover:scale-[1.04]" />
        ) : (
          <ClubLogo slug={club.slug} name={club.name} className="h-full w-full rounded-[12px] border-0 bg-transparent text-3xl" />
        )}
        {openNow ? <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-live ring-2 ring-white shadow-sm" title="Hazırda açıqdır" /> : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate font-display text-[15px] font-bold tracking-[-0.01em] text-ink transition group-hover:text-primary">{club.name}</h3>
          <div className="flex shrink-0 items-center gap-1">{isVerified ? <Badge tone="verified">✓</Badge> : null}{premiumActive ? <Badge tone="premium">VIP</Badge> : null}</div>
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted">
          <MapPinIcon width={13} height={13} className="shrink-0 text-primary/70" />
          <span className="truncate">{club.district?.name ?? 'Rayon göstərilməyib'}{club.address ? ` · ${club.address}` : ''}</span>
        </div>

        {typeSlugs.length > 0 ? <div className="mt-2 flex min-w-0 items-center gap-1.5 overflow-hidden">{typeSlugs.map((slug) => <Badge key={slug} tone={slug === 'pc' ? 'pc' : 'ps'}>{slug === 'pc' ? 'PC Gaming' : 'PlayStation'}</Badge>)}</div> : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="min-w-0">{club.distanceKm != null ? <span className="whitespace-nowrap text-[11px] font-medium text-muted">{formatDistance(club.distanceKm)}</span> : null}</div>
          <div className="shrink-0 text-right">
            {cheapestPricing ? <div className="font-mono text-xs font-semibold text-ink">{formatPriceRange(cheapestPricing.price_from, cheapestPricing.price_to, cheapestPricing.unit)}</div> : <div className="text-[10px] text-muted">Qiymət məlum deyil</div>}
            <div className={cn('mt-0.5 text-[10px] font-semibold', openNow ? 'text-live' : 'text-muted')}>{statusLabel}</div>
          </div>
        </div>
      </div>
    </Link>
  );
});
