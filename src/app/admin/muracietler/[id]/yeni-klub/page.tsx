import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { OwnerClaimSummary } from '@/components/admin/OwnerClaimSummary';
import type { ClubType, District } from '@/types/database';
import { createClubForOwnerClaim } from '../../new-owner-club-actions';

export const dynamic = 'force-dynamic';

interface OwnerClaimNewClubPageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerClaimNewClubPage({ params }: OwnerClaimNewClubPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [submissionResult, districtsResult, typesResult] = await Promise.all([
    supabase
      .from('club_submissions')
      .select('id,kind,club_id,club_name,message,contact_type,contact_value,status')
      .eq('id', id)
      .eq('kind', 'owner_claim')
      .maybeSingle(),
    supabase.from('districts').select('*').order('name'),
    supabase.from('club_types').select('*').in('slug', ['pc', 'playstation']).order('name'),
  ]);

  if (submissionResult.error || districtsResult.error || typesResult.error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Məlumatlar yüklənmədi. Səhifəni yeniləyib yenidən cəhd et.</div>;
  }

  const submission = submissionResult.data;
  const validSubmission = Boolean(
    submission &&
      submission.kind === 'owner_claim' &&
      !submission.club_id &&
      (submission.status === 'pending' || submission.status === 'reviewing'),
  );

  if (!submission || !validSubmission) {
    return (
      <div>
        <Link href="/admin/muracietler?kind=owner_claim" className="text-sm text-gray-500 hover:text-gray-900">← Owner müraciətlərinə qayıt</Link>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Bu owner müraciəti artıq tamamlanıb, rədd edilib və ya başqa kluba bağlanıb. Eyni müraciətdən ikinci klub yaratmaq bloklanıb.
        </div>
      </div>
    );
  }

  const districts = (districtsResult.data ?? []) as District[];
  const types = (typesResult.data ?? []) as ClubType[];
  const action = createClubForOwnerClaim.bind(null, submission.id);
  const inputClass = 'mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10';
  const textareaClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10';

  return (
    <div className="max-w-4xl">
      <Link href={`/admin/muracietler?q=${encodeURIComponent(submission.club_name)}&kind=owner_claim`} className="text-sm text-gray-500 hover:text-gray-900">← Müraciətə qayıt</Link>

      <div className="mb-5 mt-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6A47F0]">Owner claim → yeni klub</p>
        <h1 className="mt-1 text-2xl font-bold">Bazadakı olmayan klubu təhlükəsiz yarat</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Bu mərhələ klubu yalnız <strong>deaktiv və verified olmayan</strong> vəziyyətdə yaradır və owner müraciətinə bağlayır. Son təsdiq ayrıca müraciət ekranında edilir; beləliklə natamam klub səhvən public olmur.
        </p>
      </div>

      <section className="mb-5 rounded-xl border border-violet-200 bg-violet-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#6A47F0]">Müraciətdəki klub</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{submission.club_name}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">{submission.status === 'pending' ? 'Gözləyir' : 'Yoxlanılır'}</span>
        </div>
        <OwnerClaimSummary message={submission.message} />
        <p className="mt-3 text-xs text-gray-600">Əlaqə: {submission.contact_type} — {submission.contact_value}</p>
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Müraciətdə yazılan məlumat avtomatik fakt sayılmır. Aşağıdakı ünvan, koordinat, Instagram və klub tipini rəsmi mənbədən ayrıca yoxladıqdan sonra daxil et.
        </p>
      </section>

      <form action={action} className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold">Təsdiqlənmiş əsas məlumatlar</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Klub adı<input required name="name" defaultValue={submission.club_name} className={inputClass} /></label>
            <label className="text-sm font-medium">Slug<input name="slug" placeholder="Boş saxlasan klub adından yaranacaq" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" autoCapitalize="none" spellCheck={false} className={inputClass} /></label>
            <label className="text-sm font-medium">Rayon<select required name="district_id" defaultValue="" className={inputClass}><option value="" disabled>Rayon seç</option>{districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}</select></label>
            <label className="text-sm font-medium">Ünvan<input required name="address" className={inputClass} /></label>
            <label className="text-sm font-medium md:col-span-2">Təsvir<textarea name="description" rows={4} className={textareaClass} /></label>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold">Public-ready yoxlaması</h2>
          <p className="mt-1 text-xs leading-5 text-gray-500">Yeni owner klubu müraciətə bağlanmazdan əvvəl xəritə koordinatı, rəsmi Instagram və ən azı bir klub tipi təsdiqlənməlidir.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Latitude<input required name="latitude" type="number" step="any" min="-90" max="90" className={inputClass} /></label>
            <label className="text-sm font-medium">Longitude<input required name="longitude" type="number" step="any" min="-180" max="180" className={inputClass} /></label>
            <label className="text-sm font-medium">Rəsmi Instagram<input required name="instagram_url" type="url" placeholder="https://instagram.com/username" pattern="https://(www\.)?instagram\.com/[A-Za-z0-9._]{1,30}/?(\?.*)?" autoCapitalize="none" spellCheck={false} className={inputClass} /></label>
            <label className="text-sm font-medium">Telefon <span className="font-normal text-gray-400">(opsional)</span><input name="phone" placeholder="+994..." className={inputClass} /></label>
          </div>
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">Təsdiqlənmiş klub tipi</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {types.map((type) => (
                <label key={type.id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium">
                  <input type="checkbox" name="club_type_id" value={type.id} />
                  {type.name}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Bu düymə owner-i hələ təsdiqləmir.</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800">Klub inactive + unverified yaradılacaq, claim həmin kluba bağlanacaq və status “Yoxlanılır” qalacaq. Sonra müraciət ekranında owner məlumatlarını tətbiq edib ayrıca “Təsdiq et və aktivləşdir” edəcəksən.</p>
          <button type="submit" className="mt-3 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">Yeni klubu yarat və müraciətə bağla</button>
        </section>
      </form>
    </div>
  );
}
