'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getClubLogo, getClubMonogram } from '@/lib/clubLogos';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type ClubLogoProps = {
  slug: string;
  name: string;
  profileImageUrl?: string | null;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

type ProfileImageRow = {
  profile_image_url?: string | null;
};

const profileImageCache = new Map<string, string | null>();
const profileImageRequests = new Map<string, Promise<string | null>>();

async function loadProfileImage(slug: string) {
  if (profileImageCache.has(slug)) return profileImageCache.get(slug) ?? null;

  const existingRequest = profileImageRequests.get(slug);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clubs')
      .select('profile_image_url')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    const row = data as ProfileImageRow | null;
    const url = error || typeof row?.profile_image_url !== 'string' ? null : row.profile_image_url;
    profileImageCache.set(slug, url);
    profileImageRequests.delete(slug);
    return url;
  })();

  profileImageRequests.set(slug, request);
  return request;
}

export function ClubLogo({ slug, name, profileImageUrl, className, imageClassName, priority = false }: ClubLogoProps) {
  const staticLogo = getClubLogo(slug);
  const profileImageProvided = profileImageUrl !== undefined;
  const [loadedProfileImageUrl, setLoadedProfileImageUrl] = useState<string | null>(() => profileImageCache.get(slug) ?? null);
  const resolvedProfileImageUrl = profileImageProvided ? profileImageUrl : loadedProfileImageUrl;
  const sourceUrl = resolvedProfileImageUrl || staticLogo?.imageUrl || null;
  const isBase64Asset = sourceUrl?.endsWith('.b64') === true;
  const [failed, setFailed] = useState(false);
  const [base64DataUrl, setBase64DataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profileImageProvided) return;

    let cancelled = false;
    void loadProfileImage(slug).then((url) => {
      if (!cancelled) {
        setLoadedProfileImageUrl(url);
        setFailed(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profileImageProvided, slug]);

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
