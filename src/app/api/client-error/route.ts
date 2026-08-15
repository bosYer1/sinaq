import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 12_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;

const rateBuckets = new Map<string, { startedAt: number; count: number }>();

function clean(value: unknown, max = 2000) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, max)
    : '';
}

function jsonResponse(body: Record<string, unknown>, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

function requestKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = requestKey(request);
  const current = rateBuckets.get(key);

  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  if (rateBuckets.size > 500) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (now - bucket.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(bucketKey);
    }
  }

  return current.count > RATE_LIMIT;
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return jsonResponse({ ok: false }, 415);
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false }, 413);
  }

  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return jsonResponse({ ok: false }, 403);
  }

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return jsonResponse({ ok: false }, 403);
      }
    } catch {
      return jsonResponse({ ok: false }, 400);
    }
  }

  if (isRateLimited(request)) {
    return jsonResponse({ ok: false }, 429, { 'Retry-After': '60' });
  }

  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return jsonResponse({ ok: false }, 413);
    }

    const body = JSON.parse(raw) as Record<string, unknown>;
    const payload = {
      message: clean(body.message, 1000),
      stack: clean(body.stack, 4000),
      digest: clean(body.digest, 200),
      path: clean(body.path, 500),
    };

    if (payload.message) {
      console.error('GAMEYER_CLIENT_ERROR', JSON.stringify(payload));
    }
  } catch {
    return jsonResponse({ ok: false }, 400);
  }

  return jsonResponse({ ok: true });
}
