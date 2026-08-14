import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ClubAdminForm } from '@/components/admin/ClubAdminForm';
import { createClub } from '../../actions';
import type { ClubType, District } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminNewClubPage() {
  const supabase = await createClient();
  const [districtsResult, typesResult] = await Promise.all([
    supabase.from('districts').select('*').order('name'),
    supabase.from('club_types').select('*').order('name'),
  ]);

  if (districtsResult.error || typesResult.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Form məlumatları yüklənmədi. Səhifəni yeniləyib yenidən cəhd et.
      </div>
    );
  }

  const districts = (districtsResult.data ?? []) as District[];
  const types = (typesResult.data ?? []) as ClubType[];

  return (
    <div>
      <Link href="/admin/klublar" className="text-sm text-gray-500 hover:text-gray-900">
        ← Klublara qayıt
      </Link>
      <div className="mb-5 mt-2">
        <h1 className="text-2xl font-bold">Yeni klub</h1>
        <p className="mt-1 text-sm text-gray-500">Klubun bütün məlumatlarını bir formadan əlavə et.</p>
      </div>
      <ClubAdminForm
        districts={districts}
        types={types}
        action={createClub}
        submitLabel="Klubu yarat"
      />
    </div>
  );
}
