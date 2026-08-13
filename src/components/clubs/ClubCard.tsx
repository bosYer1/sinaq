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
  active?: boolean;
  onMouseEnter?: () => void;
}

export const ClubCard = forwardRef<HTMLAnchorElement, ClubCardProps>(function ClubCard(props, ref) {
  const { club, active, onMouseEnter } = props;
  const cover = club.images.find((img) => img.is_cover) ?? club.images[0];
  const openNow = isClubOpenNow(club.opening_hours);
  const cheapestPricing = [...club.pricing].sort((a, b) => a.price_from - b.price_from)[0];

  return (
    <Link
      ref={ref}
      href={'/klub/' + club.slug}
      onMouseEnter={onMouseEnter}
      className={cn(
        'group flex gap-3.5 rounded-card border bg-surface p-3.5 shadow-card transition-all hover:border-primary/40 hover:shadow-card-hover',
        active ? 'border-primary ring-2 ring-primary/35' : 'border-border'
      )}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-alt">
        {cover ? (
          <Image
            src={cover.url}
            alt={club.name}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🎮</div>
        )}
        {openNow ? (
          <span className="absolute left-1.5 top-1.5 flex h-2 w-2 rounded-full bg-live shadow-sm">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-live" />
