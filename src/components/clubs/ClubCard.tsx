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

interface ClubCardProps { club: ClubWithDistance; active?: boolean; onMouseEnter?: () => void; }

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

  const statusLabel = !hasHours ? 'Saat məlum deyil' : openNow ? 'Açıqdır' : 'Bağlıdır';
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
        'group relative overflow-hidden rounded-[20px] border bg-surface shadow-[0_18px_50px_-34px_rgba(0,0,0,.9)] transition-all duration-200',
        active
          ? 'border-primary/55 ring-1 ring-primary/15 shadow-[0_20px_55px_-30px_rgba(155,107,255,.45)]'
          : 'border-white/8 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_24px_60px_-34px_rgba(155,107,255,.32)]'
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#241B3B] via-[#171D2A] to-[#102B35]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(155,107,255,.28),transparent_42%),radial-gradient(circle_at_88%_90%,rgba(50,211,242,.17),transparent_38%)]" />
        {cover ? (
          <Image src={cover.url} alt={club.name} fill sizes="(max-width: 1024px) 100vw, 420px" className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><ClubLogo slug={club.slug} name={club.name} className="h-20 w-20 rounded-2xl border border-white/10 bg-white/[.055] text-3xl text-white shadow-lg backdrop-blur" /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {typeSlugs.map((slug) => <Badge key={slug} tone={slug === 'pc' ? 'pc' : 'ps'}>{slug === 'pc' ? 'PC' : 'PlayStation'}</Badge>)}
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {isVerified ? <Badge tone="verified">✓</Badge> : null}
          {premiumActive ? <Badge tone="premium">VIP</Badge> : null}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-[17px] font-bold tracking-[-.025em] text-white transition group-hover:text-[#D6C7FF]">{club.name}</h3>
            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
              <MapPinIcon width={13} height={13} className="shrink-0 text-primary"/>
              <span className="truncate">{club.district?.name ?? 'Rayon göstərilməyib'}{club.address ? ` · ${club.address}` : ''}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pt-1 text-[10px] font-semibold">
            <span className={cn('h-2 w-2 rounded-full', !hasHours ? 'bg-faint' : openNow ? 'bg-live shadow-[0_0_9px_rgba(57,217,138,.65)]' : 'bg-red-400')} />
            <span className={cn(!hasHours ? 'text-faint' : openNow ? 'text-live' : 'text-red-400')}>{statusLabel}</span>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/6 pt-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.16em] text-faint">Başlayan qiymət</p>
            {cheapestPricing ? (
              <div className="mt-1 font-display text-[25px] font-bold leading-none tracking-[-.04em] text-primary">{formatPriceRange(cheapestPricing.price_from, cheapestPricing.price_to, cheapestPricing.unit)}</div>
            ) : (
              <div className="mt-1 text-xs font-medium text-muted">Qiymət məlum deyil</div>
            )}
          </div>
          <div className="text-right">
            {club.distanceKm != null ? <p className="text-xs font-semibold text-white">{formatDistance(club.distanceKm)}</p> : <p className="text-[10px] text-faint">GameYer klub</p>}
            <p className="mt-1 text-[10px] font-medium text-primary opacity-0 transition group-hover:opacity-100">Ətraflı bax →</p>
          </div>
        </div>
      </div>
    </Link>
  );
});
