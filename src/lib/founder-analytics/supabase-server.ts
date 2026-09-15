import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { providerStatus } from './providers';
import { calculateCompleteness } from './normalization';
import type { Database } from '@/types/database';
import type { ClubDataQualityRow, SupabaseMetrics } from './types';

type ClubQualityRow = Pick<Database['public']['Tables']['clubs']['Row'], 'id' | 'name' | 'slug' | 'phone' | 'instagram_url' | 'profile_image_url' | 'latitude' | 'longitude'>;
type EvidenceRow = Pick<Database['public']['Tables']['club_data_evidence']['Row'], 'club_id' | 'checked_at'>;

function emptyMetrics(detail: string): SupabaseMetrics {
  return {
    status: providerStatus('supabase', 'error', detail), activeClubs: 0, verifiedClubs: 0,
    pendingSubmissions: 0, staleSubmissions: 0,
    completeness: { total: 0, missingImage: 0, missingPhone: 0, missingInstagram: 0, missingCoordinates: 0, missingType: 0 },
    qualityBacklog: [],
  };
}

function buildQualityBacklog(
  clubs: ClubQualityRow[],
  imageIds: Set<string>,
  typeIds: Set<string>,
  evidenceRows: EvidenceRow[],
): ClubDataQualityRow[] {
  const latestEvidence = new Map<string, string>();
  for (const evidence of evidenceRows) {
    const current = latestEvidence.get(evidence.club_id);
    if (!current || evidence.checked_at > current) latestEvidence.set(evidence.club_id, evidence.checked_at);
  }
  const staleCutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return clubs.map((club) => {
    const missingFields: ClubDataQualityRow['missingFields'] = [];
    if (!club.profile_image_url && !imageIds.has(club.id)) missingFields.push('image');
    if (!club.phone?.trim()) missingFields.push('phone');
    if (!club.instagram_url?.trim()) missingFields.push('instagram');
    if (club.latitude == null || club.longitude == null) missingFields.push('coordinates');
    if (!typeIds.has(club.id)) missingFields.push('type');

    const lastEvidenceCheckedAt = latestEvidence.get(club.id) ?? null;
    const checkedAtMs = lastEvidenceCheckedAt ? Date.parse(lastEvidenceCheckedAt) : Number.NaN;
    const evidenceState: ClubDataQualityRow['evidenceState'] = !lastEvidenceCheckedAt
      ? 'missing'
      : Number.isFinite(checkedAtMs) && checkedAtMs < staleCutoffMs
        ? 'stale'
        : 'fresh';

    return {
      slug: club.slug,
      name: club.name,
      completenessScore: Math.max(0, 100 - missingFields.length * 20),
      missingFields,
      lastEvidenceCheckedAt,
      evidenceState,
    };
  }).filter((club) => club.missingFields.length > 0 || club.evidenceState !== 'fresh')
    .sort((a, b) => {
      if (a.completenessScore !== b.completenessScore) return a.completenessScore - b.completenessScore;
      if (a.evidenceState !== b.evidenceState) return a.evidenceState === 'missing' ? -1 : b.evidenceState === 'missing' ? 1 : 0;
      return a.name.localeCompare(b.name, 'az');
    });
}

export async function getSupabaseMetrics(supabase: SupabaseClient<Database>): Promise<SupabaseMetrics> {
  const staleCutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const [clubsResult, verifiedResult, pendingResult, staleResult, imagesResult, typesResult, evidenceResult] = await Promise.all([
    supabase.from('clubs').select('id,name,slug,phone,instagram_url,profile_image_url,latitude,longitude').eq('is_active', true),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_verified', true),
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']).lt('created_at', staleCutoff),
    supabase.from('club_images').select('club_id'),
    supabase.from('club_type_assignments').select('club_id'),
    supabase.from('club_data_evidence').select('club_id,checked_at').eq('is_current', true),
  ]);
  const error = clubsResult.error || verifiedResult.error || pendingResult.error || staleResult.error || imagesResult.error || typesResult.error || evidenceResult.error;
  if (error) return emptyMetrics('Supabase əməliyyat datası oxunmadı.');

  const clubs = (clubsResult.data ?? []) as ClubQualityRow[];
  const imageIds = new Set((imagesResult.data ?? []).map((row) => row.club_id));
  const typeIds = new Set((typesResult.data ?? []).map((row) => row.club_id));
  const evidenceRows = (evidenceResult.data ?? []) as EvidenceRow[];
  return {
    status: providerStatus('supabase', 'ready', 'Real klub, evidence və müraciət datası admin RLS sərhədindən oxundu.'),
    activeClubs: clubs.length,
    verifiedClubs: verifiedResult.count ?? 0,
    pendingSubmissions: pendingResult.count ?? 0,
    staleSubmissions: staleResult.count ?? 0,
    completeness: calculateCompleteness(clubs, imageIds, typeIds),
    qualityBacklog: buildQualityBacklog(clubs, imageIds, typeIds, evidenceRows),
  };
}