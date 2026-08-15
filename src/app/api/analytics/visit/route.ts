import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SESSION_RE = /^[A-Za-z0-9_-]{8,64}$/;

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

  const { sessionId, path } = body as { sessionId?: unknown; path?: unknown };
  if (
    typeof sessionId !== 'string' ||
    !SESSION_RE.test(sessionId) ||
    typeof path !== 'string' ||
    path.length < 1 ||
    path.length > 300 ||
    !path.startsWith('/') ||
    path.startsWith('/admin') ||
    path.startsWith('/api')
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let referrerHost: string | null = null;
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const host = new URL(referer).host;
      if (host && host !== new URL(request.url).host) referrerHost = host.slice(0, 255);
    } catch {
      referrerHost = null;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from('page_views').insert({
    session_id: sessionId,
    path,
    referrer_host: referrerHost,
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
