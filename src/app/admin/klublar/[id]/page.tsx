import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClubAdminForm } from '@/components/admin/ClubAdminForm';
import { saveClub, toggleClubActive } from '../../actions';
import { revokeClubVerification } from './verification-actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string }>;
}

export default async function AdminEditClubPage({ params, searchParams }: PageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  const clubResult = await supabase.from('clubs').select('*').eq('id', id).single();
  if (clubResult.error || !clubResult.data) notFound();

  const [districtsResult, typesResult, pricingResult, assignmentsResult, hoursResult, imagesResult] = await Promise.all([
    supabase.from('districts').select('*').order('name'),
    supabase.from('club_types').select('*').order('name'),
    supabase.from('club_pricing').select('*').eq('club_id', id),
    supabase.from('club_type_assignments').select('club_type_id').eq('club_id', id),
    supabase.from('club_opening_hours').select('*').eq('club_id', id).order('day_of_week'),
    supabase.from('club_images').select('*').eq('club_id', id).order('position'),
  ]);

  const club = clubResult.data;
  const districts = districtsResult.data ?? [];
  const types = typesResult.data ?? [];
  const pricing = pricingResult.data ?? [];
  const typeAssignments = assignmentsResult.data ?? [];
  const hours = hoursResult.data ?? [];
  const images = imagesResult.data ?? [];

  const fullClub = {
    ...club,
    pricing,
    type_assignments: typeAssignments,
    opening_hours: hours,
    images,
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/klublar" className="text-sm text-gray-500 hover:text-gray-900">← Klublara qayıt</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{club.name}</h1>
            {club.is_verified ? (
              <span className="rounded-full bg-[#7C5CFC]/10 px-2.5 py-1 text-xs font-semibold text-[#6A47F0]">✓ Təsdiqlənib</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-gray-500">Klubun bütün məlumatlarını bu səhifədən idarə et.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {club.is_verified ? (
            <form action={revokeClubVerification}>
              <input type="hidden" name="id" value={club.id} />
              <button
                type="submit"
                className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
              >
                Təsdiqi ləğv et
              </button>
            </form>
          ) : null}

          <form action={toggleClubActive}>
            <input type="hidden" name="id" value={club.id} />
            <input type="hidden" name="next_value" value={club.is_active ? 'false' : 'true'} />
            <button
              type="submit"
              className={club.is_active
                ? 'rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50'
                : 'rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50'}
            >
              {club.is_active ? 'Deaktiv et' : 'Aktiv et'}
            </button>
          </form>
        </div>
      </div>

      {(resolvedSearchParams.saved === '1' || resolvedSearchParams.created === '1') && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">Dəyişikliklər yadda saxlanıldı.</div>
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
