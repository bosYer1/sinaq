import 'server-only';

/** Temporary read-only recovery source review deadline. */
export const EMERGENCY_NEON_REVIEW_DATE = '2026-10-19';

export function temporaryCatalogConfigured(): boolean {
  return process.env.GAMEYER_NEON_EMERGENCY_READS === '1';
}
