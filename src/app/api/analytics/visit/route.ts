import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeAnalyticsRecord } from '@/lib/supabase/analytics-server';
import { guardPublicPost, readJsonBodyLimited } from '@/lib/security/publicRequestGuard';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 1024;
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?::\d{1,5})?$/i;

type AdminRpcClient = {
  rpc: (fn: 'is_admin') => PromiseLike<{ data: boolean | null; error: { message: string } | null }>;
};

function userAgent(request: Request) {
  const value = request.headers.get('user-agent')?.trim();
  if (!value) return null;
  return value.slice(0, 500);
}

export async function POST(request: Request) {
  const guard = guardPublicPost(request, {
    keyPrefix: 'analytics-visit',
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

  const { sessionId, visitId, path, referrerHost } = parsed.data as {
    sessionId?: unknown;
    visitId?: unknown;
    path?: unknown;
    referrerHost?: unknown;
  };

  if (
    typeof sessionId !== 'string' ||
    !ID_RE.test(sessionId) ||
    (visitId != null && (typeof visitId !== 'string' || !ID_RE.test(visitId))) ||
    typeof path !== 'string' ||
    path.length < 1 ||
    path.length > 300 ||
    !path.startsWith('/') ||
    path.startsWith('/admin') ||
    path.startsWith('/api') ||
    (referrerHost != null && (
      typeof referrerHost !== 'string' ||
      referrerHost.length > 255 ||
      !HOST_RE.test(referrerHost)
    ))
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const requestHost = new URL(request.url).host;
  const cleanReferrer = typeof referrerHost === 'string' && referrerHost !== requestHost
    ? referrerHost.toLowerCase()
    : null;

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
    kind: 'visit',
    row: {
      session_id: sessionId,
      visit_id: typeof visitId === 'string' ? visitId : null,
      path,
      referrer_host: cleanReferrer,
      user_agent: userAgent(request),
    },
  });

  if (error) {
    console.error('analytics page view insert failed:', error.message);
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
