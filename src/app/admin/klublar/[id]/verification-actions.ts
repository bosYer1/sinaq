'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function revokeClubVerification(formData: FormData) {
  const id = typeof formData.get('id') === 'string' ? String(formData.get('id')).trim() : '';
  if (!id) throw new Error('Klub ID tapılmadı.');

  const supabase = await createClient();
  const { data: club, error: readError } = await supabase
    .from('clubs')
    .select('slug')
    .eq('id', id)
    .single();

  if (readError || !club) throw new Error(readError?.message ?? 'Klub tapılmadı.');

  const { error } = await supabase
    .from('clubs')
    .update({
      is_verified: false,
      verified_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin');
  revalidatePath('/admin/klublar');
  revalidatePath(`/admin/klublar/${id}`);
  revalidatePath(`/klub/${club.slug}`);
}
