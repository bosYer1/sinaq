import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SESSION_RE = /^[A-Za-z0-9_-]{8,64}$/;
const HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?::\d{1,5})?$/i;

function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 1024) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { sessionId, path, referrerHost } = body as {
    sessionId?: unknown;
    path?: unknown;
    referrerHost?: unknown;
  };

  if (
    typeof sessionId !== 'string' ||
    !SESSION_RE.test(sessionId) ||
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
  const { error } = await supabase.from('page_views').insert({
    session_id: sessionId,
    path,
    referrer_host: cleanReferrer,
  });

  if (error) {
    console.error('analytics page view insert failed:', error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
