'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
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
  const isBase64Asset = logo?.imageUrl.endsWith('.b64') === true;
  const [failed, setFailed] = useState(false);
  const [base64DataUrl, setBase64DataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!logo || !isBase64Asset) return;

    let cancelled = false;
    fetch(logo.imageUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Logo asset could not be loaded');
        return response.text();
      })
      .then((content) => {
        if (!cancelled) setBase64DataUrl(`data:image/jpeg;base64,${content.trim()}`);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isBase64Asset, logo]);

  const resolvedUrl = isBase64Asset ? base64DataUrl : logo?.imageUrl ?? null;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden bg-white text-primary',
        className
      )}
      title={logo ? `${name} rəsmi loqosu` : `${name} monoqramı`}
    >
      {logo && resolvedUrl && !failed ? (
        <Image
          src={resolvedUrl}
          alt={`${name} loqosu`}
          fill
          sizes="96px"
          className={cn('object-contain p-1.5', imageClassName)}
          priority={priority}
          unoptimized={isBase64Asset}
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
