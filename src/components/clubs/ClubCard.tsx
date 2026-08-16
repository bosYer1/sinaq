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
  useEffect(() => { const refreshLiveState = () => { setOpenNow(hasHours ? isClubOpenNow(club.opening_hours) : false); setPremiumActive(isPremiumActive(club)); }; refreshLiveState(); const timer = window.setInterval(refreshLiveState, 60_000); return () => window.clearInterval(timer); }, [club, hasHours]);
  const statusLabel = !hasHours ? 'Saat məlum deyil' : openNow ? 'Açıqdır' : 'Bağlıdır';
  const typeSlugs = inferClubTypeSlugs(club);
  const realPricing = club.pricing.filter((pricing) => pricing.price_from > 0);
  const cheapestPricing = [...realPricing].sort((a, b) => a.price_from - b.price_from)[0];

  return <Link ref={ref} href={`/klub/${encodeURIComponent(club.slug)}`} onMouseEnter={onMouseEnter} onFocus={onMouseEnter} className={cn('group relative flex gap-3 overflow-hidden rounded-card border bg-white p-3.5 transition-all duration-200 before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/45 before:to-transparent before:opacity-0 before:transition-opacity', active ? 'border-primary/50 shadow-card-hover ring-1 ring-primary/10 before:opacity-100' : 'border-border shadow-card hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover hover:before:opacity-100')}>
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-light via-white to-ps-tint ring-1 ring-border">
      {cover ? <Image src={cover.url} alt={club.name} fill sizes="96px" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <ClubLogo slug={club.slug} name={club.name} className="h-full w-full rounded-2xl border-0 bg-transparent text-3xl" />}
      {openNow ? <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[9px] font-bold text-ink shadow-sm backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-live"/>LIVE</span> : null}
    </div>
    <div className="flex min-w-0 flex-1 flex-col"><div className="flex min-w-0 items-start gap-2"><div className="min-w-0 flex-1"><h3 className="truncate font-display text-[15px] font-bold tracking-[-.02em] text-ink transition group-hover:text-primary">{club.name}</h3><div className="mt-1 flex min-w-0 items-center gap-1 text-[11px] text-muted"><MapPinIcon width={12} height={12} className="shrink-0 text-primary"/><span className="truncate">{club.district?.name ?? 'Rayon göstərilməyib'}{club.address ? ` · ${club.address}` : ''}</span></div></div><div className="flex shrink-0 items-center gap-1">{isVerified ? <Badge tone="verified">✓</Badge> : null}{premiumActive ? <Badge tone="premium">VIP</Badge> : null}</div></div>{typeSlugs.length > 0 ? <div className="mt-2 flex min-w-0 items-center gap-1.5 overflow-hidden">{typeSlugs.map((slug) => <Badge key={slug} tone={slug === 'pc' ? 'pc' : 'ps'}>{slug === 'pc' ? 'PC' : 'PlayStation'}</Badge>)}</div> : null}<div className="mt-auto flex items-end justify-between gap-3 pt-2.5"><div className="min-w-0">{club.distanceKm != null ? <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-faint">{formatDistance(club.distanceKm)}</span> : <span className="text-[10px] text-faint">GameYer klub</span>}</div><div className="shrink-0 text-right">{cheapestPricing ? <div className="font-mono text-xs font-bold text-ink">{formatPriceRange(cheapestPricing.price_from, cheapestPricing.price_to, cheapestPricing.unit)}</div> : <div className="text-[10px] text-faint">Qiymət məlum deyil</div>}<div className={cn('mt-1 text-[10px] font-bold', openNow ? 'text-live' : 'text-muted')}>{statusLabel}</div></div></div></div>
  </Link>;
});
