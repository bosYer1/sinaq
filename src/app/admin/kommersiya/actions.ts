'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin/requireAdmin';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MANUAL_SALES_STAGES = new Set(['targeted','contacted','replied','offered','lost']);
const INTENT_EVENTS = ['phone_click', 'instagram_click', 'maps_click'] as const;
const SYNTHETIC_USER_AGENT_RE = /(bot|crawler|spider|headless|playwright|puppeteer|lighthouse)/i;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function nullableText(formData: FormData, key: string, max = 4000) {
  const value = text(formData, key);
  if (!value) return null;
  if (value.length > max) throw new Error(`${key} maksimum ${max} simvol ola bilər.`);
  return value;
}

function requiredUuid(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!UUID_PATTERN.test(value)) throw new Error(`${key} düzgün deyil.`);
  return value;
}

function optionalUuid(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  if (!UUID_PATTERN.test(value)) throw new Error(`${key} düzgün deyil.`);
  return value;
}

function nonNegativeNumber(formData: FormData, key: string, fallback?: number) {
  const value = text(formData, key);
  if (!value && fallback != null) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${key} düzgün rəqəm olmalıdır.`);
  return parsed;
}

function bakuDateStart(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Başlama tarixi düzgün deyil.');
  const parsed = new Date(`${value}T00:00:00+04:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error('Başlama tarixi düzgün deyil.');
  return parsed;
}

function optionalBakuDateTime(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}:00+04:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error('Tarix/saat düzgün deyil.');
  return parsed.toISOString();
}

function refreshCommercial() {
  revalidatePath('/admin/kommersiya');
}

type MetricClient = Awaited<ReturnType<typeof requireAdmin>>['supabase'];

async function collectFirstPartyMetrics(
  supabase: MetricClient,
  slug: string,
  periodStart: Date,
  periodEnd: Date,
) {
  const from = periodStart.toISOString();
  const to = periodEnd.toISOString();
  const path = `/klub/${slug}`;

  const [viewsResult, intentResult] = await Promise.all([
    supabase
      .from('page_views')
      .select('session_id,user_agent')
      .eq('path', path)
      .gte('created_at', from)
      .lt('created_at', to)
      .limit(10000),
    supabase
      .from('analytics_events')
      .select('session_id,event_type')
      .eq('club_slug', slug)
      .in('event_type', [...INTENT_EVENTS])
      .gte('created_at', from)
      .lt('created_at', to)
      .limit(10000),
  ]);

  if (viewsResult.error) throw new Error(`Profil baxışları oxunmadı: ${viewsResult.error.message}`);
  if (intentResult.error) throw new Error(`Intent məlumatları oxunmadı: ${intentResult.error.message}`);

  const rawViewRows = viewsResult.data ?? [];
  const viewRows = rawViewRows.filter((row) => !SYNTHETIC_USER_AGENT_RE.test(row.user_agent ?? ''));
  const normalViewSessionIds = new Set(viewRows.map((row) => row.session_id));
  const rawIntentRows = intentResult.data ?? [];
  const intentRows = rawIntentRows.filter((row) => normalViewSessionIds.has(row.session_id));
  const intentSessions = new Set(intentRows.map((row) => row.session_id));

  return {
    profile_views: viewRows.length,
    view_sessions: normalViewSessionIds.size,
    phone_clicks: intentRows.filter((row) => row.event_type === 'phone_click').length,
    instagram_clicks: intentRows.filter((row) => row.event_type === 'instagram_click').length,
    maps_clicks: intentRows.filter((row) => row.event_type === 'maps_click').length,
    intent_sessions: intentSessions.size,
  };
}

export async function createCommercialOpportunity(formData: FormData) {
  const { supabase } = await requireAdmin();
  const clubId = requiredUuid(formData, 'club_id');
  const packageId = optionalUuid(formData, 'package_id');
  const offerPrice = nonNegativeNumber(formData, 'offer_price_azn', 29);

  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id,name,is_active')
    .eq('id', clubId)
    .maybeSingle();
  if (clubError || !club) throw new Error(clubError?.message ?? 'Klub tapılmadı.');
  if (!club.is_active) throw new Error('Deaktiv klub satış pipeline-na əlavə edilmir.');

  if (packageId) {
    const { data: packageRow, error: packageError } = await supabase
      .from('commercial_packages')
      .select('id,is_active')
      .eq('id', packageId)
      .maybeSingle();
    if (packageError || !packageRow?.is_active) throw new Error(packageError?.message ?? 'Aktiv paket tapılmadı.');
  }

  const { data: existingOpportunity, error: existingOpportunityError } = await supabase
    .from('commercial_opportunities')
    .select('id,stage')
    .eq('club_id', clubId)
    .not('stage', 'in', '(reported,renewed,lost)')
    .limit(1)
    .maybeSingle();
  if (existingOpportunityError) throw new Error(existingOpportunityError.message);
  if (existingOpportunity) throw new Error('Bu klub üçün artıq açıq satış opportunity-si var.');

  const { data: previousOpportunity, error: previousOpportunityError } = await supabase
    .from('commercial_opportunities')
    .select('customer_id')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousOpportunityError) throw new Error(previousOpportunityError.message);

  let customerId = previousOpportunity?.customer_id ?? null;
  let createdCustomerId: string | null = null;

  if (customerId) {
    const contactPatch: {
      contact_name?: string;
      contact_phone?: string;
      contact_instagram?: string;
    } = {};
    const contactName = nullableText(formData, 'contact_name', 160);
    const contactPhone = nullableText(formData, 'contact_phone', 64);
    const contactInstagram = nullableText(formData, 'contact_instagram', 200);
    if (contactName) contactPatch.contact_name = contactName;
    if (contactPhone) contactPatch.contact_phone = contactPhone;
    if (contactInstagram) contactPatch.contact_instagram = contactInstagram;

    if (Object.keys(contactPatch).length > 0) {
      const { error: customerUpdateError } = await supabase
        .from('business_customers')
        .update({ ...contactPatch, display_name: club.name })
        .eq('id', customerId);
      if (customerUpdateError) throw new Error(customerUpdateError.message);
    }
  } else {
    const { data: customer, error: customerError } = await supabase
      .from('business_customers')
      .insert({
        display_name: club.name,
        contact_name: nullableText(formData, 'contact_name', 160),
        contact_phone: nullableText(formData, 'contact_phone', 64),
        contact_instagram: nullableText(formData, 'contact_instagram', 200),
        status: 'lead',
      })
      .select('id')
      .single();
    if (customerError || !customer) throw new Error(customerError?.message ?? 'Müştəri yaradılmadı.');
    customerId = customer.id;
    createdCustomerId = customer.id;
  }

  const { error: opportunityError } = await supabase
    .from('commercial_opportunities')
    .insert({
      customer_id: customerId,
      club_id: clubId,
      package_id: packageId,
      stage: 'targeted',
      offer_price_azn: offerPrice,
      notes: nullableText(formData, 'notes'),
    });

  if (opportunityError) {
    if (createdCustomerId) await supabase.from('business_customers').delete().eq('id', createdCustomerId);
    throw new Error(opportunityError.message);
  }

  refreshCommercial();
}

export async function updateCommercialOpportunity(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = requiredUuid(formData, 'id');
  const stage = text(formData, 'stage');
  if (!MANUAL_SALES_STAGES.has(stage)) throw new Error('Paid və sonrakı mərhələlər yalnız sistem əməliyyatı ilə dəyişdirilə bilər.');

  const lostReason = nullableText(formData, 'lost_reason', 1000);
  if (stage === 'lost' && !lostReason) throw new Error('LOST üçün səbəb yazılmalıdır.');

  const { data: current, error: currentError } = await supabase
    .from('commercial_opportunities')
    .select('first_contact_at')
    .eq('id', id)
    .maybeSingle();
  if (currentError || !current) throw new Error(currentError?.message ?? 'Opportunity tapılmadı.');

  const contactStage = stage === 'contacted' || stage === 'replied' || stage === 'offered';
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('commercial_opportunities')
    .update({
      stage: stage as 'targeted' | 'contacted' | 'replied' | 'offered' | 'paid' | 'activated' | 'reported' | 'renewed' | 'lost',
      first_contact_at: contactStage && !current.first_contact_at ? now : current.first_contact_at,
      last_contact_at: contactStage ? now : undefined,
      next_follow_up_at: optionalBakuDateTime(text(formData, 'next_follow_up_at')),
      lost_reason: stage === 'lost' ? lostReason : null,
      notes: nullableText(formData, 'notes'),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);

  refreshCommercial();
}

export async function recordPaidCommercialSale(formData: FormData) {
  const { supabase } = await requireAdmin();
  const opportunityId = requiredUuid(formData, 'opportunity_id');

  const { data: opportunity, error: opportunityError } = await supabase
    .from('commercial_opportunities')
    .select('id,stage,club_id')
    .eq('id', opportunityId)
    .maybeSingle();
  if (opportunityError || !opportunity) throw new Error(opportunityError?.message ?? 'Opportunity tapılmadı.');
  if (opportunity.stage === 'lost') throw new Error('LOST opportunity əvvəlcə yenidən aktiv satış mərhələsinə keçirilməlidir.');
  if (!opportunity.club_id) throw new Error('Opportunity klubla bağlı deyil.');

  const { data: saleClub, error: saleClubError } = await supabase
    .from('clubs')
    .select('id,is_active')
    .eq('id', opportunity.club_id)
    .maybeSingle();
  if (saleClubError || !saleClub) throw new Error(saleClubError?.message ?? 'Klub tapılmadı.');
  if (!saleClub.is_active) throw new Error('Deaktiv klub üçün ödənişli satış qeyd edilmir.');

  const agreedPrice = nonNegativeNumber(formData, 'agreed_price_azn');
  const discount = nonNegativeNumber(formData, 'discount_azn', 0);
  if (discount > agreedPrice) throw new Error('Endirim satış qiymətindən böyük ola bilməz.');
  const netAmount = agreedPrice - discount;
  if (netAmount <= 0) throw new Error('Ödənişli satış üçün net məbləğ 0-dan böyük olmalıdır.');

  const startsAt = bakuDateStart(text(formData, 'starts_on'));
  const durationDays = Math.floor(nonNegativeNumber(formData, 'duration_days', 30));
  if (durationDays < 1 || durationDays > 365) throw new Error('Müddət 1–365 gün arasında olmalıdır.');
  const endsAt = new Date(startsAt.getTime() + durationDays * 86_400_000);

  const { error } = await supabase.rpc('record_paid_commercial_sale_atomic', {
    p_opportunity_id: opportunityId,
    p_agreed_price_azn: agreedPrice,
    p_discount_azn: discount,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
    p_payment_method: nullableText(formData, 'payment_method', 80),
    p_external_reference: nullableText(formData, 'external_reference', 200),
    p_contract_notes: nullableText(formData, 'contract_notes'),
  });
  if (error) throw new Error(error.message);

  refreshCommercial();
}

export async function activateCommercialPremium(formData: FormData) {
  const { supabase } = await requireAdmin();
  const contractId = requiredUuid(formData, 'contract_id');

  const { data: contract, error: contractError } = await supabase
    .from('commercial_contracts')
    .select('id,club_id,status,starts_at,ends_at')
    .eq('id', contractId)
    .maybeSingle();
  if (contractError || !contract) throw new Error(contractError?.message ?? 'Müqavilə tapılmadı.');
  if (contract.status !== 'active' || !contract.club_id || !contract.ends_at) throw new Error('Yalnız aktiv, tarixli klub müqaviləsi Premium-a keçirilə bilər.');

  const startsAt = new Date(contract.starts_at);
  const endsAt = new Date(contract.ends_at);
  const now = new Date();
  if (startsAt > now) throw new Error('Premium başlama tarixi hələ çatmayıb.');
  if (endsAt <= now) throw new Error('Müqavilənin müddəti bitib.');

  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id,slug,is_active')
    .eq('id', contract.club_id)
    .maybeSingle();
  if (clubError || !club) throw new Error(clubError?.message ?? 'Klub tapılmadı.');
  if (!club.is_active) throw new Error('Deaktiv klub Premium-a keçirilmir.');

  const baselineEnd = startsAt;
  const baselineStart = new Date(startsAt.getTime() - 30 * 86_400_000);
  const baselineMetrics = await collectFirstPartyMetrics(supabase, club.slug, baselineStart, baselineEnd);

  const { error } = await supabase.rpc('activate_commercial_premium_atomic', {
    p_contract_id: contractId,
    p_baseline_start: baselineStart.toISOString(),
    p_baseline_end: baselineEnd.toISOString(),
    p_profile_views: baselineMetrics.profile_views,
    p_view_sessions: baselineMetrics.view_sessions,
    p_phone_clicks: baselineMetrics.phone_clicks,
    p_instagram_clicks: baselineMetrics.instagram_clicks,
    p_maps_clicks: baselineMetrics.maps_clicks,
    p_intent_sessions: baselineMetrics.intent_sessions,
  });
  if (error) throw new Error(error.message);

  updateTag('public-clubs');
  revalidatePath('/');
  revalidatePath('/admin/klublar');
  revalidatePath(`/klub/${club.slug}`);
  refreshCommercial();
}

export async function captureCommercialPerformance(formData: FormData) {
  const { supabase } = await requireAdmin();
  const placementId = requiredUuid(formData, 'placement_id');
  const snapshotType = text(formData, 'snapshot_type');
  if (snapshotType !== 'day7' && snapshotType !== 'final') throw new Error('Snapshot tipi düzgün deyil.');

  const { data: placement, error: placementError } = await supabase
    .from('commercial_placements')
    .select('id,contract_id,club_id,starts_at,ends_at,status')
    .eq('id', placementId)
    .maybeSingle();
  if (placementError || !placement) throw new Error(placementError?.message ?? 'Placement tapılmadı.');

  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id,slug,premium_expires_at')
    .eq('id', placement.club_id)
    .maybeSingle();
  if (clubError || !club) throw new Error(clubError?.message ?? 'Klub tapılmadı.');

  const { data: existing } = await supabase
    .from('commercial_performance_snapshots')
    .select('id')
    .eq('placement_id', placementId)
    .eq('snapshot_type', snapshotType)
    .maybeSingle();
  if (existing && snapshotType === 'day7') throw new Error('Bu checkpoint artıq saxlanılıb.');

  const now = new Date();
  const startsAt = new Date(placement.starts_at);
  const endsAt = placement.ends_at ? new Date(placement.ends_at) : null;
  let periodEnd: Date;

  if (snapshotType === 'day7') {
    const day7 = new Date(startsAt.getTime() + 7 * 86_400_000);
    if (now < day7) throw new Error('Day-7 checkpoint üçün 7 tam gün tamamlanmalıdır.');
    periodEnd = day7;
  } else {
    if (!endsAt || now < endsAt) throw new Error('Final checkpoint yalnız placement bitəndən sonra saxlanır.');
    periodEnd = endsAt;
  }

  const metrics = await collectFirstPartyMetrics(supabase, club.slug, startsAt, periodEnd);
  if (snapshotType === 'final') {
    const { error } = await supabase.rpc('finalize_commercial_performance_atomic', {
      p_placement_id: placement.id,
      p_period_start: startsAt.toISOString(),
      p_period_end: periodEnd.toISOString(),
      p_profile_views: metrics.profile_views,
      p_view_sessions: metrics.view_sessions,
      p_phone_clicks: metrics.phone_clicks,
      p_instagram_clicks: metrics.instagram_clicks,
      p_maps_clicks: metrics.maps_clicks,
      p_intent_sessions: metrics.intent_sessions,
    });
    if (error) throw new Error(error.message);

    updateTag('public-clubs');
    revalidatePath('/');
    revalidatePath(`/klub/${club.slug}`);
  } else {
    const { error: snapshotError } = await supabase
      .from('commercial_performance_snapshots')
      .insert({
        placement_id: placement.id,
        club_id: placement.club_id,
        snapshot_type: snapshotType,
        period_start: startsAt.toISOString(),
        period_end: periodEnd.toISOString(),
        ...metrics,
      });
    if (snapshotError) throw new Error(snapshotError.message);
  }

  refreshCommercial();
}
