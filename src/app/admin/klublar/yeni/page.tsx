import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ClubAdminForm } from '@/components/admin/ClubAdminForm';
import { createClub } from '../../actions';

export const dynamic = 'force-dynamic';
export default async function AdminNewClubPage() {
  const supabase = createClient(); if (!supabase) return <p className="text-sm text-red-600">Supabase konfiqurasiyası tapılmadı.</p>;
  const [{ data: districts }, { data: types }] = await Promise.all([supabase.from('districts').select('*').order('name'), supabase.from('club_types').select('*').order('name')]);
  return <div><Link href="/admin/klublar" className="text-sm text-gray-500 hover:text-gray-900">← Klublara qayıt</Link><div className="mb-5 mt-2"><h1 className="text-2xl font-bold">Yeni klub</h1><p className="mt-1 text-sm text-gray-500">Klubun bütün məlumatlarını bir formadan əlavə et.</p></div><ClubAdminForm districts={districts ?? []} types={types ?? []} action={createClub} submitLabel="Klubu yarat" /></div>;
}
