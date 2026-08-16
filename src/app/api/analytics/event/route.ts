import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SESSION_RE = /^[A-Za-z0-9_-]{8,64}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EVENT_TYPES = new Set(['maps_click', 'phone_click', 'instagram_click']);

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
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 1024) return NextResponse.json({ ok: false }, { status: 413 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body || typeof body !== 'object') return NextResponse.json({ ok: false }, { status: 400 });

  const { sessionId, path, eventType, clubSlug } = body as Record<string, unknown>;
  if (
    typeof sessionId !== 'string' || !SESSION_RE.test(sessionId) ||
    typeof path !== 'string' || path.length < 1 || path.length > 300 || !path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api') ||
    typeof eventType !== 'string' || !EVENT_TYPES.has(eventType) ||
    typeof clubSlug !== 'string' || !SLUG_RE.test(clubSlug)
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('analytics_events').insert({
    session_id: sessionId,
    path,
    event_type: eventType,
    club_slug: clubSlug,
  });

  if (error) {
    console.error('analytics event insert failed:', error.message);
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
