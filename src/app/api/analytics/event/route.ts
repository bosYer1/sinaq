import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requestVercelOidcToken, writeAnalyticsRecord } from '@/lib/supabase/analytics-server';
import { guardPublicPost, readJsonBodyLimited } from '@/lib/security/publicRequestGuard';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 1024;
const SESSION_RE = /^[A-Za-z0-9_-]{8,64}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EVENT_TYPES = new Set(['maps_click', 'phone_click', 'instagram_click', 'club_correction_click']);

type AdminRpcClient = {
  rpc: (fn: 'is_admin') => PromiseLike<{ data: boolean | null; error: { message: string } | null }>;
};

export async function POST(request: Request) {
  const guard = guardPublicPost(request, {
    keyPrefix: 'analytics-event',
    limit: 60,
    windowMs: 5 * 60_000,
    maxBodyBytes: MAX_BODY_BYTES,
    requireJson: true,
  });
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false },
      {
        status: guard.status,
        headers: guard.status === 429 ? { 'Retry-After': String(guard.retryAfter) } : undefined,
      },
    );
  }

  const parsed = await readJsonBodyLimited(request, MAX_BODY_BYTES);
  if (!parsed.ok) return NextResponse.json({ ok: false }, { status: parsed.status });
  if (!parsed.data || typeof parsed.data !== 'object') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { sessionId, path, eventType, clubSlug } = parsed.data as Record<string, unknown>;
  if (
    typeof sessionId !== 'string' || !SESSION_RE.test(sessionId) ||
    typeof path !== 'string' || path.length < 7 || path.length > 300 || !path.startsWith('/klub/') ||
    typeof eventType !== 'string' || !EVENT_TYPES.has(eventType) ||
    typeof clubSlug !== 'string' || clubSlug.length > 120 || !SLUG_RE.test(clubSlug) ||
    path !== `/klub/${clubSlug}`
  ) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (authData.user) {
    const adminClient = supabase as unknown as AdminRpcClient;
    const { data: isAdmin } = await adminClient.rpc('is_admin');
    if (isAdmin) {
      return new NextResponse(null, { status: 204, headers: { 'cache-control': 'no-store' } });
    }
  }

  const { error, mode } = await writeAnalyticsRecord({
    kind: 'event',
    row: {
      session_id: sessionId,
      path,
      event_type: eventType,
      club_slug: clubSlug,
    },
  }, requestVercelOidcToken(request));

  if (error) {
    console.error('analytics event insert failed:', error.message);
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'x-gameyer-analytics-write': mode,
    },
  });
}
