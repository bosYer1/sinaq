import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { guardPublicPost } from '@/lib/security/publicRequestGuard';

export const dynamic = 'force-dynamic';

const SESSION_RE = /^[A-Za-z0-9_-]{8,64}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EVENT_TYPES = new Set(['maps_click', 'phone_click', 'instagram_click']);

type AnalyticsInsertClient = {
  from: (table: 'analytics_events') => {
    insert: (row: { session_id: string; path: string; event_type: string; club_slug: string }) => PromiseLike<{ error: { message: string } | null }>;
  };
};

type AdminRpcClient = {
  rpc: (fn: 'is_admin') => PromiseLike<{ data: boolean | null; error: { message: string } | null }>;
};

export async function POST(request: Request) {
  const guard = guardPublicPost(request, {
    keyPrefix: 'analytics-event',
    limit: 60,
    windowMs: 5 * 60_000,
    maxBodyBytes: 1024,
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

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ ok: false }, { status: 400 });

  const { sessionId, path, eventType, clubSlug } = body as Record<string, unknown>;
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

  const analytics = supabase as unknown as AnalyticsInsertClient;
  const { error } = await analytics.from('analytics_events').insert({ session_id: sessionId, path, event_type: eventType, club_slug: clubSlug });

  if (error) {
    console.error('analytics event insert failed:', error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return new NextResponse(null, { status: 204, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } });
}
