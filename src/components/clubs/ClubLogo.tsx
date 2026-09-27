'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
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

export function ClubLogo({ slug, name, profileImageUrl, className, imageClassName, priority = false }: ClubLogoProps) {
  const staticLogo = getClubLogo(slug);
  const resolvedProfileImageUrl = profileImageUrl ?? null;
  const sourceUrl = resolvedProfileImageUrl || staticLogo?.imageUrl || null;
  const isBase64Asset = sourceUrl?.endsWith('.b64') === true;
  const [failed, setFailed] = useState(false);
  const [base64DataUrl, setBase64DataUrl] = useState<string | null>(null);


  useEffect(() => {
    if (!sourceUrl || !isBase64Asset) return;

    let cancelled = false;
    fetch(sourceUrl)
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
  }, [isBase64Asset, sourceUrl]);

  const resolvedUrl = isBase64Asset ? base64DataUrl : sourceUrl;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden bg-surface text-primary',
        className
      )}
      title={resolvedUrl ? `${name} profil şəkli` : `${name} monoqramı`}
    >
      {resolvedUrl && !failed ? (
        <Image
          src={resolvedUrl}
          alt={`${name} profil şəkli`}
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
