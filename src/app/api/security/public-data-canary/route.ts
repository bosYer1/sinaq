import { NextResponse } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/public-config';
import { requestVercelOidcToken } from '@/lib/supabase/analytics-server';

export const dynamic = 'force-dynamic';

type CanaryClubRow = {
  id: string;
  instagram_url: string | null;
  tiktok_url: string | null;
  type_assignments: Array<{ club_type: { slug: string } | null }>;
};

function isPublicClub(row: CanaryClubRow) {
  const hasSocial = Boolean(row.instagram_url?.trim() || row.tiktok_url?.trim());
  const hasType = (row.type_assignments ?? []).some((assignment) => {
    const slug = assignment.club_type?.slug;
    return slug === 'pc' || slug === 'playstation';
  });
  return hasSocial && hasType;
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== 'production') {
    return json({ ok: false, reason: 'production_only' }, 404);
  }

  const token = requestVercelOidcToken(request);
  if (!token) return json({ ok: false, reason: 'oidc_token_unavailable' }, 503);

  const target = new URL('/rest/v1/clubs', SUPABASE_URL);
  target.searchParams.set(
    'select',
    'id,instagram_url,tiktok_url,type_assignments:club_type_assignments(club_type:club_types(slug))',
  );
  target.searchParams.set('is_active', 'eq.true');
  target.searchParams.set('latitude', 'not.is.null');
  target.searchParams.set('longitude', 'not.is.null');
  target.searchParams.set('limit', '1000');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gameyer-public-data-proxy`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-gameyer-vercel-oidc': token,
        ...(SUPABASE_PUBLISHABLE_KEY ? { apikey: SUPABASE_PUBLISHABLE_KEY } : {}),
      },
      body: JSON.stringify({
        url: target.toString(),
        method: 'GET',
        headers: { accept: 'application/json' },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return json({ ok: false, reason: 'trusted_bridge_failed', status: response.status }, 502);
    }

    const rows = await response.json() as CanaryClubRow[];
    if (!Array.isArray(rows)) return json({ ok: false, reason: 'invalid_bridge_payload' }, 502);

    const publicCount = rows.filter(isPublicClub).length;
    return json({
      ok: publicCount > 0,
      bridge: 'vercel-oidc-edge',
      public_clubs: publicCount,
    }, publicCount > 0 ? 200 : 503);
  } catch (error) {
    console.error('GAMEYER_PUBLIC_DATA_CANARY_ERROR', error instanceof Error ? error.message : 'unknown');
    return json({ ok: false, reason: 'trusted_bridge_exception' }, 502);
  }
}
