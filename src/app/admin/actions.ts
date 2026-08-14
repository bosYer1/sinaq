'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function nullableNumber(formData: FormData, key: string) {
  const value = text(formData, key);

  if (!value) {
    return null;
  }

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

async function replaceRelations(
  clubId: string,
  formData: FormData
) {
  const supabase = createClient();

  if (!supabase) {
    throw new Error('Supabase konfiqurasiya edilməyib.');
  }

  /*
   * CLUB TYPES / PRICING
   */
  const {
    data: typesData,
    error: typesError,
  } = await supabase
    .from('club_types')
    .select('id,name,slug')
    .order('name');

  if (typesError) {
    throw new Error(typesError.message);
  }

  const types = (typesData ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
  }>;

  const pricingRows = types
    .filter((type) =>
      booleanValue(
        formData,
        `type_enabled_${type.id}`
      )
    )
    .map((type) => ({
      club_id: clubId,
      club_type_id: type.id,
      price_from:
        nullableNumber(
          formData,
          `price_from_${type.id}`
        ) ?? 0,
      price_to: nullableNumber(
        formData,
        `price_to_${type.id}`
      ),
      unit:
        text(
          formData,
          `unit_${type.id}`
        ) || 'saat',
    }));

  const {
    error: pricingDeleteError,
  } = await supabase
    .from('club_pricing')
    .delete()
    .eq('club_id', clubId);

  if (pricingDeleteError) {
    throw new Error(pricingDeleteError.message);
  }

  if (pricingRows.length > 0) {
    const {
      error: pricingInsertError,
    } = await supabase
      .from('club_pricing')
      .insert(pricingRows as never[]);

    if (pricingInsertError) {
      throw new Error(pricingInsertError.message);
    }
  }

  /*
   * OPENING HOURS
   */
  const openingRows = Array.from(
    { length: 7 },
    (_, day) => {
      const closed = booleanValue(
        formData,
        `day_closed_${day}`
      );

      return {
        club_id: clubId,
        day_of_week: day,
        open_time: closed
          ? null
          : nullableText(
              formData,
              `open_time_${day}`
            ),
        close_time: closed
          ? null
          : nullableText(
              formData,
              `close_time_${day}`
            ),
        is_closed: closed,
      };
    }
  );

  const {
    error: hoursDeleteError,
  } = await supabase
    .from('club_opening_hours')
    .delete()
    .eq('club_id', clubId);

  if (hoursDeleteError) {
    throw new Error(hoursDeleteError.message);
  }

  const {
    error: hoursInsertError,
  } = await supabase
    .from('club_opening_hours')
    .insert(openingRows as never[]);

  if (hoursInsertError) {
    throw new Error(hoursInsertError.message);
  }

  /*
   * IMAGES
   */
  const urls = text(formData, 'image_urls')
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);

  const {
    error: imageDeleteError,
  } = await supabase
    .from('club_images')
    .delete()
    .eq('club_id', clubId);

  if (imageDeleteError) {
    throw new Error(imageDeleteError.message);
  }

  if (urls.length > 0) {
    const imageRows = urls.map(
      (url, index) => ({
        club_id: clubId,
        url,
        position: index,
        is_cover: index === 0,
      })
    );

    const {
      error: imageInsertError,
    } = await supabase
      .from('club_images')
      .insert(imageRows as never[]);

    if (imageInsertError) {
      throw new Error(imageInsertError.message);
    }
  }
}

export async function saveClub(
  formData: FormData
) {
  const supabase = createClient();

  if (!supabase) {
    throw new Error('Supabase konfiqurasiya edilməyib.');
  }

  const id = text(formData, 'id');

  if (!id) {
    throw new Error('Klub ID tapılmadı.');
  }

  const name = text(formData, 'name');

  if (!name) {
    throw new Error('Klub adı boş ola bilməz.');
  }

  const slug =
    text(formData, 'slug') ||
    slugify(name);

  const districtId = text(
    formData,
    'district_id'
  );

  if (!districtId) {
    throw new Error('Rayon seçilməlidir.');
  }

  const address = text(formData, 'address');

  if (!address) {
    throw new Error('Ünvan boş ola bilməz.');
  }

  const updatePayload = {
    name,
    slug,
    description: nullableText(
      formData,
      'description'
    ),
    district_id: districtId,
    address,
    latitude: nullableNumber(
      formData,
      'latitude'
    ),
    longitude: nullableNumber(
      formData,
      'longitude'
    ),
    phone: nullableText(
      formData,
      'phone'
    ),
    instagram_url: nullableText(
      formData,
      'instagram_url'
    ),
    rating_avg: nullableNumber(
      formData,
      'rating_avg'
    ),
    rating_count:
      nullableNumber(
        formData,
        'rating_count'
      ) ?? 0,
    is_premium: booleanValue(
      formData,
      'is_premium'
    ),
    premium_expires_at:
      nullableText(
        formData,
        'premium_expires_at'
      ),
    is_active: booleanValue(
      formData,
      'is_active'
    ),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('clubs')
    .update(updatePayload as never)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  await replaceRelations(id, formData);

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/klublar');
  revalidatePath(`/admin/klublar/${id}`);
  revalidatePath(`/klub/${slug}`);

  redirect(
    `/admin/klublar/${id}?saved=1`
  );
}

export async function createClub(
  formData: FormData
) {
  const supabase = createClient();

  if (!supabase) {
    throw new Error('Supabase konfiqurasiya edilməyib.');
  }

  const name = text(formData, 'name');

  if (!name) {
    throw new Error('Klub adı boş ola bilməz.');
  }

  const slug =
    text(formData, 'slug') ||
    slugify(name);

  const districtId = text(
    formData,
    'district_id'
  );

  if (!districtId) {
    throw new Error('Rayon seçilməlidir.');
  }

  const address = text(formData, 'address');

  if (!address) {
    throw new Error('Ünvan boş ola bilməz.');
  }

  const insertPayload = {
    name,
    slug,
    description: nullableText(
      formData,
      'description'
    ),
    district_id: districtId,
    address,
    latitude: nullableNumber(
      formData,
      'latitude'
    ),
    longitude: nullableNumber(
      formData,
      'longitude'
    ),
    phone: nullableText(
      formData,
      'phone'
    ),
    instagram_url: nullableText(
      formData,
      'instagram_url'
    ),
    rating_avg: nullableNumber(
      formData,
      'rating_avg'
    ),
    rating_count:
      nullableNumber(
        formData,
        'rating_count'
      ) ?? 0,
    is_premium: booleanValue(
      formData,
      'is_premium'
    ),
    premium_expires_at:
      nullableText(
        formData,
        'premium_expires_at'
      ),
    is_active: booleanValue(
      formData,
      'is_active'
    ),
  };

  const {
    data: clubData,
    error,
  } = await supabase
    .from('clubs')
    .insert(insertPayload as never)
    .select('id,slug')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const club = clubData as {
    id: string;
    slug: string;
  } | null;

  if (!club) {
    throw new Error('Klub yaradılmadı.');
  }

  await replaceRelations(
    club.id,
    formData
  );

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/klublar');

  redirect(
    `/admin/klublar/${club.id}?created=1`
  );
}

export async function toggleClubActive(
  formData: FormData
) {
  const supabase = createClient();

  if (!supabase) {
    throw new Error('Supabase konfiqurasiya edilməyib.');
  }

  const id = text(formData, 'id');

  if (!id) {
    throw new Error('Klub ID tapılmadı.');
  }

  const nextValue =
    text(
      formData,
      'next_value'
    ) === 'true';

  const payload = {
    is_active: nextValue,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('clubs')
    .update(payload as never)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/klublar');
  revalidatePath(`/admin/klublar/${id}`);
}
