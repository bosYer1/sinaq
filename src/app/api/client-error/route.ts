import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 12_000;

function clean(value: unknown, max = 2000) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, max)
    : '';
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
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
      userAgent: clean(body.userAgent, 500),
    };

    if (payload.message) {
      console.error('GAMEYER_CLIENT_ERROR', JSON.stringify(payload));
    }
  } catch {
    return jsonResponse({ ok: false }, 400);
  }

  return jsonResponse({ ok: true });
}
