import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public-server';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { isPremiumActive } from '@/lib/utils';
import { getClubPopularityMetrics } from '@/lib/queries/club-popularity';
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

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? '')
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

async function queryClubs(filters: ClubFilters): Promise<ClubWithRelations[]> {
  const supabase = createPublicClient();
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
      return [];
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

  const searchTerms = normalizeSearchText(filters.q)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);

  const [{ data, error }, popularity] = await Promise.all([
    query.returns<ClubWithRelations[]>(),
    getClubPopularityMetrics(),
  ]);
  if (error) {
    console.error('getClubs xətası:', error.message);
    return [];
  }

  let clubs = (data ?? []).map(normalizeClubRelations).filter(hasConfirmedPublicType);

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

const getCachedClubs = unstable_cache(
  async (filters: ClubFilters) => queryClubs(filters),
  ['gameyer-public-clubs-v8'],
  { revalidate: 60, tags: ['public-clubs'] },
);

export async function getClubs(filters: ClubFilters = {}): Promise<ClubWithRelations[]> {
  return getCachedClubs(filters);
}

type PublicClubCountRow = {
  id: string;
  type_assignments: Array<{ club_type: { slug: string } | null }>;
};

async function queryPublicClubCount(filters: Pick<ClubFilters, 'district' | 'type'>): Promise<number> {
  const supabase = createPublicClient();
  let districtId: string | null = null;

  if (filters.district) {
    const { data: districtRow, error: districtError } = await supabase
      .from('districts')
      .select('id')
      .eq('slug', filters.district)
      .maybeSingle()
      .returns<{ id: string }>();
    if (districtError || !districtRow) return 0;
    districtId = districtRow.id;
  }

  let query = supabase
    .from('clubs')
    .select(`
      id,
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
    return 0;
  }

  const requestedType = filters.type === 'ps' ? 'playstation' : filters.type;
  return (data ?? []).filter((club) => {
    const slugs = (club.type_assignments ?? [])
      .map((assignment) => assignment.club_type?.slug)
      .filter((slug): slug is string => Boolean(slug));
    if (requestedType === 'pc' || requestedType === 'playstation') return slugs.includes(requestedType);
    return slugs.includes('pc') || slugs.includes('playstation');
  }).length;
}

const getCachedPublicClubCount = unstable_cache(
  async (filters: Pick<ClubFilters, 'district' | 'type'>) => queryPublicClubCount(filters),
  ['gameyer-public-club-count-v1'],
  { revalidate: 60, tags: ['public-clubs'] },
);

export async function getPublicClubCount(filters: Pick<ClubFilters, 'district' | 'type'>): Promise<number> {
  return getCachedPublicClubCount(filters);
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
    return null;
  }

  if (!data) return null;
  const club = normalizeClubRelations(data);
  return hasConfirmedPublicType(club) ? club : null;
}

const getCachedClubBySlug = unstable_cache(
  async (slug: string) => queryClubBySlug(slug),
  ['gameyer-public-club-by-slug-v4'],
  { revalidate: 60, tags: ['public-clubs'] },
);

export async function getClubBySlug(slug: string): Promise<ClubWithRelations | null> {
  return getCachedClubBySlug(slug);
}
