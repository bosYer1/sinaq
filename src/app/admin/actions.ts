'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const IMAGE_BUCKET = 'club-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES_PER_CLUB = 8;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INSTAGRAM_PATTERN = /^https:\/\/(?:www\.)?instagram\.com\//i;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function nullableText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function nullableNumber(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === 'on';
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

function premiumExpiryUtc(formData: FormData) {
  if (!booleanValue(formData, 'is_premium')) return null;

  const localValue = text(formData, 'premium_expires_at');
  if (!localValue) {
    throw new Error('Premium aktivdirsə bitmə tarixi mütləq yazılmalıdır.');
  }

  // datetime-local timezone daşımır. Admin panelində bu sahə həmişə Bakı vaxtıdır (UTC+4).
  const parsed = new Date(`${localValue}:00+04:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Premium bitmə tarixi düzgün deyil.');
  }
  return parsed.toISOString();
}

function validateCoreFormInput(formData: FormData) {
  const rawSlug = text(formData, 'slug');
  if (rawSlug && !SLUG_PATTERN.test(rawSlug)) {
    throw new Error('Slug yalnız kiçik latın hərfləri, rəqəmlər və sözlər arasında tire qəbul edir.');
  }

  const instagramUrl = nullableText(formData, 'instagram_url');
  if (instagramUrl && !INSTAGRAM_PATTERN.test(instagramUrl)) {
    throw new Error('Instagram üçün tam https://instagram.com/... linki yazılmalıdır.');
  }

  if (booleanValue(formData, 'is_premium')) {
    premiumExpiryUtc(formData);
  }
}

function validateCoordinates(formData: FormData) {
  const latitude = nullableNumber(formData, 'latitude');
  const longitude = nullableNumber(formData, 'longitude');

  if (latitude == null || longitude == null) {
    throw new Error('Xəritə üçün latitude və longitude mütləq yazılmalıdır.');
  }
  if (latitude < -90 || latitude > 90) throw new Error('Latitude -90 ilə 90 arasında olmalıdır.');
  if (longitude < -180 || longitude > 180) throw new Error('Longitude -180 ilə 180 arasında olmalıdır.');

  return { latitude, longitude };
}

function imageFiles(formData: FormData) {
  return formData
    .getAll('image_files')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function validateImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('.supabase.co') &&
      parsed.pathname.includes(`/storage/v1/object/public/${IMAGE_BUCKET}/`)
    );
  } catch {
    return false;
  }
}

function validateRelationFormInput(formData: FormData) {
  const enabledTypeIds = Array.from(formData.keys())
    .filter((key) => key.startsWith('type_enabled_') && booleanValue(formData, key))
    .map((key) => key.replace('type_enabled_', ''));

  if (enabledTypeIds.length === 0) {
    throw new Error('Ən azı bir klub tipi (PC və ya PlayStation) seçilməlidir.');
  }

  for (const typeId of enabledTypeIds) {
    const priceFrom = nullableNumber(formData, `price_from_${typeId}`);
    const priceTo = nullableNumber(formData, `price_to_${typeId}`);
    if (priceFrom != null && priceFrom < 0) throw new Error('Qiymət mənfi ola bilməz.');
    if (priceFrom != null && priceFrom > 0 && priceTo != null && priceTo < priceFrom) {
      throw new Error('Son qiymət başlanğıc qiymətdən aşağı ola bilməz.');
    }
  }

  if (booleanValue(formData, 'hours_enabled')) {
    for (let day = 0; day < 7; day += 1) {
      if (booleanValue(formData, `day_closed_${day}`)) continue;
      if (!nullableText(formData, `open_time_${day}`) || !nullableText(formData, `close_time_${day}`)) {
        throw new Error(`${day + 1}-ci gün üçün açılış və bağlanış saatı yazılmalıdır.`);
      }
    }
  }

  const existingUrls = Array.from(
    new Set(
      text(formData, 'image_urls')
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

  if (existingUrls.some((url) => !validateImageUrl(url))) {
    throw new Error('Şəkil URL-i GameYer-in Supabase club-images yaddaşından olmalıdır.');
  }

  const files = imageFiles(formData);
  if (existingUrls.length + files.length > MAX_IMAGES_PER_CLUB) {
    throw new Error(`Bir klubda maksimum ${MAX_IMAGES_PER_CLUB} şəkil saxlamaq olar.`);
  }

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
  const base =
    name
      .replace(/\.[^.]+$/, '')
      .toLocaleLowerCase('az')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'image';
  return `${base}.${extension}`;
}

function storagePathFromPublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

async function removeUploadedFiles(urls: string[]) {
  if (urls.length === 0) return;
  const supabase = await createClient();
  const paths = urls
    .map(storagePathFromPublicUrl)
    .filter((path): path is string => Boolean(path));
  if (paths.length > 0) await supabase.storage.from(IMAGE_BUCKET).remove(paths);
}

async function uploadImages(clubId: string, files: File[]) {
  const supabase = await createClient();
  const uploadedUrls: string[] = [];

  try {
    for (const file of files) {
      const path = `${clubId}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });
      if (error) throw new Error(`Şəkil yüklənmədi: ${error.message}`);
      uploadedUrls.push(supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
    }
    return uploadedUrls;
  } catch (error) {
    await removeUploadedFiles(uploadedUrls);
    throw error;
  }
}

async function replaceRelations(clubId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: typesData, error: typesError } = await supabase
    .from('club_types')
    .select('id,name,slug')
    .order('name');
  if (typesError) throw new Error(typesError.message);

  const types = (typesData ?? []) as Array<{ id: string; name: string; slug: string }>;
  const enabledTypes = types.filter((type) => booleanValue(formData, `type_enabled_${type.id}`));
  if (enabledTypes.length === 0) {
    throw new Error('Ən azı bir klub tipi (PC və ya PlayStation) seçilməlidir.');
  }

  const assignments = enabledTypes.map((type) => ({ club_type_id: type.id }));
  const pricing = enabledTypes
    .map((type) => {
      const priceFrom = nullableNumber(formData, `price_from_${type.id}`);
      if (priceFrom == null || priceFrom <= 0) return null;
      return {
        club_type_id: type.id,
        price_from: priceFrom,
        price_to: nullableNumber(formData, `price_to_${type.id}`),
        unit: text(formData, `unit_${type.id}`) || 'saat',
      };
    })
    .filter(Boolean);

  const hours = booleanValue(formData, 'hours_enabled')
    ? Array.from({ length: 7 }, (_, day) => {
        const closed = booleanValue(formData, `day_closed_${day}`);
        return {
          day_of_week: day,
          open_time: closed ? null : nullableText(formData, `open_time_${day}`),
          close_time: closed ? null : nullableText(formData, `close_time_${day}`),
          is_closed: closed,
        };
      })
    : [];

  const existingUrls = Array.from(
    new Set(
      text(formData, 'image_urls')
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

  const { data: previousImages, error: previousImagesError } = await supabase
    .from('club_images')
    .select('url')
    .eq('club_id', clubId);
  if (previousImagesError) throw new Error(previousImagesError.message);

  const previousUrls = ((previousImages ?? []) as Array<{ url: string }>).map((image) => image.url);
  const uploadedUrls = await uploadImages(clubId, imageFiles(formData));
  const finalUrls = [...existingUrls, ...uploadedUrls];
  const images = finalUrls.map((url, position) => ({
    url,
    position,
    is_cover: position === 0,
  }));

  const { error: rpcError } = await (supabase as any).rpc('replace_club_relations_atomic', {
    p_club_id: clubId,
    p_assignments: assignments,
    p_pricing: pricing,
    p_hours: hours,
    p_images: images,
  });

  if (rpcError) {
    await removeUploadedFiles(uploadedUrls);
    throw new Error(rpcError.message);
  }

  const finalUrlSet = new Set(finalUrls);
  const removedPaths = previousUrls
    .filter((url) => !finalUrlSet.has(url))
    .map(storagePathFromPublicUrl)
    .filter((path): path is string => Boolean(path));

  if (removedPaths.length > 0) {
    const { error: storageError } = await supabase.storage.from(IMAGE_BUCKET).remove(removedPaths);
    if (storageError) console.error('Köhnə şəkillərin Storage təmizlənməsi uğursuz oldu:', storageError.message);
  }
}

export async function saveClub(formData: FormData) {
  validateCoreFormInput(formData);
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

  const { data: previousClub, error: previousClubError } = await supabase
    .from('clubs')
    .select('name,slug,description,district_id,address,latitude,longitude,phone,instagram_url,rating_avg,rating_count,is_premium,premium_expires_at,is_active,updated_at')
    .eq('id', id)
    .single();
  if (previousClubError || !previousClub) {
    throw new Error(previousClubError?.message ?? 'Klubun əvvəlki vəziyyəti oxunmadı.');
  }

  const payload = {
    name,
    slug,
    description: nullableText(formData, 'description'),
    district_id: districtId,
    address,
    latitude,
    longitude,
    phone: nullableText(formData, 'phone'),
    instagram_url: nullableText(formData, 'instagram_url'),
    rating_avg: nullableNumber(formData, 'rating_avg'),
    rating_count: nullableNumber(formData, 'rating_count') ?? 0,
    is_premium: booleanValue(formData, 'is_premium'),
    premium_expires_at: premiumExpiryUtc(formData),
    is_active: booleanValue(formData, 'is_active'),
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase.from('clubs').update(payload as never).eq('id', id);
  if (updateError) throw new Error(updateError.message);

  try {
    await replaceRelations(id, formData);
  } catch (relationError) {
    const { error: rollbackError } = await supabase
      .from('clubs')
      .update(previousClub as never)
      .eq('id', id);
    if (rollbackError) console.error('Klub rollback uğursuz oldu:', rollbackError.message);
    throw relationError;
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/klublar');
  revalidatePath(`/admin/klublar/${id}`);
  revalidatePath(`/klub/${slug}`);
  redirect(`/admin/klublar/${id}?saved=1`);
}

export async function createClub(formData: FormData) {
  validateCoreFormInput(formData);
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

  const payload = {
    name,
    slug,
    description: nullableText(formData, 'description'),
    district_id: districtId,
    address,
    latitude,
    longitude,
    phone: nullableText(formData, 'phone'),
    instagram_url: nullableText(formData, 'instagram_url'),
    rating_avg: nullableNumber(formData, 'rating_avg'),
    rating_count: nullableNumber(formData, 'rating_count') ?? 0,
    is_premium: booleanValue(formData, 'is_premium'),
    premium_expires_at: premiumExpiryUtc(formData),
    is_active: booleanValue(formData, 'is_active'),
  };

  const { data, error } = await supabase
    .from('clubs')
    .insert(payload as never)
    .select('id,slug')
    .single();
  if (error) throw new Error(error.message);

  const club = data as { id: string; slug: string } | null;
  if (!club) throw new Error('Klub yaradılmadı.');

  try {
    await replaceRelations(club.id, formData);
  } catch (relationError) {
    await supabase.from('clubs').delete().eq('id', club.id);
    throw relationError;
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/klublar');
  redirect(`/admin/klublar/${club.id}?created=1`);
}

export async function toggleClubActive(formData: FormData) {
  const supabase = await createClient();
  const id = text(formData, 'id');
  if (!id) throw new Error('Klub ID tapılmadı.');

  const nextValue = text(formData, 'next_value') === 'true';
  const { error } = await supabase
    .from('clubs')
    .update({ is_active: nextValue, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/klublar');
  revalidatePath(`/admin/klublar/${id}`);
}