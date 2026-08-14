'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const IMAGE_BUCKET = 'club-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES_PER_CLUB = 8;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}
function nullableText(formData: FormData, key: string) { return text(formData, key) || null; }
function nullableNumber(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function booleanValue(formData: FormData, key: string) { return formData.get(key) === 'on'; }
function slugify(input: string) {
  return input.toLocaleLowerCase('az').replace(/ə/g,'e').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function validateCoordinates(formData: FormData) {
  const latitude = nullableNumber(formData, 'latitude');
  const longitude = nullableNumber(formData, 'longitude');
  if (latitude == null || longitude == null) throw new Error('Xəritə üçün latitude və longitude mütləq yazılmalıdır.');
  if (latitude < -90 || latitude > 90) throw new Error('Latitude -90 ilə 90 arasında olmalıdır.');
  if (longitude < -180 || longitude > 180) throw new Error('Longitude -180 ilə 180 arasında olmalıdır.');
  return { latitude, longitude };
}
function imageFiles(formData: FormData) {
  return formData.getAll('image_files').filter((entry): entry is File => entry instanceof File && entry.size > 0);
}
function validateImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co') && parsed.pathname.includes(`/storage/v1/object/public/${IMAGE_BUCKET}/`);
  } catch { return false; }
}
function validateRelationFormInput(formData: FormData) {
  const enabledTypeIds = Array.from(formData.keys()).filter((key) => key.startsWith('type_enabled_') && booleanValue(formData, key)).map((key) => key.replace('type_enabled_', ''));
  if (enabledTypeIds.length === 0) throw new Error('Ən azı bir klub tipi (PC və ya PlayStation) seçilməlidir.');
  for (const typeId of enabledTypeIds) {
    const priceFrom = nullableNumber(formData, `price_from_${typeId}`);
    const priceTo = nullableNumber(formData, `price_to_${typeId}`);
    if (priceFrom != null && priceFrom < 0) throw new Error('Qiymət mənfi ola bilməz.');
    if (priceFrom != null && priceFrom > 0 && priceTo != null && priceTo < priceFrom) throw new Error('Son qiymət başlanğıc qiymətdən aşağı ola bilməz.');
  }
  if (booleanValue(formData, 'hours_enabled')) {
    for (let day = 0; day < 7; day += 1) {
      if (booleanValue(formData, `day_closed_${day}`)) continue;
      if (!nullableText(formData, `open_time_${day}`) || !nullableText(formData, `close_time_${day}`)) throw new Error(`${day + 1}-ci gün üçün açılış və bağlanış saatı yazılmalıdır.`);
    }
  }
  const existingUrls = Array.from(new Set(text(formData, 'image_urls').split('\n').map((value) => value.trim()).filter(Boolean)));
  if (existingUrls.some((url) => !validateImageUrl(url))) throw new Error('Şəkil URL-i GameYer-in Supabase club-images yaddaşından olmalıdır.');
  const files = imageFiles(formData);
  if (existingUrls.length + files.length > MAX_IMAGES_PER_CLUB) throw new Error(`Bir klubda maksimum ${MAX_IMAGES_PER_CLUB} şəkil saxlamaq olar.`);
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('Şəkil formatı yalnız JPG, PNG və ya WEBP ola bilər.');
    if (file.size > MAX_IMAGE_SIZE) throw new Error('Hər şəkil maksimum 5 MB ola bilər.');
  }
}
async function ensureSlugAvailable(slug: string, excludeId?: string) {
  if (!slug) throw new Error('Düzgün slug yaratmaq mümkün olmadı.');
  const supabase = await createClient();
  let query = supabase.from('clubs').select('id').eq('slug', slug).limit(1);
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if ((data ?? []).length > 0) throw new Error(`“${slug}” slug-u artıq başqa klubda istifadə olunur.`);
}
function safeFileName(name: string) {
  const extension = name.split('.').pop()?.toLowerCase() || 'jpg';
  const base = name.replace(/\.[^.]+$/, '').toLocaleLowerCase('az').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'image';
  return `${base}.${extension}`;
}
function storagePathFromPublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch { return null; }
}
async function uploadImages(clubId: string, files: File[]) {
  const supabase = await createClient();
  const uploadedUrls: string[] = [];
  for (const file of files) {
    const path = `${clubId}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });
    if (error) throw new Error(`Şəkil yüklənmədi: ${error.message}`);
    uploadedUrls.push(supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return uploadedUrls;
}
async function replaceRelations(clubId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: typesData, error: typesError } = await supabase.from('club_types').select('id,name,slug').order('name');
  if (typesError) throw new Error(typesError.message);
  const types = (typesData ?? []) as Array<{ id: string; name: string; slug: string }>;
  const enabledTypes = types.filter((type) => booleanValue(formData, `type_enabled_${type.id}`));
  if (enabledTypes.length === 0) throw new Error('Ən azı bir klub tipi (PC və ya PlayStation) seçilməlidir.');

  const assignments = enabledTypes.map((type) => ({ club_id: clubId, club_type_id: type.id }));
  const { error: assignmentDeleteError } = await (supabase as any).from('club_type_assignments').delete().eq('club_id', clubId);
  if (assignmentDeleteError) throw new Error(assignmentDeleteError.message);
  const { error: assignmentInsertError } = await (supabase as any).from('club_type_assignments').insert(assignments);
  if (assignmentInsertError) throw new Error(assignmentInsertError.message);

  const pricingRows = enabledTypes.map((type) => {
    const priceFrom = nullableNumber(formData, `price_from_${type.id}`);
    if (priceFrom == null || priceFrom <= 0) return null;
    return { club_id: clubId, club_type_id: type.id, price_from: priceFrom, price_to: nullableNumber(formData, `price_to_${type.id}`), unit: text(formData, `unit_${type.id}`) || 'saat' };
  }).filter(Boolean);
  const { error: pricingDeleteError } = await supabase.from('club_pricing').delete().eq('club_id', clubId);
  if (pricingDeleteError) throw new Error(pricingDeleteError.message);
  if (pricingRows.length) {
    const { error } = await supabase.from('club_pricing').insert(pricingRows as never[]);
    if (error) throw new Error(error.message);
  }

  const { error: hoursDeleteError } = await supabase.from('club_opening_hours').delete().eq('club_id', clubId);
  if (hoursDeleteError) throw new Error(hoursDeleteError.message);
  if (booleanValue(formData, 'hours_enabled')) {
    const rows = Array.from({ length: 7 }, (_, day) => {
      const closed = booleanValue(formData, `day_closed_${day}`);
      return { club_id: clubId, day_of_week: day, open_time: closed ? null : nullableText(formData, `open_time_${day}`), close_time: closed ? null : nullableText(formData, `close_time_${day}`), is_closed: closed };
    });
    const { error } = await supabase.from('club_opening_hours').insert(rows as never[]);
    if (error) throw new Error(error.message);
  }

  const existingUrls = Array.from(new Set(text(formData, 'image_urls').split('\n').map((v) => v.trim()).filter(Boolean)));
  const files = imageFiles(formData);
  const { data: previousImages, error: previousImagesError } = await supabase.from('club_images').select('url').eq('club_id', clubId);
  if (previousImagesError) throw new Error(previousImagesError.message);
  const previousUrls = ((previousImages ?? []) as Array<{ url: string }>).map((image) => image.url);
  const uploadedUrls = await uploadImages(clubId, files);
  const urls = [...existingUrls, ...uploadedUrls];
  const { error: imageDeleteError } = await supabase.from('club_images').delete().eq('club_id', clubId);
  if (imageDeleteError) throw new Error(imageDeleteError.message);
  if (urls.length) {
    const rows = urls.map((url, position) => ({ club_id: clubId, url, position, is_cover: position === 0 }));
    const { error } = await supabase.from('club_images').insert(rows as never[]);
    if (error) throw new Error(error.message);
  }
  const finalSet = new Set(urls);
  const removedPaths = previousUrls.filter((url) => !finalSet.has(url)).map(storagePathFromPublicUrl).filter((path): path is string => Boolean(path));
  if (removedPaths.length) await supabase.storage.from(IMAGE_BUCKET).remove(removedPaths);
}

export async function saveClub(formData: FormData) {
  validateRelationFormInput(formData);
  const supabase = await createClient();
  const id = text(formData, 'id');
  if (!id) throw new Error('Klub ID tapılmadı.');
  const name = text(formData, 'name');
  if (!name) throw new Error('Klub adı boş ola bilməz.');
  const slug = text(formData, 'slug') || slugify(name);
  await ensureSlugAvailable(slug, id);
  const districtId = text(formData, 'district_id');
  if (!districtId) throw new Error('Rayon seçilməlidir.');
  const address = text(formData, 'address');
  if (!address) throw new Error('Ünvan boş ola bilməz.');
  const { latitude, longitude } = validateCoordinates(formData);
  const payload = { name, slug, description: nullableText(formData,'description'), district_id: districtId, address, latitude, longitude, phone: nullableText(formData,'phone'), instagram_url: nullableText(formData,'instagram_url'), rating_avg: nullableNumber(formData,'rating_avg'), rating_count: nullableNumber(formData,'rating_count') ?? 0, is_premium: booleanValue(formData,'is_premium'), premium_expires_at: nullableText(formData,'premium_expires_at'), is_active: booleanValue(formData,'is_active'), updated_at: new Date().toISOString() };
  const { error } = await supabase.from('clubs').update(payload as never).eq('id', id);
  if (error) throw new Error(error.message);
  await replaceRelations(id, formData);
  revalidatePath('/'); revalidatePath('/admin'); revalidatePath('/admin/klublar'); revalidatePath(`/admin/klublar/${id}`); revalidatePath(`/klub/${slug}`);
  redirect(`/admin/klublar/${id}?saved=1`);
}

export async function createClub(formData: FormData) {
  validateRelationFormInput(formData);
  const supabase = await createClient();
  const name = text(formData, 'name');
  if (!name) throw new Error('Klub adı boş ola bilməz.');
  const slug = text(formData, 'slug') || slugify(name);
  await ensureSlugAvailable(slug);
  const districtId = text(formData, 'district_id');
  if (!districtId) throw new Error('Rayon seçilməlidir.');
  const address = text(formData, 'address');
  if (!address) throw new Error('Ünvan boş ola bilməz.');
  const { latitude, longitude } = validateCoordinates(formData);
  const payload = { name, slug, description: nullableText(formData,'description'), district_id: districtId, address, latitude, longitude, phone: nullableText(formData,'phone'), instagram_url: nullableText(formData,'instagram_url'), rating_avg: nullableNumber(formData,'rating_avg'), rating_count: nullableNumber(formData,'rating_count') ?? 0, is_premium: booleanValue(formData,'is_premium'), premium_expires_at: nullableText(formData,'premium_expires_at'), is_active: booleanValue(formData,'is_active') };
  const { data, error } = await supabase.from('clubs').insert(payload as never).select('id,slug').single();
  if (error) throw new Error(error.message);
  const club = data as { id: string; slug: string } | null;
  if (!club) throw new Error('Klub yaradılmadı.');
  try {
    await replaceRelations(club.id, formData);
  } catch (relationError) {
    await supabase.from('clubs').delete().eq('id', club.id);
    throw relationError;
  }
  revalidatePath('/'); revalidatePath('/admin'); revalidatePath('/admin/klublar');
  redirect(`/admin/klublar/${club.id}?created=1`);
}

export async function toggleClubActive(formData: FormData) {
  const supabase = await createClient();
  const id = text(formData, 'id');
  if (!id) throw new Error('Klub ID tapılmadı.');
  const nextValue = text(formData, 'next_value') === 'true';
  const { error } = await supabase.from('clubs').update({ is_active: nextValue, updated_at: new Date().toISOString() } as never).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/'); revalidatePath('/admin'); revalidatePath('/admin/klublar'); revalidatePath(`/admin/klublar/${id}`);
}
