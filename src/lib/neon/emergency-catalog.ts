import 'server-only';
import type { ClubWithRelations, District, ClubType } from '@/types/database';
import { unstable_cache } from 'next/cache';
import { inferClubTypeSlugs } from '@/lib/clubType';

/** Temporary read-only recovery source review deadline. */
export const EMERGENCY_NEON_REVIEW_DATE = '2026-10-19';

export function temporaryCatalogConfigured(): boolean {
  return process.env.GAMEYER_NEON_EMERGENCY_READS === '1';
}

export function emergencyNeonCatalogEnabled(): boolean {
  return temporaryCatalogConfigured() && Boolean(process.env.GAMEYER_NEON_CATALOG_DATABASE_URL);
}
