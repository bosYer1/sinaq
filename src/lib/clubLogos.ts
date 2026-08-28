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
 */
const LALIGA_LOGO: ClubLogoSource = {
  imageUrl: 'https://marsol.az/wp-content/uploads/2021/12/laliga-logo-sayt.jpg',
  sourceUrl: 'https://marsol.az/laliga-game-center/',
};

const CLUB_LOGOS: Record<string, ClubLogoSource> = {
  'laliga-game-center-merkez': LALIGA_LOGO,
  'laliga-game-center-narimanov': LALIGA_LOGO,
  'laliga-lounge-aztu': LALIGA_LOGO,
  'laliga-lounge-elmler-2': LALIGA_LOGO,
  'laliga-lounge-tibb': LALIGA_LOGO,
  'laliga-lounge-genclik': LALIGA_LOGO,
  'milli-gaming-arena': {
    imageUrl: '/club-logos/milli-gaming-arena.jpg.b64',
    sourceUrl: 'club-provided',
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
