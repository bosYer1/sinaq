'use client';

import { forwardRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ClubWithDistance } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { ClubLogo } from '@/components/clubs/ClubLogo';
import { MapPinIcon } from '@/components/ui/Icon';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { getPlatformStartingPrices } from '@/lib/pricing';
import { cn, formatPriceRange, isClubOpenNow, isPremiumActive } from '@/lib/utils';
import { formatDistance } from '@/lib/geo';

interface ClubCardProps {
  club: ClubWithDistance;
  active?: boolean;
  onMouseEnter?: () => void;
  imagePriority?: boolean;
}

export const ClubCard = forwardRef<HTMLAnchorElement, ClubCardProps>(function ClubCard({ club, active, onMouseEnter, imagePriority = false }, ref) {
  const isVerified = club.is_verified;
  const cover = club.images.find((image) => image.is_cover) ?? club.images[0];
  const useOfficialLogoAsCardImage = club.slug === 'milli-gaming-arena';
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

  const statusLabel = !hasHours ? 'Saat məlum deyil' : openNow ? 'Açıqdır' : 'Bağlıdır';
  const typeSlugs = inferClubTypeSlugs(club);
  const startingPrices = getPlatformStartingPrices(club.pricing);

  return (
    <Link
      ref={ref}
      href={`/klub/${encodeURIComponent(club.slug)}`}
      onMouseEnter={onMouseEnter}
      onFocus={onMouseEnter}
      className={cn(
        'group flex min-h-[112px] gap-3 rounded-xl border bg-white p-3 transition-all duration-150',
        active
          ? 'border-primary shadow-[0_8px_22px_rgba(124,92,252,0.12)] ring-1 ring-primary/10'
          : 'border-border shadow-[0_4px_14px_rgba(31,35,48,0.04)] hover:border-primary/35 hover:shadow-[0_8px_22px_rgba(31,35,48,0.08)]',
      )}
    >
      <div className="relative h-[88px] w-[104px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#F0ECFF] to-[#EEF6FF] ring-1 ring-border sm:w-[112px]">
        {useOfficialLogoAsCardImage ? (
          <ClubLogo slug={club.slug} name={club.name} className="h-full w-full rounded-lg border-0 bg-transparent text-3xl" imageClassName="p-0 object-cover" priority={imagePriority} />
        ) : cover ? (
          <Image src={cover.url} alt={club.name} fill sizes="112px" priority={imagePriority} className="object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
        ) : (
          <ClubLogo slug={club.slug} name={club.name} className="h-full w-full rounded-lg border-0 bg-transparent text-3xl" />
        )}
        {hasHours ? (
          <span className={cn('absolute left-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-white', openNow ? 'bg-live' : 'bg-red-500')} title={statusLabel} />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate font-display text-[15px] font-bold tracking-[-0.01em] text-ink transition group-hover:text-primary">{club.name}</h3>
          <div className="flex shrink-0 items-center gap-1">
            {isVerified ? <Badge tone="verified">✓</Badge> : null}
            {premiumActive ? <Badge tone="premium">VIP</Badge> : null}
          </div>
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-1 text-[11px] text-muted">
          <MapPinIcon width={13} height={13} className="shrink-0" />
          <span className="truncate">{club.district?.name ?? 'Rayon göstərilməyib'}{club.address ? ` · ${club.address}` : ''}</span>
        </div>

        {typeSlugs.length > 0 ? (
          <div className="mt-1.5 flex min-w-0 items-center gap-1 overflow-hidden">
            {typeSlugs.map((slug) => <Badge key={slug} tone={slug === 'pc' ? 'pc' : 'ps'}>{slug === 'pc' ? 'PC' : 'PlayStation'}</Badge>)}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="min-w-0 space-y-0.5">
            {startingPrices.pc ? (
              <div className="truncate text-[11px] font-bold text-[#0F9F5D]">PC: {formatPriceRange(startingPrices.pc.price_from, null, startingPrices.pc.unit)}</div>
            ) : null}
            {startingPrices.playstation ? (
              <div className="truncate text-[11px] font-bold text-[#0F9F5D]">PS: {formatPriceRange(startingPrices.playstation.price_from, null, startingPrices.playstation.unit)}</div>
            ) : null}
            {!startingPrices.pc && !startingPrices.playstation ? (
              <div className="text-[10px] text-muted">Qiymət məlum deyil</div>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            {club.distanceKm != null ? <div className="text-[10px] font-medium text-primary">{formatDistance(club.distanceKm)}</div> : null}
            <div className={cn('mt-0.5 text-[10px] font-semibold', !hasHours ? 'text-muted' : openNow ? 'text-live' : 'text-red-500')}>{statusLabel}</div>
          </div>
        </div>
      </div>
    </Link>
  );
});
