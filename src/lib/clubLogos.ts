export type ClubLogoSource = {
  imageUrl: string;
  sourceUrl: string;
};

/**
 * Only logos/profile images backed by an official club site or official social profile.
 * If a source cannot be verified, ClubLogo renders a club-specific monogram instead.
 */
const CLUB_LOGOS: Record<string, ClubLogoSource> = {
  'laliga-game-center-merkez': {
    imageUrl: 'https://marsol.az/wp-content/uploads/2021/12/laliga-logo-sayt.jpg',
    sourceUrl: 'https://www.instagram.com/laligagamecenter/',
  },
  'vegas-gaming-center-hazi-aslanov': {
    imageUrl: 'https://unavatar.io/instagram/vegasgamingcenter',
    sourceUrl: 'https://vegasgamingcenter.az/',
  },
  'vegas-gaming-club-merkez': {
    imageUrl: 'https://unavatar.io/instagram/vegasgamingcenter',
    sourceUrl: 'https://vegasgamingcenter.az/',
  },
  'forgamer-narimanov-bunker': {
    imageUrl: 'https://www.google.com/s2/favicons?domain=forgamer.az&sz=256',
    sourceUrl: 'https://forgamer.az/',
  },
  'forgamer-yasamal': {
    imageUrl: 'https://www.google.com/s2/favicons?domain=forgamer.az&sz=256',
    sourceUrl: 'https://forgamer.az/',
  },
  'kenza-gaming-lounge': {
    imageUrl: 'https://unavatar.io/instagram/kenza_cyber',
    sourceUrl: 'https://instagram.com/kenza_cyber',
  },
  'playrooms-gameclub': {
    imageUrl: 'https://unavatar.io/instagram/playrooms_gameclub',
    sourceUrl: 'https://instagram.com/playrooms_gameclub/',
  },
  'galatasaray-playstation-club': {
    imageUrl: 'https://unavatar.io/instagram/gs.playstation.club',
    sourceUrl: 'https://instagram.com/gs.playstation.club/',
  },
  'forsaj-game-club-yeni-yasamal': {
    imageUrl: 'https://unavatar.io/instagram/forsaj.gameclub',
    sourceUrl: 'https://instagram.com/forsaj.gameclub/',
  },
  'milli-gaming-arena': {
    imageUrl: 'https://www.google.com/s2/favicons?domain=milligamingarena.az&sz=256',
    sourceUrl: 'https://milligamingarena.az/',
  },
  'playercyberbar': {
    imageUrl: 'https://www.google.com/s2/favicons?domain=playercyberbar.az&sz=256',
    sourceUrl: 'https://playercyberbar.az/',
  },
  'cyber-arena-baku': {
    imageUrl: 'https://unavatar.io/facebook/cyberarenaAZ',
    sourceUrl: 'https://www.facebook.com/cyberarenaAZ/',
  },
  'game-club': {
    imageUrl: 'https://unavatar.io/facebook/Game-Club-Baku-290464214313454',
    sourceUrl: 'https://www.facebook.com/Game-Club-Baku-290464214313454/',
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
