import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ClubAdminForm } from '@/components/admin/ClubAdminForm';
import { createClub } from '../../actions';
import type { ClubType, District } from '@/types/database';

export const dynamic = 'force-dynamic';

interface AdminNewClubPageProps {
  searchParams: Promise<{ submission?: string }>;
}

export default async function AdminNewClubPage({ searchParams }: AdminNewClubPageProps) {
  const params = await searchParams;
  const submissionId = params.submission?.trim() || null;
  const supabase = await createClient();

  const [districtsResult, typesResult, submissionResult] = await Promise.all([
    supabase.from('districts').select('*').order('name'),
    supabase.from('club_types').select('*').order('name'),
    submissionId
      ? supabase
          .from('club_submissions')
          .select('id,kind,club_name,message,contact_type,contact_value,status,club_id')
          .eq('id', submissionId)
          .eq('kind', 'new_club')
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (districtsResult.error || typesResult.error || submissionResult.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Form məlumatları yüklənmədi. Səhifəni yeniləyib yenidən cəhd et.
      </div>
    );
  }

  const districts = (districtsResult.data ?? []) as District[];
  const types = (typesResult.data ?? []) as ClubType[];
  const submission = submissionResult.data;
  const validSubmission = Boolean(
    submission &&
    submission.kind === 'new_club' &&
    !submission.club_id &&
    (submission.status === 'pending' || submission.status === 'reviewing')
  );

  if (submissionId && !validSubmission) {
    return (
      <div>
        <Link href="/admin/muracietler" className="text-sm text-gray-500 hover:text-gray-900">← Müraciətlərə qayıt</Link>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Bu yeni-klub müraciəti artıq tamamlanıb, mövcud kluba bağlanıb və ya etibarlı deyil. Eyni müraciətdən ikinci klub yaratmaq bloklanıb.
        </div>
      </div>
    );
  }

  const sourceSubmissionId = validSubmission && submission ? submission.id : null;
  const createAction = createClub.bind(null, sourceSubmissionId);

  return (
    <div>
      <Link href={validSubmission ? '/admin/muracietler' : '/admin/klublar'} className="text-sm text-gray-500 hover:text-gray-900">
        ← {validSubmission ? 'Müraciətlərə qayıt' : 'Klublara qayıt'}
      </Link>

      <div className="mb-5 mt-2">
        <h1 className="text-2xl font-bold">Yeni klub</h1>
        <p className="mt-1 text-sm text-gray-500">Klubun bütün məlumatlarını bir formadan əlavə et.</p>
      </div>

      {validSubmission && submission ? (
        <div className="mb-5 rounded-xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#6A47F0]">Yeni klub müraciətindən açılıb</p>
            <Link href={`/admin/muracietler?q=${encodeURIComponent(submission.club_name)}`} className="text-xs font-semibold text-[#6A47F0] hover:underline">Müraciətə qayıt</Link>
          </div>
          <p className="mt-2 font-semibold text-gray-900">{submission.club_name}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{submission.message}</p>
          <p className="mt-3 text-xs text-gray-500">Əlaqə: {submission.contact_type} — {submission.contact_value}</p>
          <p className="mt-3 text-xs leading-5 text-amber-700">Müraciətdəki məlumat fakt kimi qəbul edilmir. Ünvan, koordinat, klub tipi, qiymət və iş saatlarını ayrıca yoxladıqdan sonra formaya yaz. Klub uğurla yaradıldıqda müraciət avtomatik həmin kluba bağlanıb “Həll olunub” statusuna keçiriləcək.</p>
        </div>
      ) : null}

      <ClubAdminForm
        club={validSubmission && submission ? { name: submission.club_name } : undefined}
        districts={districts}
        types={types}
        action={createAction}
        submitLabel="Klubu yarat"
      />
    </div>
  );
}
