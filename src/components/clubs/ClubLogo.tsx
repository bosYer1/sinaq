'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getClubLogo, getClubMonogram } from '@/lib/clubLogos';
import { cn } from '@/lib/utils';

type ClubLogoProps = {
  slug: string;
  name: string;
  profileImageUrl?: string | null;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

/**
 * A confirmed official logo is always preferred over a venue photo.
 * If it fails, fall back to the club's own real photo and then a monogram.
 * Never reuse another club's logo or a generic invented brand asset.
 */
export function ClubLogo({ slug, name, profileImageUrl, className, imageClassName, priority = false }: ClubLogoProps) {
  const confirmedLogo = getClubLogo(slug)?.imageUrl ?? null;
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const candidates = [confirmedLogo, profileImageUrl].filter(
    (url): url is string => Boolean(url?.trim()) && !url!.endsWith('.b64'),
  );
  const sourceUrl = candidates.find((url) => !failedUrls.includes(url)) ?? null;
  const isOfficialLogo = sourceUrl === confirmedLogo;
  const isLocalRecoveredPhoto = sourceUrl?.startsWith('/recovered-club-media/') === true;

  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center overflow-hidden bg-surface text-primary', className)}
      title={sourceUrl ? (isOfficialLogo ? `${name} loqosu` : `${name} şəkli`) : `${name} monoqramı`}
    >
      {sourceUrl ? (
        <Image
          key={sourceUrl}
          src={sourceUrl}
          alt={isOfficialLogo ? `${name} loqosu` : `${name} şəkli`}
          fill
          sizes="(max-width: 640px) 104px, 96px"
          className={cn(isOfficialLogo ? 'object-contain p-2' : 'object-cover', imageClassName)}
          priority={priority}
          unoptimized={isLocalRecoveredPhoto || isOfficialLogo}
          onError={() => setFailedUrls((failed) => failed.includes(sourceUrl) ? failed : [...failed, sourceUrl])}
        />
      ) : (
        <span className="font-display text-[0.72em] font-bold tracking-tight" aria-hidden="true">
          {getClubMonogram(name)}
        </span>
      )}
    </div>
  );
}
