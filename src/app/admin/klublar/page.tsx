import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}

type ClubRow = {
  id: string;
  name: string;
  slug: string;
  address: string;
  district_id: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  is_premium: boolean;
  premium_expires_at: string | null;
  rating_avg: number | null;
  updated_at: string;
};

type ClubIdRow = { club_id: string };

function sanitizeSearch(value?: string) {
  if (!value) return '';
  return value
    .trim()
    .replace(/[,%()]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

export default async function AdminClubsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const db = supabase as any;
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  let query = db
    .from('clubs')
    .select(`
      id,
      name,
      slug,
      address,
      district_id,
      phone,
      latitude,
      longitude,
      is_active,
      is_premium,
      premium_expires_at,
      rating_avg,
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

  const clubs = (clubsResult.data ?? []) as ClubRow[];

  const [districtsResult, hoursResult, imagesResult, typesResult] = await Promise.all([
    db.from('districts').select('id,name'),
    db.from('club_opening_hours').select('club_id'),
    db.from('club_images').select('club_id'),
    db.from('club_type_assignments').select('club_id'),
  ]);

  const districts = new Map<string, string>(
    (districtsResult.data ?? []).map((district: { id: string; name: string }) => [district.id, district.name])
  );

  const idsWithHours = new Set(((hoursResult.data ?? []) as ClubIdRow[]).map((row) => row.club_id));
  const idsWithImages = new Set(((imagesResult.data ?? []) as ClubIdRow[]).map((row) => row.club_id));
  const idsWithTypes = new Set(((typesResult.data ?? []) as ClubIdRow[]).map((row) => row.club_id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Klublar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {clubs.length} klub tapıldı. Klub əlavə et və bütün məlumatlarını redaktə et.
          </p>
        </div>

        <Link href="/admin/klublar/yeni" className="rounded-lg bg-[#7C5CFC] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6A47F0]">
          + Yeni klub
        </Link>
      </div>

      <form className="mt-6 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row">
        <input
          name="q"
          defaultValue={resolvedSearchParams.q ?? ''}
          maxLength={80}
          placeholder="Klub adı və ya ünvan..."
          className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10"
        />

        <select
          name="status"
          defaultValue={resolvedSearchParams.status ?? ''}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
        >
          <option value="">Bütün statuslar</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Deaktiv</option>
          <option value="premium">Aktiv premium</option>
        </select>

        <button type="submit" className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white">Axtar</button>

        {(resolvedSearchParams.q || resolvedSearchParams.status) ? (
          <Link href="/admin/klublar" className="flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium">
            Təmizlə
          </Link>
        ) : null}
      </form>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Klub</th>
                <th className="px-4 py-3">Rayon</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Premium</th>
                <th className="px-4 py-3">Məlumat</th>
                <th className="px-4 py-3">Reytinq</th>
                <th className="px-4 py-3 text-right">İdarəetmə</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {clubs.map((club) => {
                const missing = [
                  !club.phone ? 'Telefon' : null,
                  !idsWithHours.has(club.id) ? 'Saat' : null,
                  !idsWithImages.has(club.id) ? 'Şəkil' : null,
                  !idsWithTypes.has(club.id) ? 'Tip' : null,
                  club.latitude == null || club.longitude == null ? 'Koordinat' : null,
                ].filter((value): value is string => Boolean(value));

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
                    <td className="px-4 py-3">
                      {missing.length === 0 ? (
                        <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Tamdır</span>
                      ) : (
                        <div className="flex max-w-[260px] flex-wrap gap-1">
                          {missing.map((item) => <span key={item} className="rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">{item}</span>)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{club.rating_avg ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/klublar/${club.id}`} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold transition hover:border-[#7C5CFC] hover:text-[#7C5CFC]">
                        Redaktə et
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {clubs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-gray-900">Klub tapılmadı</p>
            <p className="mt-1 text-xs text-gray-500">Axtarışı və ya filtri dəyiş.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}