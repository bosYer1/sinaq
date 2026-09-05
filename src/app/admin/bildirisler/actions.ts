'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';

function refreshNotifications() {
  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/bildirisler');
}

export async function openSubmissionNotification(formData: FormData) {
  const { supabase } = await requireAdmin();
  const rawId = formData.get('id');
  const id = typeof rawId === 'string' ? rawId.trim() : '';
  if (!id) throw new Error('Bildiriş ID tapılmadı.');

  const { data: notification, error: readError } = await supabase
    .from('admin_notifications')
    .select('id,submission_id,read_at')
    .eq('id', id)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!notification) throw new Error('Bildiriş tapılmadı.');
  if (!notification.submission_id) throw new Error('Bu bildiriş konkret müraciətə bağlı deyil.');

  if (!notification.read_at) {
    const { error: updateError } = await supabase
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notification.id)
      .is('read_at', null);
    if (updateError) throw new Error(updateError.message);
    refreshNotifications();
  }

  redirect(`/admin/muracietler/${encodeURIComponent(notification.submission_id)}`);
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
