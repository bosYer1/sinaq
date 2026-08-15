import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ActiveClubRow = {
  id: string;
  description: string | null;
  instagram_url: string | null;
  latitude: number | null;
  longitude: number | null;
};
type ClubIdRow = { club_id: string };

export default async function AdminPage() {
  const supabase = await createClient();

  let totalClubs = 0;
  let activeClubs = 0;
  let premiumClubs = 0;
  let verifiedClubs = 0;
  let pendingSubmissions = 0;
  let missingPhone = 0;
  let missingDescription = 0;
  let missingInstagram = 0;
  let missingHours = 0;
  let missingPricing = 0;
  let missingImages = 0;
  let missingTypes = 0;
  let missingCoordinates = 0;

  const nowIso = new Date().toISOString();
  const [
    totalResult,
    activeResult,
    premiumResult,
    verifiedResult,
    pendingSubmissionsResult,
    missingPhoneResult,
    activeRowsResult,
    hoursResult,
    pricingResult,
    imagesResult,
    typesResult,
  ] = await Promise.all([
    supabase.from('clubs').select('*', { count: 'exact', head: true }),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('clubs')
      .select('*', { count: 'exact', head: true })
      .eq('is_premium', true)
      .gt('premium_expires_at', nowIso),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_active', true).is('phone', null),
    supabase.from('clubs').select('id,description,instagram_url,latitude,longitude').eq('is_active', true),
    supabase.from('club_opening_hours').select('club_id'),
    supabase.from('club_pricing').select('club_id'),
    supabase.from('club_images').select('club_id'),
    supabase.from('club_type_assignments').select('club_id'),
  ]);

  totalClubs = totalResult.count ?? 0;
  activeClubs = activeResult.count ?? 0;
  premiumClubs = premiumResult.count ?? 0;
  verifiedClubs = verifiedResult.count ?? 0;
  pendingSubmissions = pendingSubmissionsResult.count ?? 0;
  missingPhone = missingPhoneResult.count ?? 0;

  const activeRows = (activeRowsResult.data ?? []) as ActiveClubRow[];
  const hourRows = (hoursResult.data ?? []) as ClubIdRow[];
  const pricingRows = (pricingResult.data ?? []) as ClubIdRow[];
  const imageRows = (imagesResult.data ?? []) as ClubIdRow[];
  const typeRows = (typesResult.data ?? []) as ClubIdRow[];

  const idsWithHours = new Set(hourRows.map((row) => row.club_id));
  const idsWithPricing = new Set(pricingRows.map((row) => row.club_id));
  const idsWithImages = new Set(imageRows.map((row) => row.club_id));
  const idsWithTypes = new Set(typeRows.map((row) => row.club_id));

  for (const club of activeRows) {
    if (!club.description?.trim()) missingDescription += 1;
    if (!club.instagram_url) missingInstagram += 1;
    if (!idsWithHours.has(club.id)) missingHours += 1;
    if (!idsWithPricing.has(club.id)) missingPricing += 1;
    if (!idsWithImages.has(club.id)) missingImages += 1;
    if (!idsWithTypes.has(club.id)) missingTypes += 1;
    if (club.latitude == null || club.longitude == null) missingCoordinates += 1;
  }

  const completenessItems = [
    { label: 'Telefon çatmır', value: missingPhone, key: 'phone' },
    { label: 'Təsvir çatmır', value: missingDescription, key: 'description' },
    { label: 'Instagram yoxdur', value: missingInstagram, key: 'instagram' },
    { label: 'İş saatı çatmır', value: missingHours, key: 'hours' },
    { label: 'Qiymət çatmır', value: missingPricing, key: 'pricing' },
    { label: 'Şəkil çatmır', value: missingImages, key: 'images' },
    { label: 'Klub tipi çatmır', value: missingTypes, key: 'types' },
    { label: 'Koordinat çatmır', value: missingCoordinates, key: 'coordinates' },
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Ümumi klub</p><p className="mt-2 text-4xl font-bold">{totalClubs}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Aktiv</p><p className="mt-2 text-4xl font-bold">{activeClubs}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Aktiv premium</p><p className="mt-2 text-4xl font-bold">{premiumClubs}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Təsdiqlənmiş</p><p className="mt-2 text-4xl font-bold">{verifiedClubs}</p></div>
        <Link href="/admin/muracietler?status=pending" className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-[#7C5CFC]/50 hover:bg-[#7C5CFC]/5">
          <p className="text-sm text-gray-500">Gözləyən müraciət</p>
          <div className="mt-2 flex items-end justify-between gap-3"><p className="text-4xl font-bold">{pendingSubmissions}</p><span className="text-sm font-semibold text-[#6A47F0]">Bax →</span></div>
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Məlumat keyfiyyəti</h2>
            <p className="mt-1 text-sm text-gray-500">Kartın üzərinə vuraraq həmin məlumatı çatmayan klubları birbaşa görə bilərsən.</p>
          </div>
          <Link href="/admin/klublar" className="text-sm font-semibold text-[#6A47F0] hover:underline">Klubları idarə et</Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {completenessItems.map((item) => (
            <Link
              key={item.key}
              href={`/admin/klublar?missing=${item.key}`}
              className="group rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-[#7C5CFC]/50 hover:bg-[#7C5CFC]/5"
              title={`${item.label} olan klubları göstər`}
            >
              <p className="text-sm text-gray-500 transition group-hover:text-[#6A47F0]">{item.label}</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <span className="text-xs font-semibold text-[#6A47F0] opacity-0 transition group-hover:opacity-100">Bax →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">Sürətli idarəetmə</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin/klublar" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50">Bütün klublar</Link>
          <Link href="/admin/muracietler" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50">Müraciətlər</Link>
          <Link href="/admin/klublar/yeni" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50">Klub əlavə et</Link>
          <Link href="/" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50">Sayta bax</Link>
        </div>
      </div>
    </div>
  );
}
