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

async function readPublicRows<T>(query: string): Promise<T[]> {
  if (!emergencyNeonCatalogEnabled()) throw new Error('Emergency read unavailable.');
  const connectionString = process.env.GAMEYER_NEON_CATALOG_DATABASE_URL!;
  const url = new URL(connectionString);
  if (!url.hostname.endsWith('.neon.tech')) throw new Error('Unexpected catalog host.');
  const response = await fetch(`https://${url.hostname}/sql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Neon-Connection-String': connectionString },
    body: JSON.stringify({ query, params: [] }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Emergency catalog read status ${response.status}.`);
  const payload = await response.json() as { rows?: unknown[][] };
  if (!Array.isArray(payload.rows)) throw new Error('Invalid emergency catalog rows.');
  return payload.rows.map(row => row[0] as T);
}
