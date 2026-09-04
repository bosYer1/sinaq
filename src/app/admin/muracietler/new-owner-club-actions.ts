'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INSTAGRAM_PATTERN = /^https:\/\/(?:www\.)?instagram\.com\/[a-z0-9._]{1,30}\/?(?:\?.*)?$/i;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function nullableText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function slugify(input: string) {
  return input
    .toLocaleLowerCase('az')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function requiredCoordinate(formData: FormData, key: 'latitude' | 'longitude', min: number, max: number) {
  const raw = text(formData, key);
  if (!raw) throw new Error('Yeni owner klubu üçün xəritə koordinatları təsdiqlənməlidir.');
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${key === 'latitude' ? 'Latitude' : 'Longitude'} düzgün deyil.`);
  }
  return parsed;
}

async function rollbackCreatedOwnerClub(
  supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'],
  clubId: string,
) {
  const { error } = await supabase.from('clubs').delete().eq('id', clubId);
  if (error) console.error('GAMEYER_OWNER_NEW_CLUB_ROLLBACK_ERROR', error.message);
}

export async function createClubForOwnerClaim(ownerClaimId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const submissionId = ownerClaimId.trim();
  if (!UUID_PATTERN.test(submissionId)) throw new Error('Owner müraciəti ID-si düzgün deyil.');

  const { data: submission, error: submissionError } = await supabase
    .from('club_submissions')
    .select('id,kind,club_id,status,club_name')
    .eq('id', submissionId)
    .eq('kind', 'owner_claim')
    .is('club_id', null)
    .in('status', ['pending', 'reviewing'])
    .maybeSingle();
  if (submissionError) throw new Error(submissionError.message);
  if (!submission) throw new Error('Owner müraciəti artıq tamamlanıb, kluba bağlanıb və ya etibarlı deyil.');

  const name = text(formData, 'name');
  if (!name) throw new Error('Klub adı boş ola bilməz.');
  const slug = text(formData, 'slug') || slugify(name);
  if (!SLUG_PATTERN.test(slug)) throw new Error('Slug yalnız kiçik latın hərfləri, rəqəmlər və tire qəbul edir.');

  const districtId = text(formData, 'district_id');
  if (!UUID_PATTERN.test(districtId)) throw new Error('Rayon seçilməlidir.');
  const address = text(formData, 'address');
  if (!address) throw new Error('Ünvan boş ola bilməz.');

  const latitude = requiredCoordinate(formData, 'latitude', -90, 90);
  const longitude = requiredCoordinate(formData, 'longitude', -180, 180);
  const instagramUrl = text(formData, 'instagram_url');
  if (!INSTAGRAM_PATTERN.test(instagramUrl)) {
    throw new Error('Yeni owner klubu üçün təsdiqlənmiş Instagram profil linki tələb olunur.');
  }

  const requestedTypeIds = Array.from(new Set(
    formData
      .getAll('club_type_id')
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean),
  ));
  if (requestedTypeIds.length === 0) throw new Error('Ən azı bir təsdiqlənmiş klub tipi seçilməlidir.');
  if (requestedTypeIds.some((id) => !UUID_PATTERN.test(id))) throw new Error('Klub tipi seçimi düzgün deyil.');

  const [{ data: existingSlug, error: slugError }, { data: district, error: districtError }, { data: clubTypes, error: typesError }] = await Promise.all([
    supabase.from('clubs').select('id').eq('slug', slug).limit(1),
    supabase.from('districts').select('id').eq('id', districtId).maybeSingle(),
    supabase.from('club_types').select('id,slug').in('id', requestedTypeIds),
  ]);
  if (slugError) throw new Error(slugError.message);
  if (districtError) throw new Error(districtError.message);
  if (typesError) throw new Error(typesError.message);
  if ((existingSlug ?? []).length > 0) throw new Error(`“${slug}” slug-u artıq istifadə olunur.`);
  if (!district) throw new Error('Seçilən rayon tapılmadı.');

  const validTypeIds = (clubTypes ?? [])
    .filter((type) => type.slug === 'pc' || type.slug === 'playstation')
    .map((type) => type.id);
  if (validTypeIds.length !== requestedTypeIds.length) throw new Error('Yalnız təsdiqlənmiş PC və PlayStation klub tipləri seçilə bilər.');

  const payload = {
    name,
    slug,
    description: nullableText(formData, 'description'),
    district_id: districtId,
    address,
    latitude,
    longitude,
    phone: nullableText(formData, 'phone'),
    instagram_url: instagramUrl,
    rating_avg: null,
    rating_count: 0,
    is_premium: false,
    premium_expires_at: null,
    is_active: false,
    is_verified: false,
    verified_at: null,
  };

  const { data: createdClub, error: createError } = await supabase
    .from('clubs')
    .insert(payload as never)
    .select('id')
    .single();
  if (createError) throw new Error(createError.message);
  if (!createdClub?.id) throw new Error('Yeni klub yaradılmadı.');

  const clubId = createdClub.id;
  const assignments = validTypeIds.map((clubTypeId) => ({ club_id: clubId, club_type_id: clubTypeId }));

  const { error: assignmentError } = await supabase.from('club_type_assignments').insert(assignments as never);
  if (assignmentError) {
    await rollbackCreatedOwnerClub(supabase, clubId);
    throw new Error(assignmentError.message);
  }

  const { data: linkedSubmission, error: linkError } = await supabase
    .from('club_submissions')
    .update({
      club_id: clubId,
      status: 'reviewing',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('kind', 'owner_claim')
    .is('club_id', null)
    .in('status', ['pending', 'reviewing'])
    .select('id,club_id')
    .maybeSingle();

  if (linkError || linkedSubmission?.club_id !== clubId) {
    await rollbackCreatedOwnerClub(supabase, clubId);
    throw new Error(linkError?.message ?? 'Owner müraciəti yeni kluba bağlanmadı; yaradılan klub geri qaytarıldı.');
  }

  revalidatePath('/admin');
  revalidatePath('/admin/klublar');
  revalidatePath('/admin/muracietler');
  revalidatePath(`/admin/klublar/${clubId}`);
  redirect(`/admin/muracietler?q=${encodeURIComponent(submission.club_name)}&kind=owner_claim`);
}
