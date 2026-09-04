'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/requireAdmin';

function refreshNotifications() {
  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/bildirisler');
}

export async function markNotificationRead(formData: FormData) {
  const { supabase } = await requireAdmin();
  const rawId = formData.get('id');
  const id = typeof rawId === 'string' ? rawId.trim() : '';
  if (!id) throw new Error('Bildiriş ID tapılmadı.');

  const { data, error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    const { data: existing, error: existingError } = await supabase
      .from('admin_notifications')
      .select('id,read_at')
      .eq('id', id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (!existing) throw new Error('Bildiriş tapılmadı.');
  }

  refreshNotifications();
}

export async function markAllNotificationsRead() {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);

  if (error) throw new Error(error.message);
  refreshNotifications();
}
