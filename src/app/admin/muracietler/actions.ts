'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const STATUSES = new Set(['pending', 'reviewing', 'resolved', 'rejected']);

type SubmissionStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

export async function updateSubmissionStatus(formData: FormData) {
  const id = typeof formData.get('id') === 'string' ? String(formData.get('id')).trim() : '';
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

export async function verifyOwnerClaim(formData: FormData) {
  const id = typeof formData.get('id') === 'string' ? String(formData.get('id')).trim() : '';
  if (!id) throw new Error('Klub sahibi müraciəti tapılmadı.');

  const supabase = await createClient();
  const { data: clubId, error } = await supabase.rpc('verify_owner_claim_atomic', {
    p_submission_id: id,
  });

  if (error) throw new Error(error.message);
  if (!clubId) throw new Error('Təsdiqlənən klub tapılmadı.');

  revalidatePath('/admin');
  revalidatePath('/admin/muracietler');
  revalidatePath(`/admin/klublar/${clubId}`);
}
