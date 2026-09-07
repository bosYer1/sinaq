import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { providerStatus } from './providers';
import { calculateCompleteness } from './normalization';
import type { Database } from '@/types/database';
import type { SupabaseMetrics } from './types';

type ClubQualityRow = Pick<Database['public']['Tables']['clubs']['Row'], 'id' | 'phone' | 'instagram_url' | 'profile_image_url' | 'latitude' | 'longitude'>;

function emptyMetrics(detail: string): SupabaseMetrics {
  return {
    status: providerStatus('supabase', 'error', detail), activeClubs: 0, verifiedClubs: 0,
    pendingSubmissions: 0, staleSubmissions: 0,
    completeness: { total: 0, missingImage: 0, missingPhone: 0, missingInstagram: 0, missingCoordinates: 0, missingType: 0 },
  };
}

export async function getSupabaseMetrics(supabase: SupabaseClient<Database>): Promise<SupabaseMetrics> {
  const staleCutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const [clubsResult, verifiedResult, pendingResult, staleResult, imagesResult, typesResult] = await Promise.all([
    supabase.from('clubs').select('id,phone,instagram_url,profile_image_url,latitude,longitude').eq('is_active', true),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_verified', true),
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    supabase.from('club_submissions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']).lt('created_at', staleCutoff),
    supabase.from('club_images').select('club_id'),
    supabase.from('club_type_assignments').select('club_id'),
  ]);
  const error = clubsResult.error || verifiedResult.error || pendingResult.error || staleResult.error || imagesResult.error || typesResult.error;
  if (error) return emptyMetrics('Supabase əməliyyat datası oxunmadı.');

  const clubs = (clubsResult.data ?? []) as ClubQualityRow[];
  const imageIds = new Set((imagesResult.data ?? []).map((row) => row.club_id));
  const typeIds = new Set((typesResult.data ?? []).map((row) => row.club_id));
  return {
    status: providerStatus('supabase', 'ready', 'Real klub və müraciət datası admin RLS sərhədindən oxundu.'),
    activeClubs: clubs.length,
    verifiedClubs: verifiedResult.count ?? 0,
    pendingSubmissions: pendingResult.count ?? 0,
    staleSubmissions: staleResult.count ?? 0,
    completeness: calculateCompleteness(clubs, imageIds, typeIds),
  };
}
