import { forwardRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ClubWithDistance } from '@/types/database';
import { RatingBadge } from './RatingBadge';
import { Badge } from '@/components/ui/Badge';
import { cn, formatPriceRange, isClubOpenNow } from '@/lib/utils';
import { formatDistance } from '@/lib/geo';

interface ClubCardProps {
  club: ClubWithDistance;
  /** Xəritədə uyğun marker aktiv/hover olanda true — kartı vizual fərqləndirir. */
  active?: boolean;
  onMouseEnter?: () => void;
}

export const ClubCard = forwardRef<HTMLAnchorElement, ClubCardProps>(function ClubCard(
  { club, active, onMouseEnter },
  ref,
) {
  const cover = club.images.find((img) => img.is_cover) ?? club.images[0];
  const openNow = isClubOpenNow(club.opening_hours);
  const cheapestPricing = [...club.pricing].sort((a, b) => a.price_from - b.price_from)[0];

  return (
    <Link
      ref={ref}
      href={`/klub/${club.slug}`}
      onMouseEnter={onMouseEnter}
      className={cn(
        'group flex gap-3 rounded-card border bg-surface p-3 shadow-card transition-shadow hover:shadow-card-hover',
        active ? 'border-primary ring-2 ring-primary/25' : 'border-border',
      )}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-alt">
        {cover ? (
          <Image src={cover.url} alt={club.name} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🎮</div>
        )}
        {openNow && (
          <span className="absolute left-1.5 top-1.5 flex h-2 w-2 rounded-full bg-live shadow-sm">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-live" />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-display text-sm font-semibold text-ink group-hover:text-primary">
            {club.name}
          </h3>
          {club.is_premium && (
            <Badge tone="premium" className="shrink-0">
              VIP
            </Badge>
          )}
        </div>

        <p className="truncate text-xs text-muted">
          {club.district?.name ?? 'Rayon göstərilməyib'}
          {club.distanceKm != null && <span> · {formatDistance(club.distanceKm)}</span>}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {club.pricing.map((p) => (
            <Badge key={p.id} tone={p.club_type.slug === 'pc' ? 'pc' : 'ps'}>
              {p.club_type.name}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <RatingBadge rating={club.rating_avg} count={club.rating_count} />
          {cheapestPricing && (
            <span className="font-mono text-xs font-medium text-ink">
              {formatPriceRange(cheapestPricing.price_from, cheapestPricing.price_to, cheapestPricing.unit)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});
