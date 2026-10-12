import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { hasRequestIndependentPublicDataCredential, PUBLIC_INVENTORY_CACHE_SECONDS } from '@/lib/queries/public-inventory-cache';
import { requestVercelPublicReadToken } from '@/lib/supabase/server-data';
import { createPublicClient } from '@/lib/supabase/public-server';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { isPremiumActive } from '@/lib/utils';
import { getClubPopularityMetrics } from '@/lib/queries/club-popularity';
import { clubMatchesMetro } from '@/lib/metro';
import type { ClubFilters, ClubWithRelations } from '@/types/database';

const CLUB_SELECT = `
  id, name, slug, description, district_id, address, latitude, longitude,
  phone, instagram_url, tiktok_url, profile_image_url, is_premium, premium_expires_at, is_active,
  is_verified, verified_at, created_at, updated_at,
  district:districts ( id, name, slug ),
  type_assignments:club_type_assignments (
    club_type_id,
    club_type:club_types ( id, name, slug )
  ),
  pricing:club_pricing (
    id, club_id, club_type_id, price_from, price_to, unit, tariff_name, schedule_label, position,
    club_type:club_types ( id, name, slug )
  ),
  images:club_images ( id, url, is_cover, position ),
  opening_hours:club_opening_hours ( id, club_id, day_of_week, open_time, close_time, is_closed )
`;

function normalizeClubRelations(club: ClubWithRelations): ClubWithRelations {
  return {
    ...club,
    rating_avg: null,
    rating_count: 0,
    type_assignments: Array.isArray(club.type_assignments) ? club.type_assignments : [],
    pricing: Array.isArray(club.pricing) ? club.pricing : [],
    images: Array.isArray(club.images) ? club.images : [],
    opening_hours: Array.isArray(club.opening_hours) ? club.opening_hours : [],
  };
}

function hasConfirmedPublicType(club: ClubWithRelations) {
  const types = inferClubTypeSlugs(club);
  return types.includes('pc') || types.includes('playstation');
}

function hasConfirmedPublicSocial(club: Pick<ClubWithRelations, 'instagram_url' | 'tiktok_url'>) {
  return Boolean(club.instagram_url?.trim() || club.tiktok_url?.trim());
}

function isPublicClubForWeb(club: ClubWithRelations) {
  return Boolean(
    club.is_active
      && club.latitude != null
      && club.longitude != null
      && hasConfirmedPublicSocial(club)
      && hasConfirmedPublicType(club)
  );
}

const SEARCH_LOCATION_STOP_WORDS = new Set(['ms', 'metro', 'metrosu']);

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? '')
    .replace(/\bm\s*\/\s*s\b/giu, ' metro ')
    .toLocaleLowerCase('az')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function queryClubs(filters: ClubFilters, trustedToken?: string): Promise<ClubWithRelations[]> {
  const supabase = createPublicClient(trustedToken);
  let districtId: string | null = null;

  if (filters.district) {
    const { data: districtRow, error: districtError } = await supabase
      .from('districts')
      .select('id')
      .eq('slug', filters.district)
      .maybeSingle()
      .returns<{ id: string }>();

    if (districtError) {
      console.error('getClubs (district lookup) xətası:', districtError.message);
      throw districtError;
    }

    if (!districtRow) return [];
    districtId = districtRow.id;
  }

  const hasPriceFilter = filters.priceMax != null && filters.priceMax > 0;
  const selectString = hasPriceFilter
    ? CLUB_SELECT.replace('pricing:club_pricing (', 'pricing:club_pricing!inner (')
    : CLUB_SELECT;

  let query = supabase
    .from('clubs')
    .select(selectString)
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('is_premium', { ascending: false })
    .order('created_at', { ascending: false });

  if (districtId) query = query.eq('district_id', districtId);

  if (hasPriceFilter) {
    query = query
      .eq('pricing.unit', 'saat')
      .gt('pricing.price_from', 0)
      .lte('pricing.price_from', filters.priceMax!);
  }

  const normalizedSearchTerms = normalizeSearchText(filters.q)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  const meaningfulSearchTerms = normalizedSearchTerms.filter((term) => !SEARCH_LOCATION_STOP_WORDS.has(term));
  const searchTerms = meaningfulSearchTerms.length > 0 ? meaningfulSearchTerms : normalizedSearchTerms;

  const [{ data, error }, popularity] = await Promise.all([
    query.returns<ClubWithRelations[]>(),
    getClubPopularityMetrics(),
  ]);
  if (error) {
    console.error('getClubs xətası:', error.message);
    throw error;
  }

  let clubs = (data ?? []).map(normalizeClubRelations).filter(isPublicClubForWeb);

  if (searchTerms.length > 0) {
    clubs = clubs.filter((club) => {
      const searchableText = normalizeSearchText([
        club.name,
        club.slug,
        club.address,
        club.district?.name,
      ].filter(Boolean).join(' '));

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }

  if (filters.metro) {
    clubs = clubs.filter((club) => clubMatchesMetro(club, filters.metro!));
  }

  const requestedType = filters.type === 'ps' ? 'playstation' : filters.type;
  const hasTypeFilter = requestedType === 'pc' || requestedType === 'playstation';

  if (hasTypeFilter) {
    clubs = clubs.filter((club) => inferClubTypeSlugs(club).includes(requestedType));
  }

  if (hasPriceFilter && hasTypeFilter) {
    clubs = clubs.filter((club) =>
      club.pricing.some(
        (pricing) =>
          pricing.club_type?.slug === requestedType &&
          pricing.unit === 'saat' &&
          pricing.price_from > 0 &&
          pricing.price_from <= filters.priceMax!
      )
    );
  }

  const popularityBySlug = new Map(popularity.map((item) => [item.slug, item]));

  clubs = [...clubs].sort((a, b) => {
    // Commercial placement is explicit: active Premium clubs are pinned first.
    const premiumDelta = Number(isPremiumActive(b)) - Number(isPremiumActive(a));
    if (premiumDelta !== 0) return premiumDelta;

    // Within the same commercial tier, keep incomplete discovery cards below
    // clubs that have a real profile image. PopularClubs remains purely organic.
    const profileImageDelta = Number(Boolean(b.profile_image_url?.trim())) - Number(Boolean(a.profile_image_url?.trim()));
    if (profileImageDelta !== 0) return profileImageDelta;

    // Complete profiles are then ranked by real 30-day profile views.
    // Unique sessions only break ties; A–Z is no longer the default fallback.
    const aPopularity = popularityBySlug.get(a.slug);
    const bPopularity = popularityBySlug.get(b.slug);
    const viewDelta = (bPopularity?.views ?? 0) - (aPopularity?.views ?? 0);
    if (viewDelta !== 0) return viewDelta;
    const sessionDelta = (bPopularity?.sessions ?? 0) - (aPopularity?.sessions ?? 0);
    if (sessionDelta !== 0) return sessionDelta;

    const recencyDelta = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (recencyDelta !== 0) return recencyDelta;
    return a.name.localeCompare(b.name, 'az');
  });

  return clubs;
}

// A normal React cache is request-scoped: the dynamic home page otherwise
// downloads the entire nested public inventory from Supabase on every visit.
// Cache only the unfiltered, visibility-gated inventory across requests.
// Never enter a Next.js cache scope if an OIDC token needs request headers.
const getSharedPublicClubs = unstable_cache(
  async () => {
    const clubs = await queryClubs({});
    if (clubs.length === 0) {
      throw new Error('Refusing to cache an unexpectedly empty public club inventory.');
    }
    return clubs;
  },
  ['gameyer-public-clubs-v1'],
  { revalidate: PUBLIC_INVENTORY_CACHE_SECONDS, tags: ['gameyer-public-clubs'] },
);

// At runtime, Vercel supplies OIDC in a request header (not process.env).
// Resolve the header BEFORE constructing the cached function; only a
// visibility-filtered public result is cached, never the credential.
async function getTrustedPublicClubs(): Promise<ClubWithRelations[]> {
  if (hasRequestIndependentPublicDataCredential()) return getSharedPublicClubs();

  if (process.env.VERCEL_ENV === 'production') {
    const trustedToken = await requestVercelPublicReadToken();
    if (trustedToken) {
      return unstable_cache(
        async () => {
          const clubs = await queryClubs({}, trustedToken);
          if (clubs.length === 0) {
            throw new Error('Refusing to cache an unexpectedly empty public club inventory.');
          }
          return clubs;
        },
        // Deliberately independent of rotating OIDC credentials: the cached
        // payload is identical for every authorized public-site request.
        ['gameyer-public-clubs-header-v1'],
        { revalidate: PUBLIC_INVENTORY_CACHE_SECONDS, tags: ['gameyer-public-clubs'] },
      )();
    }
  }

  // No trusted request token: preserve the original fail-closed behavior.
  return queryClubs({});
}

const getCachedClubs = cache(
  async (
    district?: string,
    metro?: string,
    type?: string,
    priceMax?: number,
    q?: string,
  ) => {
    // Reuse the already visibility-gated 5-minute snapshot for ordinary
    // discovery filters. This removes a second full 61-club proxy download
    // from filtered home pages and stops crawled district/type pages from
    // issuing fresh nested SELECTs on every visit.
    // Keep price searches on the existing SQL path: its !inner join prunes
    // the pricing relation, so filtering the full snapshot would change the
    // pricing returned to cards.
    const hasFilters = Boolean(district || metro || type || priceMax || q?.trim());
    if (!hasFilters) return getTrustedPublicClubs();
    if (priceMax == null || priceMax <= 0) {
      const clubs = await getTrustedPublicClubs();
      const normalizedSearchTerms = normalizeSearchText(q)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 6);
      const meaningfulSearchTerms = normalizedSearchTerms.filter((term) => !SEARCH_LOCATION_STOP_WORDS.has(term));
      const searchTerms = meaningfulSearchTerms.length > 0 ? meaningfulSearchTerms : normalizedSearchTerms;
      const requestedType = type === 'ps' ? 'playstation' : type;
      const hasTypeFilter = requestedType === 'pc' || requestedType === 'playstation';

      // The snapshot is already sorted using the same popularity/premium
      // ranking as live queries; filtering it preserves the exact ordering.
      return clubs.filter((club) => {
        if (district && club.district?.slug !== district) return false;
        if (metro && !clubMatchesMetro(club, metro)) return false;
        if (hasTypeFilter && !inferClubTypeSlugs(club).includes(requestedType)) return false;
        if (searchTerms.length > 0) {
          const searchableText = normalizeSearchText([
            club.name, club.slug, club.address, club.district?.name,
          ].filter(Boolean).join(' '));
          if (!searchTerms.every((term) => searchableText.includes(term))) return false;
        }
        return true;
      });
    }
    return queryClubs({ district, metro, type, priceMax, q });
  },
);

export async function getClubs(filters: ClubFilters = {}): Promise<ClubWithRelations[]> {
  return getCachedClubs(
    filters.district,
    filters.metro,
    filters.type,
    filters.priceMax,
    filters.q,
  );
}

type PublicClubCountRow = {
  id: string;
  instagram_url: string | null;
  tiktok_url: string | null;
  type_assignments: Array<{ club_type: { slug: string } | null }>;
};

async function queryPublicClubCount(
  filters: Pick<ClubFilters, 'district' | 'type'>,
  trustedToken?: string,
): Promise<number> {
  const supabase = createPublicClient(trustedToken);
  let districtId: string | null = null;

  if (filters.district) {
    const { data: districtRow, error: districtError } = await supabase
      .from('districts')
      .select('id')
      .eq('slug', filters.district)
      .maybeSingle()
      .returns<{ id: string }>();
    if (districtError) {
      console.error('getPublicClubCount district xətası:', districtError.message);
      throw districtError;
    }
    if (!districtRow) return 0;
    districtId = districtRow.id;
  }

  let query = supabase
    .from('clubs')
    .select(`
      id,
      instagram_url,
      tiktok_url,
      type_assignments:club_type_assignments (
        club_type:club_types ( slug )
      )
    `)
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (districtId) query = query.eq('district_id', districtId);

  const { data, error } = await query.returns<PublicClubCountRow[]>();
  if (error) {
    console.error('getPublicClubCount xətası:', error.message);
    throw error;
  }

  const requestedType = filters.type === 'ps' ? 'playstation' : filters.type;
  return (data ?? []).filter((club) => {
    if (!club.instagram_url?.trim() && !club.tiktok_url?.trim()) return false;
    const slugs = (club.type_assignments ?? [])
      .map((assignment) => assignment.club_type?.slug)
      .filter((slug): slug is string => Boolean(slug));
    if (requestedType === 'pc' || requestedType === 'playstation') return slugs.includes(requestedType);
    return slugs.includes('pc') || slugs.includes('playstation');
  }).length;
}

const getSharedPublicClubCount = unstable_cache(
  async (district?: string, type?: string) => queryPublicClubCount({ district, type }),
  ['gameyer-public-club-count-v1'],
  { revalidate: PUBLIC_INVENTORY_CACHE_SECONDS, tags: ['gameyer-public-clubs'] },
);

const getCachedPublicClubCount = cache(async (district?: string, type?: string) => {
  if (hasRequestIndependentPublicDataCredential()) return getSharedPublicClubCount(district, type);

  if (process.env.VERCEL_ENV === 'production') {
    const trustedToken = await requestVercelPublicReadToken();
    if (trustedToken) {
      return unstable_cache(
        async () => queryPublicClubCount({ district, type }, trustedToken),
        // Count varies with the district/type; the rotating OIDC token does not.
        ['gameyer-public-club-count-header-v1', district ?? '', type ?? ''],
        { revalidate: PUBLIC_INVENTORY_CACHE_SECONDS, tags: ['gameyer-public-clubs'] },
      )();
    }
  }
  return queryPublicClubCount({ district, type });
});

export async function getPublicClubCount(filters: Pick<ClubFilters, 'district' | 'type'>): Promise<number> {
  return getCachedPublicClubCount(filters.district, filters.type);
}

async function queryClubBySlug(slug: string): Promise<ClubWithRelations | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('clubs')
    .select(CLUB_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .maybeSingle()
    .returns<ClubWithRelations>();

  if (error) {
    console.error('getClubBySlug xətası:', error.message);
    throw error;
  }

  if (!data) return null;
  const club = normalizeClubRelations(data);
  return isPublicClubForWeb(club) ? club : null;
}

// Detail requests reuse exactly the same eligibility-gated inventory snapshot
// as the home page. In sitemap smoke tests this avoids one proxy read per slug.
const getCachedClubBySlug = cache(async (slug: string) => {
  if (hasRequestIndependentPublicDataCredential() || process.env.VERCEL_ENV === 'production') {
    const clubs = await getTrustedPublicClubs();
    return clubs.find((club) => club.slug === slug) ?? null;
  }
  // Preserve the uncached direct-query path for local and preview environments.
  return queryClubBySlug(slug);
});

export async function getClubBySlug(slug: string): Promise<ClubWithRelations | null> {
  return getCachedClubBySlug(slug);
}
