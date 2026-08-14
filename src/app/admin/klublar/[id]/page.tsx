import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClubAdminForm } from '@/components/admin/ClubAdminForm';
import { saveClub, toggleClubActive } from '../../actions';

import type {
  ClubRow,
  ClubPricing,
  ClubOpeningHours,
  ClubImage,
  District,
  ClubType,
} from '@/types/database';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };

  searchParams: {
    saved?: string;
    created?: string;
  };
}

export default async function AdminEditClubPage({
  params,
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

  /*
   * Manual Database type-larında Supabase bəzi query-ləri `never`
   * kimi infer etdiyi üçün yalnız bu admin səhifəsində client-i
   * lokal olaraq boşaldırıq.
   *
   * Runtime query-lər dəyişmir.
   */
  const db = supabase as any;

  const clubResult = await db
    .from('clubs')
    .select('*')
    .eq('id', params.id)
    .single();

  if (
    clubResult.error ||
    !clubResult.data
  ) {
    notFound();
  }

  const districtsResult = await db
    .from('districts')
    .select('*')
    .order('name');

  const typesResult = await db
    .from('club_types')
    .select('*')
    .order('name');

  const pricingResult = await db
    .from('club_pricing')
    .select('*')
    .eq('club_id', params.id);

  const hoursResult = await db
    .from('club_opening_hours')
    .select('*')
    .eq('club_id', params.id)
    .order('day_of_week');

  const imagesResult = await db
    .from('club_images')
    .select('*')
    .eq('club_id', params.id)
    .order('position');

  const club =
    clubResult.data as ClubRow;

  const districts =
    (districtsResult.data ?? []) as District[];

  const types =
    (typesResult.data ?? []) as ClubType[];

  const pricing =
    (pricingResult.data ?? []) as ClubPricing[];

  const hours =
    (hoursResult.data ?? []) as ClubOpeningHours[];

  const images =
    (imagesResult.data ?? []) as ClubImage[];

  const fullClub = {
    ...club,
    pricing,
    opening_hours: hours,
    images,
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/klublar"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Klublara qayıt
          </Link>

          <h1 className="mt-2 text-2xl font-bold">
            {club.name}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Klubun bütün məlumatlarını bu səhifədən idarə et.
          </p>
        </div>

        <form action={toggleClubActive}>
          <input
            type="hidden"
            name="id"
            value={club.id}
          />

          <input
            type="hidden"
            name="next_value"
            value={
              club.is_active
                ? 'false'
                : 'true'
            }
          />

          <button
            type="submit"
            className={
              club.is_active
                ? 'rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50'
                : 'rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50'
            }
          >
            {club.is_active
              ? 'Deaktiv et'
              : 'Aktiv et'}
          </button>
        </form>
      </div>

      {(searchParams.saved === '1' ||
        searchParams.created === '1') && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Dəyişikliklər yadda saxlanıldı.
        </div>
      )}

      <ClubAdminForm
        club={fullClub}
        districts={districts}
        types={types}
        action={saveClub}
        submitLabel="Dəyişiklikləri yadda saxla"
      />
    </div>
  );
}
