import { createClient } from '@/lib/supabase/server';
import type { ClubFilters, ClubWithRelations } from '@/types/database';

/**
 * Supabase-in nested select sintaksisi ilə klubu bütün əlaqəli data ilə
 * (rayon, qiymətlər+tip, şəkillər, iş saatları) tək sorğuda çəkir.
 *
 * Nəticə tipi HƏR YERDƏ .returns<T>() ilə əl ilə təyin olunur — Supabase-in
 * avtomatik select-string tip-inference mexanizminə etibar edilmir, bu da
 * "never" tip xətalarının qarşısını qəti alır (bax: types/database.ts
 * başındakı izah).
 *
 * VACIB — .returns() və .maybeSingle() sırası: .maybeSingle() çağırışı
 * HƏMİŞƏ .returns<T>()-dən ƏVVƏL olmalıdır, əks halda (.returns() əvvəl,
 * .maybeSingle() sonra) TypeScript nəticəni never kimi tanıyır — real
 * Vercel build-də bu tərtiblə qarşılaşılıb və düzəldilib. Tək sətir gözlənən
 * sorğularda .returns<T>()-ə massiv deyil, təkil obyekt tipi verilir
 * (məs. .returns<{ id: string }>(), .returns<{ id: string }[]>() yox).
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
 *
 * Dizayn qərarı: PostgREST-in çox-səviyyəli embed filtrləri (məs.
 * pricing.club_type.slug kimi iki səviyyə dərinlikdə dot-filter) etibarsız/
 * qeyri-müəyyən davranışa malikdir. Bunun qarşısını almaq üçün əvvəlcə
 * district/club_type slug-larını id-yə çeviririk (lookup cədvəllər
 * kiçikdir, əlavə sorğu ucuzdur), sonra əsas sorğuda birbaşa foreign key
 * sütunları üzərindən filtr edirik.
 */
export async function getClubs(filters: ClubFilters = {}): Promise<ClubWithRelations[]> {
  const supabase = createClient();
  if (!supabase) return [];

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

  let clubTypeId: string | null = null;
  if (filters.type) {
    const { data: typeRow, error: typeError } = await supabase
      .from('club_types')
      .select('id')
      .eq('slug', filters.type)
      .maybeSingle()
      .returns<{ id: string }>();

    if (typeError) {
      console.error('getClubs (club_type lookup) xətası:', typeError.message);
      return [];
    }
    if (!typeRow) return [];
    clubTypeId = typeRow.id;
  }

  const needsPricingInnerJoin = Boolean(clubTypeId || filters.priceMax);
  const selectString = needsPricingInnerJoin
    ? CLUB_SELECT.replace('pricing:club_pricing (', 'pricing:club_pricing!inner (')
    : CLUB_SELECT;

  let query = supabase
    .from('clubs')
    .select(selectString)
    .eq('is_active', true)
    .order('is_premium', { ascending: false })
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

  const { data, error } = await query.returns<ClubWithRelations[]>();

  if (error) {
    console.error('getClubs xətası:', error.message);
    return [];
  }

  return data ?? [];
}

export async function getClubBySlug(slug: string): Promise<ClubWithRelations | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('clubs')
    .select(CLUB_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
    .returns<ClubWithRelations>();

  if (error) {
    console.error('getClubBySlug xətası:', error.message);
    return null;
  }

  return data;
}
