'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  normalizeOwnerInstagram,
  parseOwnerClaimMessage,
  parseOwnerDailyHours,
  parseOwnerPrice,
} from '@/lib/ownerClaim';

const STATUSES = new Set(['pending', 'reviewing', 'resolved', 'rejected']);

type SubmissionStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

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

function revalidateOwnerClaim(clubId: string) {
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/muracietler');
  revalidatePath(`/admin/klublar/${clubId}`);
}

export async function updateSubmissionStatus(formData: FormData) {
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
  revalidatePath('/admin');
  revalidatePath('/admin/muracietler');
}

export async function applyOwnerClaimFields(formData: FormData) {
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
  const clubId = submission.club_id!;

  if (applyInstagram) {
    const instagramUrl = normalizeOwnerInstagram(claim.officialInstagram);
    if (!instagramUrl) throw new Error('Instagram məlumatı təhlükəsiz formatda deyil.');
    const { error } = await supabase
      .from('clubs')
      .update({ instagram_url: instagramUrl, updated_at: new Date().toISOString() })
      .eq('id', clubId);
    if (error) throw new Error(error.message);
  }

  const pricingRequests = [
    { enabled: applyPcPrice, slug: 'pc', value: parseOwnerPrice(claim.pcPrice) },
    { enabled: applyPsPrice, slug: 'playstation', value: parseOwnerPrice(claim.psPrice) },
  ].filter((item) => item.enabled);

  if (pricingRequests.length > 0) {
    const slugs = pricingRequests.map((item) => item.slug);
    const { data: clubTypes, error: typesError } = await supabase
      .from('club_types')
      .select('id,slug')
      .in('slug', slugs);
    if (typesError) throw new Error(typesError.message);

    for (const request of pricingRequests) {
      if (request.value == null) throw new Error(`${request.slug} qiyməti təhlükəsiz formatda deyil.`);
      const type = clubTypes?.find((item) => item.slug === request.slug);
      if (!type) throw new Error(`${request.slug} klub tipi tapılmadı.`);

      const { data: assignment, error: assignmentError } = await supabase
        .from('club_type_assignments')
        .select('club_id')
        .eq('club_id', clubId)
        .eq('club_type_id', type.id)
        .maybeSingle();
      if (assignmentError) throw new Error(assignmentError.message);
      if (!assignment) {
        throw new Error(`${request.slug} qiyməti tətbiq edilmədi: klubda bu tip aktiv deyil.`);
      }

      const { data: existing, error: pricingReadError } = await supabase
        .from('club_pricing')
        .select('id')
        .eq('club_id', clubId)
        .eq('club_type_id', type.id)
        .limit(1)
        .maybeSingle();
      if (pricingReadError) throw new Error(pricingReadError.message);

      if (existing) {
        const { error } = await supabase
          .from('club_pricing')
          .update({ price_from: request.value, price_to: null, unit: 'saat' })
          .eq('id', existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('club_pricing').insert({
          club_id: clubId,
          club_type_id: type.id,
          price_from: request.value,
          price_to: null,
          unit: 'saat',
        });
        if (error) throw new Error(error.message);
      }
    }
  }

  if (applyHours) {
    const hours = parseOwnerDailyHours(claim.hours);
    if (!hours) {
      throw new Error('İş saatları avtomatik tətbiq üçün tanınan formatda deyil. Manual yoxlama tələb olunur.');
    }

    const rows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      club_id: clubId,
      day_of_week: dayOfWeek,
      open_time: hours === '24/7' ? '00:00:00' : hours.openTime,
      close_time: hours === '24/7' ? '23:59:59' : hours.closeTime,
      is_closed: false,
    }));

    const { error: deleteError } = await supabase.from('club_opening_hours').delete().eq('club_id', clubId);
    if (deleteError) throw new Error(deleteError.message);
    const { error: insertError } = await supabase.from('club_opening_hours').insert(rows);
    if (insertError) throw new Error(insertError.message);
  }

  const { error: reviewError } = await supabase
    .from('club_submissions')
    .update({ status: 'reviewing', reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .neq('status', 'resolved');
  if (reviewError) throw new Error(reviewError.message);

  revalidateOwnerClaim(clubId);
}

export async function verifyOwnerClaim(formData: FormData) {
  const id = submissionId(formData);
  if (!id) throw new Error('Klub sahibi müraciəti tapılmadı.');

  const supabase = await createClient();
  const { data: clubId, error } = await supabase.rpc('verify_owner_claim_atomic', {
    p_submission_id: id,
  });

  if (error) throw new Error(error.message);
  if (!clubId) throw new Error('Təsdiqlənən klub tapılmadı.');

  revalidateOwnerClaim(clubId);
}

export async function deleteCompletedSubmission(formData: FormData) {
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

  revalidatePath('/admin');
  revalidatePath('/admin/muracietler');
}
