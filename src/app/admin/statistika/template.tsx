import Link from 'next/link';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';

type ClubRow = {
  id: string;
  is_active: boolean;
  is_verified: boolean;
  latitude: number | null;
  longitude: number | null;
  instagram_url: string | null;
  phone: string | null;
};

type RelationRow = { club_id: string };
type TypeRow = { id: string; slug: string };
type TypeAssignmentRow = { club_id: string; club_type_id: string };
type OwnerClaimRow = { club_id: string | null; status: string };
type SubmissionRow = { kind: string; status: string };

type SupplyHealth = {
  total: number;
  active: number;
  publicReady: number;
  verified: number;
  claimed: number;
  fullyEnriched: number;
  missingCoordinates: number;
  missingInstagram: number;
  missingPhone: number;
  missingType: number;
  missingImages: number;
  missingHours: number;
  missingPricing: number;
  ownerClaimsInReview: number;
  newClubsInReview: number;
  correctionsInReview: number;
};

function nonEmpty(value: string | null) {
  return Boolean(value?.trim());
}

function setFrom(rows: RelationRow[]) {
  return new Set(rows.map((row) => row.club_id));
}

function pct(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

async function getSupplyHealth(): Promise<{ data: SupplyHealth | null; error: string | null }> {
  const supabase = await createClient();

  const [
    clubsResult,
    typesResult,
    assignmentsResult,
    imagesResult,
    hoursResult,
    pricingResult,
    ownerClaimsResult,
    submissionsResult,
  ] = await Promise.all([
    supabase.from('clubs').select('id,is_active,is_verified,latitude,longitude,instagram_url,phone'),
    supabase.from('club_types').select('id,slug').in('slug', ['pc', 'playstation']),
    supabase.from('club_type_assignments').select('club_id,club_type_id'),
    supabase.from('club_images').select('club_id'),
    supabase.from('club_opening_hours').select('club_id'),
    supabase.from('club_pricing').select('club_id'),
    supabase.from('club_submissions').select('club_id,status').eq('kind', 'owner_claim'),
    supabase.from('club_submissions').select('kind,status').in('status', ['pending', 'reviewing']),
  ]);

  const firstError = [
    clubsResult.error,
    typesResult.error,
    assignmentsResult.error,
    imagesResult.error,
    hoursResult.error,
    pricingResult.error,
    ownerClaimsResult.error,
    submissionsResult.error,
  ].find(Boolean);

  if (firstError) return { data: null, error: firstError.message };

  const clubs = (clubsResult.data ?? []) as ClubRow[];
  const types = (typesResult.data ?? []) as TypeRow[];
  const assignments = (assignmentsResult.data ?? []) as TypeAssignmentRow[];
  const supportedTypeIds = new Set(types.map((row) => row.id));
  const supportedTypeClubs = new Set(
    assignments.filter((row) => supportedTypeIds.has(row.club_type_id)).map((row) => row.club_id)
  );
  const imageClubs = setFrom((imagesResult.data ?? []) as RelationRow[]);
  const hoursClubs = setFrom((hoursResult.data ?? []) as RelationRow[]);
  const pricingClubs = setFrom((pricingResult.data ?? []) as RelationRow[]);
  const claimedClubs = new Set(
    ((ownerClaimsResult.data ?? []) as OwnerClaimRow[])
      .filter((row) => row.status === 'resolved' && row.club_id)
      .map((row) => row.club_id as string)
  );
  const openSubmissions = (submissionsResult.data ?? []) as SubmissionRow[];

  let publicReady = 0;
  let fullyEnriched = 0;
  let missingCoordinates = 0;
  let missingInstagram = 0;
  let missingPhone = 0;
  let missingType = 0;
  let missingImages = 0;
  let missingHours = 0;
  let missingPricing = 0;

  for (const club of clubs) {
    const hasCoordinates = club.latitude != null && club.longitude != null;
    const hasInstagram = nonEmpty(club.instagram_url);
    const hasPhone = nonEmpty(club.phone);
    const hasType = supportedTypeClubs.has(club.id);
    const hasImages = imageClubs.has(club.id);
    const hasHours = hoursClubs.has(club.id);
    const hasPricing = pricingClubs.has(club.id);

    if (!hasCoordinates) missingCoordinates += 1;
    if (!hasInstagram) missingInstagram += 1;
    if (!hasPhone) missingPhone += 1;
    if (!hasType) missingType += 1;
    if (!hasImages) missingImages += 1;
    if (!hasHours) missingHours += 1;
    if (!hasPricing) missingPricing += 1;

    if (club.is_active && hasCoordinates && hasInstagram && hasType) publicReady += 1;
    if (hasCoordinates && hasInstagram && hasPhone && hasType && hasImages && hasHours && hasPricing) fullyEnriched += 1;
  }

  return {
    error: null,
    data: {
      total: clubs.length,
      active: clubs.filter((club) => club.is_active).length,
      publicReady,
      verified: clubs.filter((club) => club.is_verified).length,
      claimed: claimedClubs.size,
      fullyEnriched,
      missingCoordinates,
      missingInstagram,
      missingPhone,
      missingType,
      missingImages,
      missingHours,
      missingPricing,
      ownerClaimsInReview: openSubmissions.filter((row) => row.kind === 'owner_claim').length,
      newClubsInReview: openSubmissions.filter((row) => row.kind === 'new_club').length,
      correctionsInReview: openSubmissions.filter((row) => row.kind === 'correction').length,
    },
  };
}

export default async function StatisticsTemplate({ children }: { children: ReactNode }) {
  const { data: health, error } = await getSupplyHealth();

  return (
    <>
      <section data-founder-supply-health="true" className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Klub bazasının sağlamlığı</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">SUPPLY</span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">Founder üçün real supply görünüşü: public hazır klublar, profil tamlığı, owner təsdiqi və məlumat borcu. Heç bir boş sahə standart məlumatla doldurulmur.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/klublar" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Klublar</Link>
            <Link href="/admin/muracietler" className="rounded-lg bg-[#7C5CFC] px-3 py-2 text-sm font-semibold text-white hover:bg-[#6A47F0]">Müraciətlər</Link>
          </div>
        </div>

        {error || !health ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Supply statistikası oxunmadı. Yanlış 0 göstərmək əvəzinə bu blok nəticəni gizlədir.</div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {[
                ['Bütün klublar', health.total, 'DB inventory'],
                ['Aktiv', health.active, `${pct(health.active, health.total)}% inventory`],
                ['Public hazır', health.publicReady, `${pct(health.publicReady, health.total)}% inventory`],
                ['Tam profil', health.fullyEnriched, `${pct(health.fullyEnriched, health.total)}% inventory`],
                ['Verified', health.verified, `${pct(health.verified, health.total)}% inventory`],
                ['Owner claimed', health.claimed, `${pct(health.claimed, health.total)}% inventory`],
              ].map(([label, value, note]) => (
                <div key={label as string} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label as string}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-950">{value as number}</p>
                  <p className="mt-1 text-xs text-gray-500">{note as string}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_1fr]">
              <div className="rounded-xl border border-gray-200 p-4 sm:p-5">
                <div className="flex items-end justify-between gap-3">
                  <div><h3 className="font-bold">Məlumat borcu</h3><p className="mt-1 text-xs text-gray-500">Ən böyük supply boşluqları yuxarıdan aşağı prioritetləşdirilir.</p></div>
                  <span className="text-xs text-gray-400">klub sayı</span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    ['Şəkil yoxdur', health.missingImages],
                    ['Qiymət yoxdur', health.missingPricing],
                    ['Instagram yoxdur', health.missingInstagram],
                    ['İş saatı yoxdur', health.missingHours],
                    ['Koordinat yoxdur', health.missingCoordinates],
                    ['Telefon yoxdur', health.missingPhone],
                    ['PC/PS tipi yoxdur', health.missingType],
                  ].sort((a, b) => Number(b[1]) - Number(a[1])).map(([label, value]) => (
                    <div key={label as string} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
                      <span className="text-sm font-medium text-gray-700">{label as string}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-sm font-bold text-gray-900 shadow-sm">{value as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 sm:p-5">
                <h3 className="font-bold">Əməliyyat növbəsi</h3>
                <p className="mt-1 text-xs text-gray-500">Pending və reviewing müraciətlər. Founder hansı supply işinin gözlədiyini bir baxışda görür.</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-3"><span className="text-sm font-semibold text-violet-900">Owner claim</span><span className="text-xl font-bold text-violet-900">{health.ownerClaimsInReview}</span></div>
                  <div className="flex items-center justify-between rounded-lg bg-sky-50 px-3 py-3"><span className="text-sm font-semibold text-sky-900">Yeni klub</span><span className="text-xl font-bold text-sky-900">{health.newClubsInReview}</span></div>
                  <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-3"><span className="text-sm font-semibold text-amber-900">Düzəliş</span><span className="text-xl font-bold text-amber-900">{health.correctionsInReview}</span></div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
      {children}
    </>
  );
}
