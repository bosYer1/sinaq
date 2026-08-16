'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const KINDS = new Set(['correction', 'new_club', 'owner_claim']);
const CONTACT_TYPES = new Set(['instagram', 'phone', 'email']);
const OWNER_ROLES: Record<string, string> = {
  owner: 'Sahib',
  manager: 'Menecer',
  employee: 'Əməkdaş',
  representative: 'Rəsmi nümayəndə',
};
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

export async function submitClubSubmission(formData: FormData) {
  const successUrl = resultUrl(formData, 'sent');

  // Honeypot: bots often fill hidden fields. Return a fake success without writing data.
  if (text(formData, 'website', 200)) redirect(successUrl);

  const kind = text(formData, 'kind', 30);
  const clubName = text(formData, 'club_name', 120);
  const clubSlug = text(formData, 'club_slug', 120);
  const freeMessage = text(formData, 'message', 3000);
  const contactType = text(formData, 'contact_type', 30);
  const contactValue = text(formData, 'contact_value', 200);

  if (
    !KINDS.has(kind) ||
    !CONTACT_TYPES.has(contactType) ||
    clubName.length < 2 ||
    !validContact(contactType, contactValue)
  ) {
    redirect(resultUrl(formData, 'error'));
  }

  const message = kind === 'owner_claim' ? ownerClaimMessage(formData, freeMessage) : freeMessage;
  if (!message || (kind !== 'owner_claim' && message.length < 10)) {
    redirect(resultUrl(formData, 'error'));
  }

  const supabase = await createClient();
  let clubId: string | null = null;

  if (clubSlug) {
    const { data } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', clubSlug)
      .eq('is_active', true)
      .maybeSingle();
    clubId = data?.id ?? null;
  }

  const { error } = await supabase.from('club_submissions').insert({
    kind: kind as 'correction' | 'new_club' | 'owner_claim',
    club_id: clubId,
    club_name: clubName,
    message,
    contact_type: contactType as 'instagram' | 'phone' | 'email',
    contact_value: contactValue,
    status: 'pending',
    reviewed_at: null,
  });

  if (error) {
    if (error.message.includes('Submission rate limit exceeded')) {
      redirect(resultUrl(formData, 'rate'));
    }
    console.error('GAMEYER_SUBMISSION_ERROR', error.message);
    redirect(resultUrl(formData, 'error'));
  }

  redirect(successUrl);
}
