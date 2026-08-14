import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    q?: string;
    status?: string;
  };
}

export default async function AdminClubsPage({
  searchParams,
}: PageProps) {
  const supabase = createClient();

  if (!supabase) {
    return (
      <p className="text-sm text-red-600">
        Supabase konfiqurasiyası tapılmadı.
      </p>
    );
  }

  const db = supabase as any;

  let query = db
    .from('clubs')
    .select(`
      id,
      name,
      slug,
      address,
      district_id,
      is_active,
      is_premium,
      rating_avg,
      updated_at
    `)
    .order('updated_at', {
      ascending: false,
    });

  const q = searchParams.q?.trim();

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,address.ilike.%${q}%`
    );
  }

  if (searchParams.status === 'active') {
    query = query.eq('is_active', true);
  }

  if (searchParams.status === 'inactive') {
    query = query.eq('is_active', false);
  }

  if (searchParams.status === 'premium') {
    query = query.eq('is_premium', true);
  }

  const clubsResult = await query;

  if (clubsResult.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Klub siyahısı yüklənmədi: {clubsResult.error.message}
      </div>
    );
  }

  const districtsResult = await db
    .from('districts')
    .select('id,name');

  const districts = new Map<string, string>(
    (districtsResult.data ?? []).map(
      (district: {
        id: string;
        name: string;
      }) => [
        district.id,
        district.name,
      ]
    )
  );

  const clubs = (clubsResult.data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    address: string;
    district_id: string;
    is_active: boolean;
    is_premium: boolean;
    rating_avg: number | null;
    updated_at: string;
  }>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Klublar
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {clubs.length} klub tapıldı. Klub əlavə et və bütün məlumatlarını redaktə et.
          </p>
        </div>

        <Link
          href="/admin/klublar/yeni"
          className="rounded-lg bg-[#7C5CFC] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6A47F0]"
        >
          + Yeni klub
        </Link>
      </div>

      {/* Search / filter */}
      <form className="mt-6 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row">
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Klub adı və ya ünvan..."
          className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10"
        />

        <select
          name="status"
          defaultValue={
            searchParams.status ?? ''
          }
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
        >
          <option value="">
            Bütün statuslar
          </option>

          <option value="active">
            Aktiv
          </option>

          <option value="inactive">
            Deaktiv
          </option>

          <option value="premium">
            Premium
          </option>
        </select>

        <button
          type="submit"
          className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white"
        >
          Axtar
        </button>

        {(searchParams.q ||
          searchParams.status) && (
          <Link
            href="/admin/klublar"
            className="flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium"
          >
            Təmizlə
          </Link>
        )}
      </form>

      {/* Club table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">
                  Klub
                </th>

                <th className="px-4 py-3">
                  Rayon
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3">
                  Premium
                </th>

                <th className="px-4 py-3">
                  Reytinq
                </th>

                <th className="px-4 py-3 text-right">
                  İdarəetmə
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {clubs.map((club) => (
                <tr
                  key={club.id}
                  className="transition hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">
                      {club.name}
                    </div>

                    <div className="mt-0.5 max-w-[330px] truncate text-xs text-gray-500">
                      {club.address}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {districts.get(
                      club.district_id
                    ) ?? '—'}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={
                        club.is_active
                          ? 'rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700'
                          : 'rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600'
                      }
                    >
                      {club.is_active
                        ? 'Aktiv'
                        : 'Deaktiv'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {club.is_premium ? (
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-[#B8860B]">
                        Premium
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        —
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {club.rating_avg ??
                      '—'}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/klublar/${club.id}`}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold transition hover:border-[#7C5CFC] hover:text-[#7C5CFC]"
                    >
                      Redaktə et
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {clubs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-gray-900">
              Klub tapılmadı
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Axtarışı və ya filteri dəyiş.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
