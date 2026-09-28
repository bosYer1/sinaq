import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { providerStatus } from './providers';
import { calculateCompleteness } from './normalization';
import type { Database } from '@/types/database';
import type { ClubDataQualityRow, DateRange, SupabaseMetrics } from './types';

type ClubQualityRow = Pick<Database['public']['Tables']['clubs']['Row'], 'id' | 'name' | 'slug' | 'phone' | 'instagram_url' | 'tiktok_url' | 'profile_image_url' | 'latitude' | 'longitude'>;
type EvidenceRow = Pick<Database['public']['Tables']['club_data_evidence']['Row'], 'club_id' | 'field_name' | 'evidence_value' | 'confidence' | 'is_current' | 'checked_at'>;
type TypeAssignmentRow = { club_id: string; club_type: { slug: string } | null };

const EVIDENCE_FRESH_DAYS = 30;
const STRONG_EVIDENCE_CONFIDENCE = new Set(['official', 'corroborated']);

function evidenceGroup(fieldName: string): 'status' | 'type' | 'location' | null {
  if (fieldName === 'status') return 'status';
  if (fieldName === 'type') return 'type';
  if (fieldName === 'address' || fieldName === 'coordinates') return 'location';
  return null;
}

function evidencedClubTypes(value: string | null): Set<'pc' | 'playstation'> {
  const normalized = (value ?? '')
    .toLocaleLowerCase('az')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g');
  const result = new Set<'pc' | 'playstation'>();
  if (/\bpc\b|komputer|computer|internet[ -]?(?:cafe|kafe|club|klub)/i.test(normalized)) result.add('pc');
  if (/playstation|\bps[345]\b|\bps\s*[345]\b/i.test(normalized)) result.add('playstation');
  return result;
}

function typeEvidenceComplete(
  assignedTypes: Set<'pc' | 'playstation'>,
  evidencedTypes: Set<'pc' | 'playstation'>,
) {
  return assignedTypes.size > 0 && [...assignedTypes].every((type) => evidencedTypes.has(type));
}

function emptyMetrics(detail: string): SupabaseMetrics {
  return {
    status: providerStatus('supabase', 'error', detail), activeClubs: 0, verifiedClubs: 0,
    evidenceFreshness: { cutoffDays: EVIDENCE_FRESH_DAYS, withAnyCurrentEvidence: 0, withFreshStrongEvidence: 0, withFreshStatus: 0, withFreshType: 0, withFreshLocation: 0, withFreshFullTriplet: 0 },
    pendingSubmissions: 0, staleSubmissions: 0,
    submissionBacklogByKind: { ownerClaim: 0, newClub: 0, correction: 0 },
    completeness: { total: 0, missingImage: 0, missingPhone: 0, missingSocial: 0, missingCoordinates: 0, missingType: 0 },
    qualityBacklog: [],
    evidenceFreshness: { currentAny: 0, strongAny: 0, status: 0, type: 0, location: 0, fullTriplet: 0, backlog: [] },
    firstPartyIntent: { available: false, detail: 'First-party intent datası əlçatan deyil.', events: 0, browserVisitors: 0, phoneClicks: 0, instagramClicks: 0, mapsClicks: 0, whatsappBookingClicks: 0 },
  };
}

function buildQualityBacklog(
  clubs: ClubQualityRow[],
  imageIds: Set<string>,
  typeIds: Set<string>,
  assignedTypesByClub: Map<string, Set<'pc' | 'playstation'>>,
  evidenceRows: EvidenceRow[],
): ClubDataQualityRow[] {
  const latestEvidence = new Map<string, string>();
  const freshStrongGroups = new Map<string, Set<'status' | 'location'>>();
  const freshStrongTypes = new Map<string, Set<'pc' | 'playstation'>>();
  const staleCutoffMs = Date.now() - EVIDENCE_FRESH_DAYS * 24 * 60 * 60 * 1000;

  for (const evidence of evidenceRows) {
    if (!evidence.is_current) continue;
    const current = latestEvidence.get(evidence.club_id);
    if (!current || evidence.checked_at > current) latestEvidence.set(evidence.club_id, evidence.checked_at);

    const checkedAtMs = Date.parse(evidence.checked_at);
    const group = evidenceGroup(evidence.field_name);
    if (
      group
      && Number.isFinite(checkedAtMs)
      && checkedAtMs >= staleCutoffMs
      && STRONG_EVIDENCE_CONFIDENCE.has(evidence.confidence)
    ) {
      if (group === 'type') {
        const coveredTypes = freshStrongTypes.get(evidence.club_id) ?? new Set<'pc' | 'playstation'>();
        for (const type of evidencedClubTypes(evidence.evidence_value)) coveredTypes.add(type);
        freshStrongTypes.set(evidence.club_id, coveredTypes);
      } else {
        const groups = freshStrongGroups.get(evidence.club_id) ?? new Set<'status' | 'location'>();
        groups.add(group);
        freshStrongGroups.set(evidence.club_id, groups);
      }
    }
  }

  return clubs.map((club) => {
    const missingFields: ClubDataQualityRow['missingFields'] = [];
    if (!club.profile_image_url && !imageIds.has(club.id)) missingFields.push('image');
    if (!club.phone?.trim()) missingFields.push('phone');
    if (!club.instagram_url?.trim() && !club.tiktok_url?.trim()) missingFields.push('social');
    if (club.latitude == null || club.longitude == null) missingFields.push('coordinates');
    if (!typeIds.has(club.id)) missingFields.push('type');

    const lastEvidenceCheckedAt = latestEvidence.get(club.id) ?? null;
    const checkedAtMs = lastEvidenceCheckedAt ? Date.parse(lastEvidenceCheckedAt) : Number.NaN;
    const evidenceState: ClubDataQualityRow['evidenceState'] = !lastEvidenceCheckedAt
      ? 'missing'
      : Number.isFinite(checkedAtMs) && checkedAtMs < staleCutoffMs
        ? 'stale'
        : 'fresh';
    const strongGroups = freshStrongGroups.get(club.id) ?? new Set<'status' | 'location'>();
    const assignedTypes = assignedTypesByClub.get(club.id) ?? new Set<'pc' | 'playstation'>();
    const coveredTypes = freshStrongTypes.get(club.id) ?? new Set<'pc' | 'playstation'>();
    const evidenceGaps: ClubDataQualityRow['evidenceGaps'] = [];
    if (!strongGroups.has('status')) evidenceGaps.push('status');
    if (!typeEvidenceComplete(assignedTypes, coveredTypes)) evidenceGaps.push('type');
    if (!strongGroups.has('location')) evidenceGaps.push('location');

    return {
      slug: club.slug,
      name: club.name,
      completenessScore: Math.max(0, 100 - missingFields.length * 20),
      missingFields,
      lastEvidenceCheckedAt,
      evidenceState,
      evidenceGaps,
    };
  }).filter((club) => club.missingFields.length > 0 || club.evidenceState !== 'fresh' || club.evidenceGaps.length > 0)
    .sort((a, b) => {
      if (a.completenessScore !== b.completenessScore) return a.completenessScore - b.completenessScore;
      if (a.evidenceState !== b.evidenceState) return a.evidenceState === 'missing' ? -1 : b.evidenceState === 'missing' ? 1 : 0;
      return a.name.localeCompare(b.name, 'az');
    });
}

function buildEvidenceFreshness(clubs: ClubQualityRow[], evidenceRows: EvidenceRow[]): SupabaseMetrics['evidenceFreshness'] {
  const freshCutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const byClub = new Map<string, EvidenceRow[]>();
  for (const evidence of evidenceRows) {
    if (!evidence.is_current) continue;
    const rows = byClub.get(evidence.club_id) ?? [];
    rows.push(evidence);
    byClub.set(evidence.club_id, rows);
  }

  let currentAny = 0;
  let strongAny = 0;
  let status = 0;
  let type = 0;
  let location = 0;
  let fullTriplet = 0;

  const backlog = clubs.map((club) => {
    const rows = byClub.get(club.id) ?? [];
    if (rows.length > 0) currentAny += 1;

    const freshStrong = rows.filter((row) => {
      const checkedAtMs = Date.parse(row.checked_at);
      return Number.isFinite(checkedAtMs)
        && checkedAtMs >= freshCutoffMs
        && (row.confidence === 'official' || row.confidence === 'corroborated');
    });
    if (freshStrong.length > 0) strongAny += 1;

    const hasStatus = freshStrong.some((row) => row.field_name === 'status');
    const hasType = freshStrong.some((row) => row.field_name === 'type');
    const hasLocation = freshStrong.some((row) => row.field_name === 'address' || row.field_name === 'coordinates');

    if (hasStatus) status += 1;
    if (hasType) type += 1;
    if (hasLocation) location += 1;
    if (hasStatus && hasType && hasLocation) fullTriplet += 1;

    const missingEvidence: Array<'status' | 'type' | 'location'> = [];
    if (!hasStatus) missingEvidence.push('status');
    if (!hasType) missingEvidence.push('type');
    if (!hasLocation) missingEvidence.push('location');

    const lastEvidenceCheckedAt = rows.reduce<string | null>((latest, row) => (
      !latest || row.checked_at > latest ? row.checked_at : latest
    ), null);

    return {
      slug: club.slug,
      name: club.name,
      isVerified: club.is_verified,
      lastEvidenceCheckedAt,
      missingEvidence,
    };
  }).filter((club) => club.missingEvidence.length > 0)
    .sort((a, b) => {
      if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
      if (a.missingEvidence.length !== b.missingEvidence.length) return b.missingEvidence.length - a.missingEvidence.length;
      if (a.lastEvidenceCheckedAt !== b.lastEvidenceCheckedAt) {
        if (!a.lastEvidenceCheckedAt) return -1;
        if (!b.lastEvidenceCheckedAt) return 1;
        return a.lastEvidenceCheckedAt.localeCompare(b.lastEvidenceCheckedAt);
      }
      return a.name.localeCompare(b.name, 'az');
    });

  return { currentAny, strongAny, status, type, location, fullTriplet, backlog };
}

export async function getSupabaseMetrics(supabase: SupabaseClient<Database>, range: DateRange): Promise<SupabaseMetrics> {
  const staleCutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const [clubsResult, verifiedResult, pendingResult, staleResult, ownerClaimPendingResult, newClubPendingResult, correctionPendingResult, imagesResult, typesResult, evidenceResult, intentResult] = await Promise.all([
    supabase.from('clubs').select('id,name,slug,phone,instagram_url,tiktok_url,profile_image_url,latitude,longitude,is_verified').eq('is_active', true),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_verified', true),
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']).lt('created_at', staleCutoff),
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']).eq('kind', 'owner_claim'),
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']).eq('kind', 'new_club'),
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']).eq('kind', 'correction'),
    supabase.from('club_images').select('club_id'),
    supabase.from('club_type_assignments').select('club_id,club_type:club_types(slug)'),
    supabase.from('club_data_evidence').select('club_id,field_name,evidence_value,confidence,is_current,checked_at').eq('is_current', true),
    supabase.from('analytics_events')
      .select('session_id,event_type')
      .gte('created_at', range.from)
      .lt('created_at', range.to)
      .in('event_type', ['phone_click', 'instagram_click', 'maps_click', 'whatsapp_booking_click'])
      .limit(10000),
  ]);
  const error = clubsResult.error || verifiedResult.error || pendingResult.error || staleResult.error || ownerClaimPendingResult.error || newClubPendingResult.error || correctionPendingResult.error || imagesResult.error || typesResult.error || evidenceResult.error;
  if (error) return emptyMetrics('Supabase əməliyyat datası oxunmadı.');

  const clubs = (clubsResult.data ?? []) as ClubQualityRow[];
  const imageIds = new Set((imagesResult.data ?? []).map((row) => row.club_id));
  const typeRows = (typesResult.data ?? []) as unknown as TypeAssignmentRow[];
  const typeIds = new Set(typeRows.map((row) => row.club_id));
  const assignedTypesByClub = new Map<string, Set<'pc' | 'playstation'>>();
  for (const row of typeRows) {
    const slug = row.club_type?.slug;
    if (slug !== 'pc' && slug !== 'playstation') continue;
    const types = assignedTypesByClub.get(row.club_id) ?? new Set<'pc' | 'playstation'>();
    types.add(slug);
    assignedTypesByClub.set(row.club_id, types);
  }
  const evidenceRows = (evidenceResult.data ?? []) as EvidenceRow[];
  const intentRows = intentResult.error ? [] : (intentResult.data ?? []);
  const activeClubIds = new Set(clubs.map((club) => club.id));
  const freshCutoffMs = Date.now() - EVIDENCE_FRESH_DAYS * 24 * 60 * 60 * 1000;
  const currentEvidenceClubIds = new Set<string>();
  const freshStrongByClub = new Map<string, Set<'status' | 'location'>>();
  const freshStrongTypesByClub = new Map<string, Set<'pc' | 'playstation'>>();
  for (const evidence of evidenceRows) {
    if (!activeClubIds.has(evidence.club_id) || !evidence.is_current) continue;
    currentEvidenceClubIds.add(evidence.club_id);
    const checkedAtMs = Date.parse(evidence.checked_at);
    const group = evidenceGroup(evidence.field_name);
    if (
      group
      && Number.isFinite(checkedAtMs)
      && checkedAtMs >= freshCutoffMs
      && STRONG_EVIDENCE_CONFIDENCE.has(evidence.confidence)
    ) {
      if (group === 'type') {
        const coveredTypes = freshStrongTypesByClub.get(evidence.club_id) ?? new Set<'pc' | 'playstation'>();
        for (const type of evidencedClubTypes(evidence.evidence_value)) coveredTypes.add(type);
        freshStrongTypesByClub.set(evidence.club_id, coveredTypes);
      } else {
        const groups = freshStrongByClub.get(evidence.club_id) ?? new Set<'status' | 'location'>();
        groups.add(group);
        freshStrongByClub.set(evidence.club_id, groups);
      }
    }
  }
  const withFreshStatus = clubs.filter((club) => freshStrongByClub.get(club.id)?.has('status')).length;
  const withFreshType = clubs.filter((club) =>
    typeEvidenceComplete(
      assignedTypesByClub.get(club.id) ?? new Set<'pc' | 'playstation'>(),
      freshStrongTypesByClub.get(club.id) ?? new Set<'pc' | 'playstation'>(),
    )
  ).length;
  const withFreshLocation = clubs.filter((club) => freshStrongByClub.get(club.id)?.has('location')).length;
  const withFreshFullTriplet = clubs.filter((club) =>
    freshStrongByClub.get(club.id)?.has('status')
    && freshStrongByClub.get(club.id)?.has('location')
    && typeEvidenceComplete(
      assignedTypesByClub.get(club.id) ?? new Set<'pc' | 'playstation'>(),
      freshStrongTypesByClub.get(club.id) ?? new Set<'pc' | 'playstation'>(),
    )
  ).length;
  const withFreshStrongEvidence = new Set([
    ...freshStrongByClub.keys(),
    ...freshStrongTypesByClub.keys(),
  ]).size;
  const firstPartyIntent = intentResult.error
    ? { available: false, detail: 'First-party analytics_events oxunmadı.', events: 0, browserVisitors: 0, phoneClicks: 0, instagramClicks: 0, mapsClicks: 0, whatsappBookingClicks: 0 }
    : {
        available: true,
        detail: 'Supabase analytics_events · raw first-party browser visitor ID; PostHog session/person və bot modeli ilə eyni vahid deyil.',
        events: intentRows.length,
        browserVisitors: new Set(intentRows.map((row) => row.session_id)).size,
        phoneClicks: intentRows.filter((row) => row.event_type === 'phone_click').length,
        instagramClicks: intentRows.filter((row) => row.event_type === 'instagram_click').length,
        mapsClicks: intentRows.filter((row) => row.event_type === 'maps_click').length,
        whatsappBookingClicks: intentRows.filter((row) => row.event_type === 'whatsapp_booking_click').length,
      };
  return {
    status: providerStatus('supabase', 'ready', 'Real klub, evidence və müraciət datası admin RLS sərhədindən oxundu.'),
    activeClubs: clubs.length,
    verifiedClubs: verifiedResult.count ?? 0,
    evidenceFreshness: {
      cutoffDays: EVIDENCE_FRESH_DAYS,
      withAnyCurrentEvidence: currentEvidenceClubIds.size,
      withFreshStrongEvidence,
      withFreshStatus,
      withFreshType,
      withFreshLocation,
      withFreshFullTriplet,
    },
    pendingSubmissions: pendingResult.count ?? 0,
    staleSubmissions: staleResult.count ?? 0,
    submissionBacklogByKind: { ownerClaim: ownerClaimPendingResult.count ?? 0, newClub: newClubPendingResult.count ?? 0, correction: correctionPendingResult.count ?? 0 },
    completeness: calculateCompleteness(clubs, imageIds, typeIds),
    qualityBacklog: buildQualityBacklog(clubs, imageIds, typeIds, assignedTypesByClub, evidenceRows),
    evidenceFreshness: buildEvidenceFreshness(clubs, evidenceRows),
    firstPartyIntent,
  };
}