import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isVagueClubAddress } from '@/lib/clubDataQuality';

export const dynamic = 'force-dynamic';

type ActiveClubRow = {
  id: string;
  address: string | null;
  description: string | null;
  instagram_url: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
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
  let vagueAddress = 0;
  let stale90 = 0;

  const nowIso = new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const stale90Ms = 90 * 86_400_000;
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
    supabase.from('clubs').select('id,address,description,instagram_url,latitude,longitude,updated_at').eq('is_active', true),
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
    if (isVagueClubAddress(club.address)) vagueAddress += 1;
    const updatedMs = Date.parse(club.updated_at);
    if (!Number.isFinite(updatedMs) || nowMs - updatedMs >= stale90Ms) stale90 += 1;
  }

  const visibleClubs = Math.max(0, activeClubs - missingCoordinates);
  const inactiveClubs = Math.max(0, totalClubs - activeClubs);

  const completenessItems = [
    { label: 'Telefon çatmır', value: missingPhone, key: 'phone' },
    { label: 'Təsvir çatmır', value: missingDescription, key: 'description' },
    { label: 'Instagram yoxdur', value: missingInstagram, key: 'instagram' },
    { label: 'İş saatı çatmır', value: missingHours, key: 'hours' },
    { label: 'Qiymət çatmır', value: missingPricing, key: 'pricing' },
    { label: 'Şəkil çatmır', value: missingImages, key: 'images' },
    { label: 'Klub tipi çatmır', value: missingTypes, key: 'types' },
    { label: 'Koordinat çatmır', value: missingCoordinates, key: 'coordinates' },
    { label: 'Ünvan qeyri-dəqiqdir', value: vagueAddress, key: 'address' },
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Ümumi klub</p><p className="mt-2 text-4xl font-bold">{totalClubs}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Aktiv</p><p className="mt-2 text-4xl font-bold">{activeClubs}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Aktiv premium</p><p className="mt-2 text-4xl font-bold">{premiumClubs}</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-sm text-gray-500">Təsdiqlənmiş</p><p className="mt-2 text-4xl font-bold">{verifiedClubs}</p></div>
        <Link href="/admin/klublar?status=active&freshness=stale90&sort=oldest" className="rounded-xl border border-amber-200 bg-amber-50 p-6 transition hover:border-amber-400">
          <p className="text-sm text-amber-700">90+ gün köhnə</p>
          <div className="mt-2 flex items-end justify-between gap-3"><p className="text-4xl font-bold text-amber-900">{stale90}</p><span className="text-sm font-semibold text-amber-700">Yoxla →</span></div>
        </Link>
        <Link href="/admin/muracietler?status=pending" className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-[#7C5CFC]/50 hover:bg-[#7C5CFC]/5">
          <p className="text-sm text-gray-500">Gözləyən müraciət</p>
          <div className="mt-2 flex items-end justify-between gap-3"><p className="text-4xl font-bold">{pendingSubmissions}</p><span className="text-sm font-semibold text-[#6A47F0]">Bax →</span></div>
        </Link>
      </div>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Klub görünürlüğü</h2>
            <p className="mt-1 text-sm text-gray-500">Aktiv klubların saytda görünmə vəziyyəti koordinat məlumatına əsasən ayrıca göstərilir.</p>
          </div>
          <Link href="/admin/klublar" className="text-sm font-semibold text-[#6A47F0] hover:underline">Klubları idarə et</Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/klublar?status=active&visibility=public" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 transition hover:border-emerald-400">
            <p className="text-sm text-emerald-700">Saytda görünən</p>
            <p className="mt-1 text-3xl font-bold text-emerald-950">{visibleClubs}</p>
            <p className="mt-1 text-xs text-emerald-700">Aktiv və koordinatı tam</p>
          </Link>
          <Link href="/admin/klublar?status=active&missing=coordinates" className="rounded-lg border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-400">
            <p className="text-sm text-amber-700">Koordinatsız gizli</p>
            <p className="mt-1 text-3xl font-bold text-amber-950">{missingCoordinates}</p>
            <p className="mt-1 text-xs text-amber-700">Aktivdir, public siyahıda görünmür</p>
          </Link>
          <Link href="/admin/klublar?status=active" className="rounded-lg border border-blue-200 bg-blue-50 p-4 transition hover:border-blue-400">
            <p className="text-sm text-blue-700">Ümumi aktiv</p>
            <p className="mt-1 text-3xl font-bold text-blue-950">{activeClubs}</p>
            <p className="mt-1 text-xs text-blue-700">Görünən və koordinatsız birlikdə</p>
          </Link>
          <Link href="/admin/klublar?status=inactive" className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-400">
            <p className="text-sm text-gray-600">Deaktiv / gizlədilmiş</p>
            <p className="mt-1 text-3xl font-bold text-gray-950">{inactiveClubs}</p>
            <p className="mt-1 text-xs text-gray-600">Public saytda göstərilmir</p>
          </Link>
        </div>
      </section>

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
