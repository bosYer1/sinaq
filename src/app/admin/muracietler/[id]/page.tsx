import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OwnerClaimApplyForm, type OwnerClaimCurrentValues } from '@/components/admin/OwnerClaimApplyForm';
import { OwnerClaimSummary } from '@/components/admin/OwnerClaimSummary';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import type { ClubSubmission } from '@/types/database';
import { deleteCompletedSubmission, linkCorrectionToClub, updateSubmissionStatus } from '../actions';

export const dynamic = 'force-dynamic';

type SubmissionRow = ClubSubmission;
type ClubSnapshot = {
  id: string;
  name: string;
  is_active: boolean;
  instagram_url: string | null;
  pricing: Array<{ price_from: number; club_type: { slug: string } | null }>;
  opening_hours: Array<{ day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }>;
};

type ClubOption = { id: string; name: string; is_active: boolean };

const KIND_LABELS: Record<SubmissionRow['kind'], string> = {
  correction: 'Düzəliş',
  new_club: 'Yeni klub',
  owner_claim: 'Klub sahibi',
};

const STATUS_LABELS: Record<SubmissionRow['status'], string> = {
  pending: 'Gözləyir',
  reviewing: 'Yoxlanılır',
  resolved: 'Həll olunub',
  rejected: 'Rədd edilib',
};

function contactHref(row: SubmissionRow) {
  if (row.contact_type === 'email') return `mailto:${row.contact_value}`;
  if (row.contact_type === 'phone') return `tel:${row.contact_value.replace(/[^+\d]/g, '')}`;
  if (row.contact_value.startsWith('http')) return row.contact_value;
  return `https://www.instagram.com/${row.contact_value.replace(/^@/, '')}/`;
}

function currentHoursLabel(hours: ClubSnapshot['opening_hours']) {
  const sorted = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);
  if (sorted.length === 0) return null;
  if (sorted.some((row) => row.is_closed || !row.open_time || !row.close_time)) return 'Günlər üzrə fərqli qrafik';
  if (sorted.length !== 7) return `${sorted.length}/7 gün üçün saat var`;
  const pairs = new Set(sorted.map((row) => `${row.open_time!.slice(0, 5)}-${row.close_time!.slice(0, 5)}`));
  if (pairs.size !== 1) return 'Günlər üzrə fərqli qrafik';
  const [pair] = Array.from(pairs);
  if (pair === '00:00-23:59') return '24/7';
  const [open, close] = pair.split('-');
  return `Hər gün ${open}–${close}`;
}

function currentValues(club: ClubSnapshot): OwnerClaimCurrentValues {
  const pc = club.pricing.find((row) => row.club_type?.slug === 'pc');
  const ps = club.pricing.find((row) => row.club_type?.slug === 'playstation');
  return {
    instagram: club.instagram_url,
    pcPrice: pc?.price_from ?? null,
    psPrice: ps?.price_from ?? null,
    hours: currentHoursLabel(club.opening_hours),
  };
}

function CorrectionLinkForm({ item, clubs }: { item: SubmissionRow; clubs: ClubOption[] }) {
  const activeClubs = clubs.filter((club) => club.is_active);
  return (
    <form action={linkCorrectionToClub} className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <input type="hidden" name="id" value={item.id} />
      <p className="text-xs font-semibold text-amber-900">Düzəliş müraciətini doğru aktiv kluba bağla</p>
      <p className="mt-1 text-xs leading-5 text-amber-800">Səhv klub məlumatının dəyişməməsi üçün klub seçimi admin tərəfindən təsdiqlənir.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select name="club_id" required defaultValue="" className="h-10 min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 text-sm text-gray-900">
          <option value="" disabled>Aktiv klub seç</option>
          {activeClubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
        </select>
        <button type="submit" className="h-10 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700">Kluba bağla</button>
      </div>
    </form>
  );
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('club_submissions')
    .select('id,kind,club_id,club_name,message,contact_type,contact_value,status,created_at,reviewed_at,applied_fields,applied_at,submitted_images')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) notFound();

  const item = data as SubmissionRow;
  const completed = item.status === 'resolved' || item.status === 'rejected';

  const [clubResult, clubsResult] = await Promise.all([
    item.club_id
      ? supabase
          .from('clubs')
          .select('id,name,is_active,instagram_url,pricing:club_pricing(price_from,club_type:club_types(slug)),opening_hours:club_opening_hours(day_of_week,open_time,close_time,is_closed)')
          .eq('id', item.club_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    item.kind === 'correction' && !item.club_id && !completed
      ? supabase.from('clubs').select('id,name,is_active').order('name', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (clubResult.error) throw new Error(clubResult.error.message);
  if (clubsResult.error) throw new Error(clubsResult.error.message);

  const linkedClub = clubResult.data as unknown as ClubSnapshot | null;
  const clubs = (clubsResult.data ?? []) as ClubOption[];
  const current = linkedClub ? currentValues(linkedClub) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/muracietler" className="text-sm font-semibold text-[#6A47F0] hover:underline">← Bütün müraciətlər</Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#7C5CFC]/10 px-2.5 py-1 text-xs font-semibold text-[#6A47F0]">{KIND_LABELS[item.kind]}</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{STATUS_LABELS[item.status]}</span>
            {(item.kind === 'owner_claim' || item.kind === 'correction') && !item.club_id ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Kluba bağlı deyil</span> : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">{item.club_name}</h1>
          <p className="mt-1 text-xs text-gray-400">{new Date(item.created_at).toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}</p>
          {linkedClub ? <p className="mt-2 text-sm font-semibold text-emerald-700">Bağlı klub: {linkedClub.name}{linkedClub.is_active ? '' : ' (deaktiv)'}</p> : null}
        </div>
        {item.club_id ? <Link href={`/admin/klublar/${item.club_id}`} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Klub admininə bax</Link> : null}
      </div>

      <article className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {item.kind === 'owner_claim' ? <OwnerClaimSummary message={item.message} /> : <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{item.message}</p>}

        <div className="mt-4 border-t border-gray-100 pt-4">
          <a href={contactHref(item)} target={item.contact_type === 'instagram' ? '_blank' : undefined} rel={item.contact_type === 'instagram' ? 'noopener noreferrer' : undefined} className="text-sm font-semibold text-[#6A47F0] hover:underline">
            {item.contact_type}: {item.contact_value}
          </a>
        </div>

        {item.kind === 'correction' && !item.club_id && !completed ? <CorrectionLinkForm item={item} clubs={clubs} /> : null}

        {item.kind === 'correction' && item.club_id && !completed ? (
          <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs leading-5 text-sky-800">Düzəliş mətnini yoxla, sonra real klub admin səhifəsində yalnız təsdiqlədiyin sahələri dəyiş.</p>
            <Link href={`/admin/klublar/${item.club_id}`} className="mt-2 inline-flex h-9 items-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700">Klub məlumatını düzəlt</Link>
          </div>
        ) : null}

        {item.kind === 'new_club' && !completed ? (
          <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
            <p className="text-xs leading-5 text-violet-800">Klubun real olduğunu və koordinatını ayrıca yoxla. Sonra yeni klub formasını bu müraciətlə aç.</p>
            <Link href={`/admin/klublar/yeni?submission=${encodeURIComponent(item.id)}`} className="mt-2 inline-flex h-9 items-center rounded-lg bg-[#7C5CFC] px-4 text-sm font-semibold text-white hover:bg-[#6A47F0]">Yeni klub formasında aç</Link>
          </div>
        ) : null}

        {item.kind === 'owner_claim' ? (
          <OwnerClaimApplyForm id={item.id} clubId={item.club_id} message={item.message} status={item.status} current={current} submittedImages={item.submitted_images ?? []} />
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          <form action={updateSubmissionStatus} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={item.id} />
            <label htmlFor={`status-${item.id}`} className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
            <select id={`status-${item.id}`} name="status" defaultValue={item.status} className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900">
              <option value="pending">Gözləyir</option>
              <option value="reviewing">Yoxlanılır</option>
              <option value="resolved">Həll olunub</option>
              <option value="rejected">Rədd edilib</option>
            </select>
            <button type="submit" className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800">Yadda saxla</button>
          </form>

          {completed ? (
            <form action={deleteCompletedSubmission}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className="h-9 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100">Sil</button>
            </form>
          ) : null}
        </div>
      </article>
    </div>
  );
}
