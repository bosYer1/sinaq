import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ActiveClubRow = { id: string; latitude: number | null; longitude: number | null };
type ClubIdRow = { club_id: string };

export default async function AdminPage() {
  const supabase = await createClient();

  let totalClubs = 0;
  let activeClubs = 0;
  let premiumClubs = 0;
  let missingPhone = 0;
  let missingHours = 0;
  let missingImages = 0;
  let missingTypes = 0;
  let missingCoordinates = 0;

  const [
    totalResult,
    activeResult,
    premiumResult,
    missingPhoneResult,
    activeRowsResult,
    hoursResult,
    imagesResult,
    typesResult,
  ] = await Promise.all([
    supabase.from('clubs').select('*', { count: 'exact', head: true }),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_active', true).is('phone', null),
    supabase.from('clubs').select('id,latitude,longitude').eq('is_active', true),
    supabase.from('club_opening_hours').select('club_id'),
    supabase.from('club_images').select('club_id'),
    supabase.from('club_type_assignments').select('club_id'),
  ]);

  totalClubs = totalResult.count ?? 0;
  activeClubs = activeResult.count ?? 0;
  premiumClubs = premiumResult.count ?? 0;
  missingPhone = missingPhoneResult.count ?? 0;

  const activeRows = (activeRowsResult.data ?? []) as ActiveClubRow[];
  const hourRows = (hoursResult.data ?? []) as ClubIdRow[];
  const imageRows = (imagesResult.data ?? []) as ClubIdRow[];
  const typeRows = (typesResult.data ?? []) as ClubIdRow[];

  const idsWithHours = new Set(hourRows.map((row) => row.club_id));
  const idsWithImages = new Set(imageRows.map((row) => row.club_id));
  const idsWithTypes = new Set(typeRows.map((row) => row.club_id));

  for (const club of activeRows) {
    if (!idsWithHours.has(club.id)) missingHours += 1;
    if (!idsWithImages.has(club.id)) missingImages += 1;
    if (!idsWithTypes.has(club.id)) missingTypes += 1;
    if (club.latitude == null || club.longitude == null) missingCoordinates += 1;
  }

  const completenessItems = [
    { label: 'Telefon çatmır', value: missingPhone },
    { label: 'İş saatı çatmır', value: missingHours },
    { label: 'Şəkil çatmır', value: missingImages },
    { label: 'Klub tipi çatmır', value: missingTypes },
    { label: 'Koordinat çatmır', value: missingCoordinates },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">GameYer məlumatlarını bir yerdən idarə et.</p>
        </div>

        <Link href="/admin/klublar/yeni" className="rounded-lg bg-[#7C5CFC] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6A47F0]">
          + Yeni klub
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Ümumi klub</p><p className="mt-2 text-4xl font-bold">{totalClubs}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Aktiv</p><p className="mt-2 text-4xl font-bold">{activeClubs}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Premium</p><p className="mt-2 text-4xl font-bold">{premiumClubs}</p></div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Məlumat keyfiyyəti</h2>
            <p className="mt-1 text-sm text-gray-500">Aktiv klublarda tamamlanmalı sahələr. Sıfır olduqda həmin məlumat bloku tamdır.</p>
          </div>
          <Link href="/admin/klublar" className="text-sm font-semibold text-[#6A47F0] hover:underline">Klubları idarə et</Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {completenessItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">Sürətli idarəetmə</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin/klublar" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50">Bütün klublar</Link>
          <Link href="/admin/klublar/yeni" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50">Klub əlavə et</Link>
          <Link href="/" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50">Sayta bax</Link>
        </div>
      </div>
    </div>
  );
}
