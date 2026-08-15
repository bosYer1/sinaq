import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { ClubSubmission } from '@/types/database';
import { OwnerClaimSummary } from '@/components/admin/OwnerClaimSummary';
import { deleteCompletedSubmission, updateSubmissionStatus, verifyOwnerClaim } from './actions';

export const dynamic = 'force-dynamic';

type SubmissionRow = ClubSubmission;
type SubmissionStatus = SubmissionRow['status'];
type SubmissionKind = SubmissionRow['kind'];

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
  searchParams: Promise<{
    status?: string;
    kind?: string;
    q?: string;
  }>;
}

function contactHref(row: SubmissionRow) {
  if (row.contact_type === 'email') return `mailto:${row.contact_value}`;
  if (row.contact_type === 'phone') return `tel:${row.contact_value.replace(/[^+\d]/g, '')}`;
  if (row.contact_value.startsWith('http')) return row.contact_value;
  return `https://www.instagram.com/${row.contact_value.replace(/^@/, '')}/`;
}

export default async function AdminSubmissionsPage({ searchParams }: AdminSubmissionsPageProps) {
  const params = await searchParams;
  const status = VALID_STATUSES.has(params.status as SubmissionStatus)
    ? (params.status as SubmissionStatus)
    : null;
  const kind = VALID_KINDS.has(params.kind as SubmissionKind)
    ? (params.kind as SubmissionKind)
    : null;
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

  const [submissionsResult, pendingResult] = await Promise.all([
    query,
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  if (submissionsResult.error) throw new Error(submissionsResult.error.message);
  const submissions = (submissionsResult.data ?? []) as SubmissionRow[];
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
          {submissions.map((item) => (
            <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#7C5CFC]/10 px-2.5 py-1 text-xs font-semibold text-[#6A47F0]">{KIND_LABELS[item.kind]}</span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{STATUS_LABELS[item.status]}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-gray-900">{item.club_name}</h2>
                  <p className="mt-1 text-xs text-gray-400">{new Date(item.created_at).toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}</p>
                </div>
                {item.club_id ? <Link href={`/admin/klublar/${item.club_id}`} className="text-sm font-semibold text-[#6A47F0] hover:underline">Klub admininə bax</Link> : null}
              </div>

              {item.kind === 'owner_claim' ? <OwnerClaimSummary message={item.message} /> : <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">{item.message}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                <a href={contactHref(item)} target={item.contact_type === 'instagram' ? '_blank' : undefined} rel={item.contact_type === 'instagram' ? 'noopener noreferrer' : undefined} className="text-sm font-semibold text-[#6A47F0] hover:underline">
                  {item.contact_type}: {item.contact_value}
                </a>
              </div>

              {item.kind === 'owner_claim' && item.club_id && item.status !== 'resolved' ? (
                <form action={verifyOwnerClaim} className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <input type="hidden" name="id" value={item.id} />
                  <p className="text-xs leading-5 text-emerald-800">Rəsmi kanal yoxlamasını tamamladıqdan sonra bu düymə klubu təsdiqlənmiş kimi işarələyəcək və müraciəti həll olunmuş statusuna keçirəcək.</p>
                  <button type="submit" className="mt-2 h-9 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700">Klub sahibini təsdiqlə</button>
                </form>
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
                {item.status === 'resolved' || item.status === 'rejected' ? (
                  <form action={deleteCompletedSubmission}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="h-9 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50">Müraciəti sil</button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
