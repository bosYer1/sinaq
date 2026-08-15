export type ClubLogoSource = {
  imageUrl: string;
  sourceUrl: string;
};

/**
 * Only logos/profile images backed by an official club site or official social profile.
 * Keep this list deliberately conservative: if a source cannot be verified, show the
 * GameYer fallback instead of guessing.
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
};

export function getClubLogo(slug: string): ClubLogoSource | null {
  return CLUB_LOGOS[slug] ?? null;
}
