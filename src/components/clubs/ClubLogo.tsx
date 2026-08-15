'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getClubLogo, getClubMonogram } from '@/lib/clubLogos';
import { cn } from '@/lib/utils';

type ClubLogoProps = {
  slug: string;
  name: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function ClubLogo({ slug, name, className, imageClassName, priority = false }: ClubLogoProps) {
  const logo = getClubLogo(slug);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden bg-white text-primary',
        className
      )}
      title={logo ? `${name} rəsmi loqosu` : `${name} monoqramı`}
    >
      {logo && !failed ? (
        <Image
          src={logo.imageUrl}
          alt={`${name} loqosu`}
          fill
          sizes="96px"
          className={cn('object-contain p-1.5', imageClassName)}
          priority={priority}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-display text-[0.72em] font-bold tracking-tight" aria-hidden="true">
          {getClubMonogram(name)}
        </span>
      )}
    </div>
  );
}
