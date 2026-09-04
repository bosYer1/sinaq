'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServerAdminClient } from '@/lib/supabase/server-admin';

const KINDS = new Set(['correction', 'new_club', 'owner_claim']);
const CONTACT_TYPES = new Set(['instagram', 'phone', 'email']);
const OWNER_ROLES: Record<string, string> = {
  owner: 'Sahib',
  manager: 'Menecer',
  employee: 'Əməkdaş',
  representative: 'Rəsmi nümayəndə',
};
const IMAGE_BUCKET = 'club-images';
const MAX_OWNER_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type SubmissionResult = 'sent' | 'error' | 'rate';

function text(formData: FormData, key: string, max: number) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function resultUrl(formData: FormData, result: SubmissionResult) {
  const requested = text(formData, 'return_to', 30);
  const path = requested === '/klub-sahibi' ? '/klub-sahibi' : '/elaqe';
  const params = new URLSearchParams({ [result]: '1' });
  const club = text(formData, 'club_name', 120);
  const slug = text(formData, 'club_slug', 120);
  if (club) params.set('club', club);
  if (slug) params.set('slug', slug);
  return `${path}?${params.toString()}`;
}

function validContact(type: string, value: string) {
  if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (type === 'phone') return /^\+?[\d\s()\-]{7,24}$/.test(value);
  if (type === 'instagram') {
    return /^@?[a-z0-9._]{1,30}$/i.test(value) || /^https:\/\/(?:www\.)?instagram\.com\/[a-z0-9._]+\/?(?:\?.*)?$/i.test(value);
  }
  return false;
}

function validInstagram(value: string) {
  if (!value) return true;
  return /^@?[a-z0-9._]{1,30}$/i.test(value) || /^https:\/\/(?:www\.)?instagram\.com\/[a-z0-9._]+\/?(?:\?.*)?$/i.test(value);
}

function optionalPrice(formData: FormData, key: string) {
  const raw = text(formData, key, 20);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1000) return Number.NaN;
  return value;
}

function ownerClaimMessage(formData: FormData, freeMessage: string) {
  const role = text(formData, 'owner_role', 30);
  const officialInstagram = text(formData, 'official_instagram', 200);
  const hoursNote = text(formData, 'hours_note', 300);
  const pcPrice = optionalPrice(formData, 'pc_price');
  const psPrice = optionalPrice(formData, 'ps_price');

  if (!OWNER_ROLES[role] || !validInstagram(officialInstagram) || Number.isNaN(pcPrice) || Number.isNaN(psPrice)) {
    return null;
  }

  const hasEvidenceSignal = Boolean(
    officialInstagram ||
    hoursNote ||
    pcPrice != null ||
    psPrice != null ||
    freeMessage.length >= 10
  );

  if (!hasEvidenceSignal) return null;

  const lines = [
    '[STRUKTURLAŞDIRILMIŞ KLUB SAHİBİ MƏLUMATI]',
    `Klubla əlaqə: ${OWNER_ROLES[role]}`,
    officialInstagram ? `Rəsmi Instagram: ${officialInstagram}` : null,
    pcPrice != null ? `PC qiyməti: ${pcPrice} AZN/saat` : null,
    psPrice != null ? `PlayStation qiyməti: ${psPrice} AZN/saat` : null,
    hoursNote ? `İş saatları: ${hoursNote}` : null,
    freeMessage ? `Əlavə qeyd: ${freeMessage}` : null,
  ].filter((line): line is string => Boolean(line));

  return lines.join('\n').slice(0, 3000);
}

function ownerImages(formData: FormData) {
  return formData
    .getAll('owner_images')
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function extensionFor(file: File) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

async function submitOwnerClaim(args: {
  formData: FormData;
  clubName: string;
  clubSlug: string;
  message: string;
  contactType: 'instagram' | 'phone' | 'email';
  contactValue: string;
}) {
  const { formData, clubName, clubSlug, message, contactType, contactValue } = args;
  const files = ownerImages(formData);
  if (files.length > MAX_OWNER_IMAGES) throw new Error(`Maksimum ${MAX_OWNER_IMAGES} şəkil əlavə etmək olar.`);

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('Şəkil formatı yalnız JPG, PNG və ya WEBP ola bilər.');
    if (file.size > MAX_IMAGE_SIZE) throw new Error('Hər şəkil maksimum 5 MB ola bilər.');
  }

  const admin = createServerAdminClient();
  if (!admin) throw new Error('Owner claim üçün trusted server bağlantısı mövcud deyil.');

  let clubId: string | null = null;
  if (clubSlug) {
    const { data: club, error: clubError } = await admin
      .from('clubs')
      .select('id')
      .eq('slug', clubSlug)
      .maybeSingle();
    if (clubError) throw new Error(clubError.message);
    clubId = club?.id ?? null;
  }

  const submissionId = crypto.randomUUID();
  const { error: insertError } = await admin.from('club_submissions').insert({
    id: submissionId,
    kind: 'owner_claim',
    club_id: clubId,
    club_name: clubName,
    message,
    contact_type: contactType,
    contact_value: contactValue,
    submitted_images: [],
  });

  if (insertError) throw new Error(insertError.message);

  const uploadedPaths: string[] = [];
  const uploadedUrls: string[] = [];

  try {
    for (const file of files) {
      const path = `owner-submissions/${submissionId}/${crypto.randomUUID()}.${extensionFor(file)}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { error: uploadError } = await admin.storage.from(IMAGE_BUCKET).upload(path, bytes, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message);

      uploadedPaths.push(path);
      uploadedUrls.push(admin.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
    }

    if (uploadedUrls.length > 0) {
      const { error: updateError } = await admin
        .from('club_submissions')
        .update({ submitted_images: uploadedUrls })
        .eq('id', submissionId)
        .eq('kind', 'owner_claim');
      if (updateError) throw new Error(updateError.message);
    }
  } catch (error) {
    if (uploadedPaths.length > 0) await admin.storage.from(IMAGE_BUCKET).remove(uploadedPaths);
    await admin.from('club_submissions').delete().eq('id', submissionId);
    throw error;
  }
}

export async function submitClubSubmission(formData: FormData) {
  const successUrl = resultUrl(formData, 'sent');

  if (text(formData, 'website', 200)) redirect(successUrl);

  const kind = text(formData, 'kind', 30);
  const clubName = text(formData, 'club_name', 120);
  const clubSlug = text(formData, 'club_slug', 120);
  const freeMessage = text(formData, 'message', 3000);
  const contactType = text(formData, 'contact_type', 30);
  const contactValue = text(formData, 'contact_value', 200);

  if (!KINDS.has(kind) || !CONTACT_TYPES.has(contactType) || clubName.length < 2 || !validContact(contactType, contactValue)) {
    redirect(resultUrl(formData, 'error'));
  }

  const message = kind === 'owner_claim' ? ownerClaimMessage(formData, freeMessage) : freeMessage;
  if (!message || (kind !== 'owner_claim' && message.length < 10)) {
    redirect(resultUrl(formData, 'error'));
  }

  try {
    if (kind === 'owner_claim') {
      await submitOwnerClaim({
        formData,
        clubName,
        clubSlug,
        message,
        contactType: contactType as 'instagram' | 'phone' | 'email',
        contactValue,
      });
      redirect(successUrl);
    }

    const supabase = await createClient();
    let clubId: string | null = null;

    if (clubSlug) {
      const { data } = await supabase.from('clubs').select('id').eq('slug', clubSlug).eq('is_active', true).maybeSingle();
      clubId = data?.id ?? null;
    }

    const { error } = await supabase.from('club_submissions').insert({
      kind: kind as 'correction' | 'new_club',
      club_id: clubId,
      club_name: clubName,
      message,
      contact_type: contactType as 'instagram' | 'phone' | 'email',
      contact_value: contactValue,
    });

    if (error) throw new Error(error.message);
    redirect(successUrl);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'unknown submission error';
    if (messageText.includes('Submission rate limit exceeded')) {
      redirect(resultUrl(formData, 'rate'));
    }
    console.error('GAMEYER_SUBMISSION_ERROR', messageText);
    redirect(resultUrl(formData, 'error'));
  }
}
