import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/config';
import { MOCK_CLUBS } from '@/lib/mock-data';
import type { ClubFilters, ClubWithRelations } from '@/types/database';

/**
 * Supabase-in nested select sintaksisi ilə klubu bütün əlaqəli data ilə
 * (rayon, qiymətlər+tip, şəkillər, iş saatları) tək sorğuda çəkir.
 */
const CLUB_SELECT = `
  *,
  district:districts ( id, name, slug ),
  pricing:club_pricing (
    id, club_id, club_type_id, price_from, price_to, unit,
    club_type:club_types ( id, name, slug )
  ),
  images:club_images ( id, url, is_cover, position ),
  opening_hours:club_opening_hours ( id, club_id, day_of_week, open_time, close_time, is_closed )
`;

/**
 * Filtrlərə uyğun aktiv klubları qaytarır.
 * - `district`: rayon slug-u ilə süzgəc
 * - `type`: klub tipi slug-u ilə süzgəc (club_pricing üzərindən)
 * - `priceMax`: price_from bu dəyərdən az/bərabər olan klublar
 *
 * Qeyd (dizayn qərarı): PostgREST-in çox-səviyyəli embed filtrləri
 * (məs. `pricing.club_type.slug` kimi iki səviyyə dərinlikdə dot-filter,
 * və ya `!inner` olmadan to-one əlaqədə filtr) etibarsız/qeyri-müəyyən
 * davranışa malikdir — bəzi hallarda parent sətri süzgəcdən keçirmir,
 * sadəcə embed edilmiş massivi boşaldır. Bunun qarşısını almaq üçün
 * əvvəlcə `district`/`club_type` slug-larını id-yə çeviririk, sonra əsas
 * sorğuda birbaşa foreign key sütunları (`district_id`, `pricing.club_type_id`)
 * üzərindən filtr edirik — bu, PostgREST-də sənədləşdirilmiş, etibarlı üsuldur.
 */
export async function getClubs(filters: ClubFilters = {}): Promise<ClubWithRelations[]> {
  // Supabase hələ qoşulmayıbsa (env dəyərləri yoxdursa) — development üçün mock data.
  if (!isSupabaseConfigured()) {
    return filterMockClubs(filters);
  }

  const supabase = createClient();

  // 1) Slug -> id həlli (lookup cədvəllər kiçikdir, əlavə sorğu ucuzdur)
  let districtId: string | null = null;
  if (filters.district) {
    const { data: districtRow, error: districtError } = await supabase
      .from('districts')
      .select('id')
      .eq('slug', filters.district)
      .maybeSingle();

    if (districtError) {
      console.error('getClubs (district lookup) xətası:', districtError.message);
      return [];
    }
    if (!districtRow) return []; // Mövcud olmayan rayon slug-u -> boş nəticə
    districtId = districtRow.id;
  }

  let clubTypeId: string | null = null;
  if (filters.type) {
    const { data: typeRow, error: typeError } = await supabase
      .from('club_types')
      .select('id')
      .eq('slug', filters.type)
      .maybeSingle();

    if (typeError) {
      console.error('getClubs (club_type lookup) xətası:', typeError.message);
      return [];
    }
    if (!typeRow) return [];
    clubTypeId = typeRow.id;
  }

  // 2) Əsas sorğu — yalnız birbaşa sütunlar üzərində filtr
  const needsPricingInnerJoin = Boolean(clubTypeId || filters.priceMax);

  let query = supabase
    .from('clubs')
    .select(
      needsPricingInnerJoin
        ? CLUB_SELECT.replace('pricing:club_pricing (', 'pricing:club_pricing!inner (')
        : CLUB_SELECT,
    )
    .eq('is_active', true)
    .order('is_premium', { ascending: false }) // Premium klublar əvvəldə (gələcək funksiya, indi is_premium=false-dur)
    .order('rating_avg', { ascending: false, nullsFirst: false });

  if (districtId) {
    query = query.eq('district_id', districtId);
  }

  if (clubTypeId) {
    query = query.eq('pricing.club_type_id', clubTypeId);
  }

  if (filters.priceMax) {
    query = query.lte('pricing.price_from', filters.priceMax);
  }

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getClubs xətası:', error.message);
    return [];
  }

  return (data ?? []) as unknown as ClubWithRelations[];
}

/** Tək klubu slug-a görə (bütün detallarla) qaytarır. Tapılmasa `null`. */
export async function getClubBySlug(slug: string): Promise<ClubWithRelations | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_CLUBS.find((c) => c.slug === slug && c.is_active) ?? null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('clubs')
    .select(CLUB_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('getClubBySlug xətası:', error.message);
    return null;
  }

  return data as unknown as ClubWithRelations | null;
}

/**
 * Supabase qoşulmayanda `getClubs`-in mock data üzərində eyni filtr
 * məntiqini (rayon, tip, qiymət, axtarış) tətbiq edən köməkçi funksiya.
 */
function filterMockClubs(filters: ClubFilters): ClubWithRelations[] {
  let results = MOCK_CLUBS.filter((c) => c.is_active);

  if (filters.district) {
    results = results.filter((c) => c.district?.slug === filters.district);
  }

  if (filters.type) {
    results = results.filter((c) => c.pricing.some((p) => p.club_type.slug === filters.type));
  }

  if (filters.priceMax != null) {
    const priceMax = filters.priceMax;
    results = results.filter((c) => c.pricing.some((p) => p.price_from <= priceMax));
  }

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim().toLowerCase();
    results = results.filter(
      (c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q),
    );
  }

  return [...results].sort((a, b) => {
    if (a.is_premium !== b.is_premium) return a.is_premium ? -1 : 1;
    return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
  });
}
