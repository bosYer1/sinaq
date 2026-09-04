'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import {
  normalizeOwnerInstagram,
  parseOwnerClaimMessage,
  parseOwnerDailyHours,
  parseOwnerPrice,
} from '@/lib/ownerClaim';
import type { Json } from '@/types/database';

const STATUSES = new Set(['pending', 'reviewing', 'resolved', 'rejected']);

type SubmissionStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';
type LinkableSubmissionKind = 'owner_claim' | 'correction';

function submissionId(formData: FormData) {
  const value = formData.get('id');
  return typeof value === 'string' ? value.trim() : '';
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === 'on';
}

async function linkedOwnerClaim(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('club_submissions')
    .select('id,kind,club_id,message,status')
    .eq('id', id)
    .eq('kind', 'owner_claim')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || !data.club_id) throw new Error('Müraciət real klub profilinə bağlı deyil.');

  const claim = parseOwnerClaimMessage(data.message);
  if (!claim) throw new Error('Klub sahibi məlumatı strukturlaşdırılmış formatda deyil.');
  return { supabase, submission: data, claim };
}

function revalidateSubmission(clubId?: string | null, publicClubChanged = false) {
  if (publicClubChanged) updateTag('public-clubs');
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/muracietler');
  if (clubId) revalidatePath(`/admin/klublar/${clubId}`);
}

async function linkSubmissionToClub(formData: FormData, kind: LinkableSubmissionKind) {
  const id = submissionId(formData);
  const clubIdValue = formData.get('club_id');
  const clubId = typeof clubIdValue === 'string' ? clubIdValue.trim() : '';
  if (!id || !clubId) throw new Error('Müraciət və klub seçimi tələb olunur.');

  const supabase = await createClient();
  const [{ data: submission, error: submissionError }, { data: club, error: clubError }] = await Promise.all([
    supabase
      .from('club_submissions')
      .select('id,kind,club_id,status')
      .eq('id', id)
      .eq('kind', kind)
      .maybeSingle(),
    supabase
      .from('clubs')
      .select('id,is_active')
      .eq('id', clubId)
      .maybeSingle(),
  ]);

  if (submissionError) throw new Error(submissionError.message);
  if (clubError) throw new Error(clubError.message);
  if (!submission) throw new Error('Müraciət tapılmadı.');
  if (!club) throw new Error('Seçilən klub tapılmadı.');
  if (kind === 'correction' && !club.is_active) {
    throw new Error('Düzəliş müraciəti yalnız aktiv kluba bağlana bilər.');
  }
  if (submission.status === 'resolved' || submission.status === 'rejected') {
    throw new Error('Tamamlanmış müraciəti kluba bağlamaq olmaz.');
  }
  if (submission.club_id) throw new Error('Bu müraciət artıq real kluba bağlıdır.');

  const { data: linked, error } = await supabase
    .from('club_submissions')
    .update({ club_id: club.id, status: 'reviewing', reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('kind', kind)
    .is('club_id', null)
    .in('status', ['pending', 'reviewing'])
    .select('club_id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!linked?.club_id) throw new Error('Müraciət kluba bağlanmadı. Səhifəni yeniləyib yenidən yoxlayın.');

  revalidateSubmission(linked.club_id);
}

export async function updateSubmissionStatus(formData: FormData) {
  await requireAdmin();
  const id = submissionId(formData);
  const status = typeof formData.get('status') === 'string' ? String(formData.get('status')).trim() : '';
  if (!id || !STATUSES.has(status)) throw new Error('Müraciət statusu düzgün deyil.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('club_submissions')
    .update({
      status: status as SubmissionStatus,
      reviewed_at: status === 'pending' ? null : new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateSubmission();
}

export async function linkOwnerClaimToClub(formData: FormData) {
  await requireAdmin();
  await linkSubmissionToClub(formData, 'owner_claim');
}

export async function linkCorrectionToClub(formData: FormData) {
  await requireAdmin();
  await linkSubmissionToClub(formData, 'correction');
}

export async function applyOwnerClaimFields(formData: FormData) {
  await requireAdmin();
  const id = submissionId(formData);
  if (!id) throw new Error('Klub sahibi müraciəti tapılmadı.');

  const applyInstagram = checked(formData, 'apply_instagram');
  const applyPcPrice = checked(formData, 'apply_pc_price');
  const applyPsPrice = checked(formData, 'apply_ps_price');
  const applyHours = checked(formData, 'apply_hours');
  if (!applyInstagram && !applyPcPrice && !applyPsPrice && !applyHours) {
    throw new Error('Tətbiq etmək üçün ən azı bir sahə seçilməlidir.');
  }

  const { supabase, submission, claim } = await linkedOwnerClaim(id);

  const instagramUrl = applyInstagram ? normalizeOwnerInstagram(claim.officialInstagram) : null;
  const pcPrice = applyPcPrice ? parseOwnerPrice(claim.pcPrice) : null;
  const psPrice = applyPsPrice ? parseOwnerPrice(claim.psPrice) : null;
  const parsedHours = applyHours ? parseOwnerDailyHours(claim.hours) : null;

  if (applyInstagram && !instagramUrl) throw new Error('Instagram məlumatı təhlükəsiz formatda deyil.');
  if (applyPcPrice && pcPrice == null) throw new Error('PC qiyməti təhlükəsiz formatda deyil.');
  if (applyPsPrice && psPrice == null) throw new Error('PlayStation qiyməti təhlükəsiz formatda deyil.');
  if (applyHours && !parsedHours) {
    throw new Error('İş saatları avtomatik tətbiq üçün tanınan formatda deyil. Manual yoxlama tələb olunur.');
  }

  let hoursPayload: Json | null = null;
  if (parsedHours === '24/7') {
    hoursPayload = { mode: '24/7' };
  } else if (parsedHours) {
    hoursPayload = {
      mode: 'daily',
      open_time: parsedHours.openTime,
      close_time: parsedHours.closeTime,
    };
  }

  const { data: clubId, error } = await supabase.rpc('apply_owner_claim_fields_atomic', {
    p_submission_id: id,
    p_instagram_url: instagramUrl,
    p_pc_price: pcPrice,
    p_ps_price: psPrice,
    p_hours: hoursPayload,
  });

  if (error) throw new Error(error.message);
  if (!clubId || clubId !== submission.club_id) throw new Error('Məlumatların tətbiq olunduğu klub təsdiqlənmədi.');

  revalidateSubmission(clubId, true);
}

export async function verifyOwnerClaim(formData: FormData) {
  await requireAdmin();
  const id = submissionId(formData);
  if (!id) throw new Error('Klub sahibi müraciəti tapılmadı.');

  const supabase = await createClient();
  const { data: clubId, error } = await supabase.rpc('verify_owner_claim_atomic', {
    p_submission_id: id,
  });

  if (error) throw new Error(error.message);
  if (!clubId) throw new Error('Təsdiqlənən klub tapılmadı.');

  revalidateSubmission(clubId, true);
}

export async function deleteCompletedSubmission(formData: FormData) {
  await requireAdmin();
  const id = submissionId(formData);
  if (!id) throw new Error('Müraciət ID tapılmadı.');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('club_submissions')
    .delete()
    .eq('id', id)
    .in('status', ['resolved', 'rejected'])
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Yalnız həll olunmuş və ya rədd edilmiş müraciət silinə bilər.');

  revalidateSubmission();
}
