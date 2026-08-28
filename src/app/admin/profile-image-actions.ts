'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin/requireAdmin';

const IMAGE_BUCKET = 'club-images';

function validClubId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validateProfileImageUrl(clubId: string, value: string) {
  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/${clubId}/profile/`;
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co') && url.pathname.includes(marker);
  } catch {
    return false;
  }
}

async function persistProfileImage(clubId: string, profileImageUrl: string | null) {
  if (!validClubId(clubId)) throw new Error('Klub ID düzgün deyil.');
  if (profileImageUrl && !validateProfileImageUrl(clubId, profileImageUrl)) {
    throw new Error('Profil şəkli GameYer Storage-dan və həmin klubun profil qovluğundan olmalıdır.');
  }

  const { supabase } = await requireAdmin();
  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id,slug')
    .eq('id', clubId)
    .maybeSingle();
  if (clubError) throw new Error(clubError.message);
  if (!club) throw new Error('Klub tapılmadı.');

  const { error } = await supabase
    .from('clubs')
    .update({ profile_image_url: profileImageUrl, updated_at: new Date().toISOString() } as never)
    .eq('id', clubId);
  if (error) throw new Error(error.message);

  updateTag('public-clubs');
  revalidatePath('/');
  revalidatePath('/admin/klublar');
  revalidatePath(`/admin/klublar/${clubId}`);
  revalidatePath(`/klub/${club.slug}`);
}

export async function setClubProfileImage(clubId: string, profileImageUrl: string) {
  await persistProfileImage(clubId, profileImageUrl);
}

export async function clearClubProfileImage(clubId: string) {
  await persistProfileImage(clubId, null);
}
