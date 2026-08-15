export type ClubLogoSource = {
  imageUrl: string;
  sourceUrl: string;
};

/**
 * Only use logo assets that are stable and directly controlled/verified.
 * Social-avatar proxies (Instagram/Facebook via unavatar) and generic favicon
 * services are intentionally not used here because they can return stale,
 * rate-limited, default, or incorrect images. Clubs without a stable asset
 * fall back to a club-specific monogram in ClubLogo.
 *
 * As official logo files are obtained, store them under /public/club-logos
 * (or GameYer-owned Supabase Storage) and register those stable URLs here.
 */
const CLUB_LOGOS: Record<string, ClubLogoSource> = {
  'laliga-game-center-merkez': {
    imageUrl: 'https://marsol.az/wp-content/uploads/2021/12/laliga-logo-sayt.jpg',
    sourceUrl: 'https://www.instagram.com/laligagamecenter/',
  },
};

export function getClubLogo(slug: string): ClubLogoSource | null {
  return CLUB_LOGOS[slug] ?? null;
}

export function getClubMonogram(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'GY';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
