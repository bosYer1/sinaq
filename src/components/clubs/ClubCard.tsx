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
        'group flex gap-3.5 rounded-card border bg-surface p-3.5 shadow-card transition-all hover:border-primary/40 hover:shadow-card-hover',
        active ? 'border-primary ring-2 ring-primary/35' : 'border-border',
      )}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-alt">
        {cover ? (
          <Image
