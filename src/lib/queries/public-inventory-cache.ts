/**
 * Public-inventory data can be cached across requests only if its trusted
 * Supabase read credentials are available without calling next/headers.
 * Production's request-scoped OIDC header fallback must remain uncached.
 */
export const PUBLIC_INVENTORY_CACHE_SECONDS = 300;

type CredentialEnvironment = Record<string, string | undefined>;

export function hasRequestIndependentPublicDataCredential(
  env: CredentialEnvironment = process.env,
): boolean {
  return Boolean(
    env.SUPABASE_SECRET_KEY?.trim()
    || env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || env.VERCEL_OIDC_TOKEN?.trim()
    || env.GAMEYER_CI_OIDC_TOKEN?.trim()
    || (env.ACTIONS_ID_TOKEN_REQUEST_URL?.trim() && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN?.trim())
  );
}


/**
 * Filter an already authorized, visibility-gated public inventory locally.
 * Only the caller's trusted query path may populate the inventory; this
 * helper never loads data or changes which clubs are publicly eligible.
 */
export type PublicInventoryFilter = {
  district?: string;
  metro?: string;
  type?: string;
  q?: string;
};

export type PublicInventorySearchableClub = {
  name: string;
  slug: string;
  address: string;
  district: { name: string; slug: string } | null;
};

const SEARCH_LOCATION_STOP_WORDS = new Set(['ms', 'metro', 'metrosu']);

export function normalizePublicSearchText(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/\\bm\\s*\\/\\s*s\\b/giu, ' metro ')
    .toLocaleLowerCase('az')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function publicSearchTerms(query: string | null | undefined): string[] {
  const terms = normalizePublicSearchText(query).split(/\\s+/).filter(Boolean).slice(0, 6);
  const meaningful = terms.filter((term) => !SEARCH_LOCATION_STOP_WORDS.has(term));
  return meaningful.length > 0 ? meaningful : terms;
}

export function filterPublicInventorySnapshot<T extends PublicInventorySearchableClub>(
  clubs: readonly T[],
  filters: PublicInventoryFilter,
  helpers: {
    matchesMetro: (club: T, metro: string) => boolean;
    inferTypeSlugs: (club: T) => readonly string[];
  },
): T[] {
  const searchTerms = publicSearchTerms(filters.q);
  const requestedType = filters.type === 'ps' ? 'playstation' : filters.type;
  const hasTypeFilter = requestedType === 'pc' || requestedType === 'playstation';

  // Preserve upstream premium/popularity ordering, full club objects, and
  // the existing behavior for unknown filter values.
  return clubs.filter((club) => {
    if (filters.district && club.district?.slug !== filters.district) return false;
    if (filters.metro && !helpers.matchesMetro(club, filters.metro)) return false;
    if (hasTypeFilter && !helpers.inferTypeSlugs(club).includes(requestedType)) return false;
    if (searchTerms.length > 0) {
      const searchableText = normalizePublicSearchText([
        club.name, club.slug, club.address, club.district?.name,
      ].filter(Boolean).join(' '));
      if (!searchTerms.every((term) => searchableText.includes(term))) return false;
    }
    return true;
  });
}
