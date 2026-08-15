import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    missing?: string;
    sort?: string;
  }>;
}

function sanitizeSearch(value?: string) {
  if (!value) return '';
  return value
    .trim()
    .replace(/[,%()]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

const missingLabels: Record<string, string> = {
  phone: 'Telefon çatmır',
  description: 'Təsvir çatmır',
  instagram: 'Instagram yoxdur',
  hours: 'İş saatı çatmır',
  pricing: 'Qiymət çatmır',
  images: 'Şəkil çatmır',
  types: 'Klub tipi çatmır',
  coordinates: 'Koordinat çatmır',
};

export default async function AdminClubsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const nowMs = Date.parse(nowIso);

  let query = supabase
    .from('clubs')
    .select(`
      id,
      name,
      slug,
      description,
      address,
      district_id,
      phone,
      instagram_url,
      latitude,
      longitude,
      is_active,
      is_premium,
      premium_expires_at,
      updated_at
    `)
    .order('updated_at', { ascending: false });

  const q = sanitizeSearch(resolvedSearchParams.q);

  if (q) query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`);
  if (resolvedSearchParams.status === 'active') query = query.eq('is_active', true);
  if (resolvedSearchParams.status === 'inactive') query = query.eq('is_active', false);
  if (resolvedSearchParams.status === 'premium') {
    query = query.eq('is_premium', true).gt('premium_expires_at', nowIso);
  }

  const clubsResult = await query;

  if (clubsResult.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Klub siyahısı yüklənmədi: {clubsResult.error.message}
      </div>
    );
  }

  const clubs = clubsResult.data ?? [];

  const [districtsResult, hoursResult, imagesResult, typesResult, pricingResult] = await Promise.all([
    supabase.from('districts').select('id,name'),
    supabase.from('club_opening_hours').select('club_id'),
    supabase.from('club_images').select('club_id'),
    supabase.from('club_type_assignments').select('club_id'),
    supabase.from('club_pricing').select('club_id'),
  ]);

  const districts = new Map<string, string>(
    (districtsResult.data ?? []).map((district) => [district.id, district.name])
  );

  const idsWithHours = new Set((hoursResult.data ?? []).map((row) => row.club_id));
  const idsWithImages = new Set((imagesResult.data ?? []).map((row) => row.club_id));
  const idsWithTypes = new Set((typesResult.data ?? []).map((row) => row.club_id));
  const idsWithPricing = new Set((pricingResult.data ?? []).map((row) => row.club_id));
  const missingFilter = resolvedSearchParams.missing && missingLabels[resolvedSearchParams.missing]
    ? resolvedSearchParams.missing
    : '';
  const sort = resolvedSearchParams.sort === 'seo-low' || resolvedSearchParams.sort === 'seo-high'
    ? resolvedSearchParams.sort
    : 'updated';

  function missingForClub(club: (typeof clubs)[number]) {
    return [
      !club.phone ? 'Telefon' : null,
      !club.description?.trim() ? 'Təsvir' : null,
      !club.instagram_url ? 'Instagram' : null,
      !idsWithHours.has(club.id) ? 'Saat' : null,
      !idsWithPricing.has(club.id) ? 'Qiymət' : null,
      !idsWithImages.has(club.id) ? 'Şəkil' : null,
      !idsWithTypes.has(club.id) ? 'Tip' : null,
      club.latitude == null || club.longitude == null ? 'Koordinat' : null,
    ].filter((value): value is string => Boolean(value));
  }

  function seoScoreForClub(club: (typeof clubs)[number]) {
    return Math.round(((8 - missingForClub(club).length) / 8) * 100);
  }

  const seoReadyCount = clubs.filter((club) => missingForClub(club).length === 0).length;
  const seoAverage = clubs.length > 0
    ? Math.round(clubs.reduce((sum, club) => sum + seoScoreForClub(club), 0) / clubs.length)
    : 0;

  const filteredClubs = clubs
    .filter((club) => {
      if (!missingFilter) return true;
      if (missingFilter === 'phone') return !club.phone;
      if (missingFilter === 'description') return !club.description?.trim();
      if (missingFilter === 'instagram') return !club.instagram_url;
      if (missingFilter === 'hours') return !idsWithHours.has(club.id);
      if (missingFilter === 'pricing') return !idsWithPricing.has(club.id);
      if (missingFilter === 'images') return !idsWithImages.has(club.id);
      if (missingFilter === 'types') return !idsWithTypes.has(club.id);
      if (missingFilter === 'coordinates') return club.latitude == null || club.longitude == null;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'seo-low') return seoScoreForClub(a) - seoScoreForClub(b) || a.name.localeCompare(b.name, 'az');
      if (sort === 'seo-high') return seoScoreForClub(b) - seoScoreForClub(a) || a.name.localeCompare(b.name, 'az');
      return Date.parse(b.updated_at) - Date.parse(a.updated_at);
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Klublar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredClubs.length} klub tapıldı. Klub əlavə et və bütün məlumatlarını redaktə et.
          </p>
        </div>

        <Link href="/admin/klublar/yeni" className="rounded-lg bg-[#7C5CFC] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6A47F0]">
          + Yeni klub
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">SEO orta tamlıq</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{seoAverage}%</p>
          <p className="mt-1 text-xs text-gray-500">Telefon, təsvir, şəkil, iş saatı, qiymət, tip və lokasiya əsasında.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">SEO-ready klublar</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{seoReadyCount}/{clubs.length}</p>
          <p className="mt-1 text-xs text-gray-500">Bütün əsas public məlumatları tam olan klublar.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Qiyməti olan klublar</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{idsWithPricing.size}</p>
          <p className="mt-1 text-xs text-gray-500">SEO və istifadəçi müqayisəsi üçün ən zəif məlumat sahələrindən biri.</p>
        </div>
      </div>

      {missingFilter ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Çatışmayan məlumat filtri:</span>
          <span>{missingLabels[missingFilter]}</span>
          <Link href="/admin/klublar" className="ml-auto font-semibold text-[#6A47F0] hover:underline">Filtri sil</Link>
        </div>
      ) : null}

      <form className="mt-6 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:flex-wrap">
        <input
          name="q"
          defaultValue={resolvedSearchParams.q ?? ''}
          maxLength={80}
          placeholder="Klub adı və ya ünvan..."
          className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10"
        />

        <select name="status" defaultValue={resolvedSearchParams.status ?? ''} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm">
          <option value="">Bütün statuslar</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Deaktiv</option>
          <option value="premium">Aktiv premium</option>
        </select>

        <select name="missing" defaultValue={missingFilter} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm">
          <option value="">Çatışmayan məlumat</option>
          <option value="phone">Telefon çatmır</option>
          <option value="description">Təsvir çatmır</option>
          <option value="instagram">Instagram yoxdur</option>
          <option value="hours">İş saatı çatmır</option>
          <option value="pricing">Qiymət çatmır</option>
          <option value="images">Şəkil çatmır</option>
          <option value="types">Klub tipi çatmır</option>
          <option value="coordinates">Koordinat çatmır</option>
        </select>

        <select name="sort" defaultValue={sort} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm">
          <option value="updated">Son yenilənən</option>
          <option value="seo-low">SEO zəif → güclü</option>
          <option value="seo-high">SEO güclü → zəif</option>
        </select>

        <button type="submit" className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white">Axtar</button>

        {(resolvedSearchParams.q || resolvedSearchParams.status || missingFilter || sort !== 'updated') ? (
          <Link href="/admin/klublar" className="flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium">
            Təmizlə
          </Link>
        ) : null}
      </form>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Klub</th>
                <th className="px-4 py-3">Rayon</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Premium</th>
                <th className="px-4 py-3">SEO</th>
                <th className="px-4 py-3">Məlumat</th>
                <th className="px-4 py-3 text-right">İdarəetmə</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredClubs.map((club) => {
                const missing = missingForClub(club);
                const seoScore = seoScoreForClub(club);
                const seoTone = seoScore >= 88
                  ? 'bg-green-50 text-green-700'
                  : seoScore >= 63
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-700';

                const premiumActive = Boolean(
                  club.is_premium &&
                  club.premium_expires_at &&
                  Date.parse(club.premium_expires_at) > nowMs
                );

                return (
                  <tr key={club.id} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{club.name}</div>
                      <div className="mt-0.5 max-w-[330px] truncate text-xs text-gray-500">{club.address}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{districts.get(club.district_id) ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={club.is_active ? 'rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700' : 'rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600'}>
                        {club.is_active ? 'Aktiv' : 'Deaktiv'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {premiumActive ? (
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-[#B8860B]">Aktiv premium</span>
                      ) : club.is_premium ? (
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">Premium bitib</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${seoTone}`}>{seoScore}%</span></td>
                    <td className="px-4 py-3">
                      {missing.length === 0 ? (
                        <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Tamdır</span>
                      ) : (
                        <div className="flex max-w-[320px] flex-wrap gap-1">
                          {missing.map((item) => <span key={item} className="rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">{item}</span>)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/klublar/${club.id}`} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold transition hover:border-[#7C5CFC] hover:text-[#7C5CFC]">Redaktə et</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredClubs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-gray-900">Klub tapılmadı</p>
            <p className="mt-1 text-xs text-gray-500">Axtarışı və ya filtri dəyiş.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
