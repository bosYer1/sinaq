import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { ClubSubmission } from '@/types/database';
import { OwnerClaimSummary } from '@/components/admin/OwnerClaimSummary';
import { OwnerClaimApplyForm, type OwnerClaimCurrentValues } from '@/components/admin/OwnerClaimApplyForm';
import { deleteCompletedSubmission, linkCorrectionToClub, linkOwnerClaimToClub, updateSubmissionStatus } from './actions';

export const dynamic = 'force-dynamic';

type SubmissionRow = ClubSubmission;
type SubmissionStatus = SubmissionRow['status'];
type SubmissionKind = SubmissionRow['kind'];
type ClubOption = { id: string; name: string; slug: string; is_active: boolean };
type ClubSnapshotRow = ClubOption & {
  instagram_url: string | null;
  pricing: Array<{ price_from: number; club_type: { slug: string } | null }>;
  opening_hours: Array<{ day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }>;
};

const KIND_LABELS: Record<SubmissionKind, string> = {
  correction: 'Düzəliş',
  new_club: 'Yeni klub',
  owner_claim: 'Klub sahibi',
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: 'Gözləyir',
  reviewing: 'Yoxlanılır',
  resolved: 'Həll olunub',
  rejected: 'Rədd edilib',
};

const VALID_STATUSES = new Set<SubmissionStatus>(['pending', 'reviewing', 'resolved', 'rejected']);
const VALID_KINDS = new Set<SubmissionKind>(['correction', 'new_club', 'owner_claim']);

interface AdminSubmissionsPageProps {
  searchParams: Promise<{ status?: string; kind?: string; q?: string }>;
}

function contactHref(row: SubmissionRow) {
  if (row.contact_type === 'email') return `mailto:${row.contact_value}`;
  if (row.contact_type === 'phone') return `tel:${row.contact_value.replace(/[^+\d]/g, '')}`;
  if (row.contact_value.startsWith('http')) return row.contact_value;
  return `https://www.instagram.com/${row.contact_value.replace(/^@/, '')}/`;
}

function currentHoursLabel(hours: ClubSnapshotRow['opening_hours']) {
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

function currentValues(club: ClubSnapshotRow): OwnerClaimCurrentValues {
  const pcPricing = club.pricing.find((row) => row.club_type?.slug === 'pc');
  const psPricing = club.pricing.find((row) => row.club_type?.slug === 'playstation');
  return {
    instagram: club.instagram_url,
    pcPrice: pcPricing?.price_from ?? null,
    psPrice: psPricing?.price_from ?? null,
    hours: currentHoursLabel(club.opening_hours),
  };
}

function ClubLinkForm({ item, clubs }: { item: SubmissionRow; clubs: ClubOption[] }) {
  const action = item.kind === 'owner_claim' ? linkOwnerClaimToClub : linkCorrectionToClub;
  const selectableClubs = item.kind === 'owner_claim' ? clubs : clubs.filter((club) => club.is_active);
  const placeholder = item.kind === 'owner_claim' ? 'Klub seç' : 'Aktiv klub seç';

  return (
    <form action={action} className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <input type="hidden" name="id" value={item.id} />
      <p className="text-xs font-semibold text-amber-900">Əvvəl müraciəti real klub profilinə bağla.</p>
      <p className="mt-1 text-xs leading-5 text-amber-800">
        {item.kind === 'owner_claim'
          ? 'Klub aktiv deyilsə də onu seçə bilərsən. Təsdiqdən sonra klub avtomatik aktivləşəcək.'
          : 'Klub adı sərbəst yazıldığı üçün avtomatik uyğunlaşdırmırıq. Səhv klubun məlumatının dəyişməməsi üçün seçimi admin edir.'}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select name="club_id" required defaultValue="" className="h-10 min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 text-sm text-gray-900">
          <option value="" disabled>{placeholder}</option>
          {selectableClubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}{club.is_active ? '' : ' — deaktiv'}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700">Kluba bağla</button>
      </div>
    </form>
  );
}

export default async function AdminSubmissionsPage({ searchParams }: AdminSubmissionsPageProps) {
  const params = await searchParams;
  const status = VALID_STATUSES.has(params.status as SubmissionStatus) ? (params.status as SubmissionStatus) : null;
  const kind = VALID_KINDS.has(params.kind as SubmissionKind) ? (params.kind as SubmissionKind) : null;
  const q = params.q?.trim().slice(0, 120) ?? '';

  const supabase = await createClient();
  let query = supabase
    .from('club_submissions')
    .select('id,kind,club_id,club_name,message,contact_type,contact_value,status,created_at,reviewed_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) query = query.eq('status', status);
  if (kind) query = query.eq('kind', kind);
  if (q) query = query.ilike('club_name', `%${q.replace(/[%_]/g, '')}%`);

  const [submissionsResult, pendingResult, clubsResult] = await Promise.all([
    query,
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('clubs')
      .select('id,name,slug,is_active,instagram_url,pricing:club_pricing(price_from,club_type:club_types(slug)),opening_hours:club_opening_hours(day_of_week,open_time,close_time,is_closed)')
      .order('name', { ascending: true }),
  ]);

  if (submissionsResult.error) throw new Error(submissionsResult.error.message);
  if (clubsResult.error) throw new Error(clubsResult.error.message);

  const submissions = (submissionsResult.data ?? []) as SubmissionRow[];
  const clubSnapshots = (clubsResult.data ?? []) as unknown as ClubSnapshotRow[];
  const clubs = clubSnapshots.map(({ id, name, slug, is_active }) => ({ id, name, slug, is_active }));
  const clubById = new Map(clubs.map((club) => [club.id, club]));
  const currentValuesByClubId = new Map(clubSnapshots.map((club) => [club.id, currentValues(club)]));
  const pendingCount = pendingResult.count ?? 0;
  const hasFilters = Boolean(status || kind || q);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Müraciətlər</h1>
          <p className="mt-1 text-sm text-gray-500">Düzəliş, yeni klub və klub sahibi təsdiq müraciətləri.</p>
        </div>
        <Link href="/admin/muracietler?status=pending" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:border-[#7C5CFC]/40">
          Gözləyən: <span className="font-bold text-gray-900">{pendingCount}</span>
        </Link>
      </div>

      <form method="get" className="mt-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[1fr_180px_180px_auto]">
        <div>
          <label htmlFor="submission-q" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Klub adı</label>
          <input id="submission-q" name="q" defaultValue={q} maxLength={120} placeholder="Klub adına görə axtar" className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[#7C5CFC]" />
        </div>
        <div>
          <label htmlFor="submission-status" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
          <select id="submission-status" name="status" defaultValue={status ?? ''} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm">
            <option value="">Hamısı</option><option value="pending">Gözləyir</option><option value="reviewing">Yoxlanılır</option><option value="resolved">Həll olunub</option><option value="rejected">Rədd edilib</option>
          </select>
        </div>
        <div>
          <label htmlFor="submission-kind" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Növ</label>
          <select id="submission-kind" name="kind" defaultValue={kind ?? ''} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm">
            <option value="">Hamısı</option><option value="correction">Düzəliş</option><option value="new_club">Yeni klub</option><option value="owner_claim">Klub sahibi</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="h-10 rounded-lg bg-[#7C5CFC] px-4 text-sm font-semibold text-white hover:bg-[#6A47F0]">Filtrlə</button>
          {hasFilters ? <Link href="/admin/muracietler" className="flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Təmizlə</Link> : null}
        </div>
      </form>

      <div className="mt-3 text-xs text-gray-500">Nəticə: {submissions.length}</div>

      {submissions.length === 0 ? (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">{hasFilters ? 'Bu filtrlərə uyğun müraciət tapılmadı.' : 'Hələ müraciət yoxdur.'}</div>
      ) : (
        <div className="mt-5 space-y-4">
          {submissions.map((item) => {
            const linkedClub = item.club_id ? clubById.get(item.club_id) : null;
            const completed = item.status === 'resolved' || item.status === 'rejected';
            const canLinkExisting = (item.kind === 'owner_claim' || item.kind === 'correction') && !item.club_id && !completed;

            return (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#7C5CFC]/10 px-2.5 py-1 text-xs font-semibold text-[#6A47F0]">{KIND_LABELS[item.kind]}</span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{STATUS_LABELS[item.status]}</span>
                      {(item.kind === 'owner_claim' || item.kind === 'correction') && !item.club_id ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Kluba bağlı deyil</span> : null}
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-gray-900">{item.club_name}</h2>
                    <p className="mt-1 text-xs text-gray-400">{new Date(item.created_at).toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}</p>
                    {linkedClub ? <p className="mt-1 text-xs font-medium text-emerald-700">Bağlı klub: {linkedClub.name}{linkedClub.is_active ? '' : ' (deaktiv)'}</p> : null}
                  </div>
                  {item.club_id ? <Link href={`/admin/klublar/${item.club_id}`} className="text-sm font-semibold text-[#6A47F0] hover:underline">Klub admininə bax</Link> : null}
                </div>

                {item.kind === 'owner_claim' ? <OwnerClaimSummary message={item.message} /> : <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">{item.message}</p>}

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                  <a href={contactHref(item)} target={item.contact_type === 'instagram' ? '_blank' : undefined} rel={item.contact_type === 'instagram' ? 'noopener noreferrer' : undefined} className="text-sm font-semibold text-[#6A47F0] hover:underline">
                    {item.contact_type}: {item.contact_value}
                  </a>
                </div>

                {canLinkExisting ? <ClubLinkForm item={item} clubs={clubs} /> : null}

                {item.kind === 'correction' && item.club_id && !completed ? (
                  <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
                    <p className="text-xs leading-5 text-sky-800">Düzəliş mətnini yoxla, sonra real klub admin səhifəsində yalnız təsdiqlədiyin sahələri dəyiş.</p>
                    <Link href={`/admin/klublar/${item.club_id}`} className="mt-2 inline-flex h-9 items-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700">Klub məlumatını düzəlt</Link>
                  </div>
                ) : null}

                {item.kind === 'new_club' && !completed ? (
                  <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3">
                    <p className="text-xs leading-5 text-violet-800">Klubun real olduğunu və xəritə koordinatını ayrıca yoxla. Sonra yeni klub formasını bu müraciətlə aç.</p>
                    <Link href={`/admin/klublar/yeni?submission=${encodeURIComponent(item.id)}`} className="mt-2 inline-flex h-9 items-center rounded-lg bg-[#7C5CFC] px-4 text-sm font-semibold text-white hover:bg-[#6A47F0]">Yeni klub formasında aç</Link>
                  </div>
                ) : null}

                {item.kind === 'owner_claim' ? (
                  <OwnerClaimApplyForm
                    id={item.id}
                    clubId={item.club_id}
                    message={item.message}
                    status={item.status}
                    current={item.club_id ? currentValuesByClubId.get(item.club_id) : null}
                  />
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <form action={updateSubmissionStatus} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <label htmlFor={`status-${item.id}`} className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
                    <select id={`status-${item.id}`} name="status" defaultValue={item.status} className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900">
                      <option value="pending">Gözləyir</option><option value="reviewing">Yoxlanılır</option><option value="resolved">Həll olunub</option><option value="rejected">Rədd edilib</option>
                    </select>
                    <button type="submit" className="h-9 rounded-lg bg-[#7C5CFC] px-4 text-sm font-semibold text-white hover:bg-[#6A47F0]">Yadda saxla</button>
                  </form>
                  {completed ? (
                    <form action={deleteCompletedSubmission}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="h-9 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50">Müraciəti sil</button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
