import { NextResponse } from 'next/server';
import { guardPublicPost, readJsonBodyLimited } from '@/lib/security/publicRequestGuard';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 12_000;

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

export async function POST(request: Request) {
  const guard = guardPublicPost(request, {
    keyPrefix: 'client-error',
    limit: 12,
    windowMs: 60_000,
    maxBodyBytes: MAX_BODY_BYTES,
    requireJson: true,
  });

  if (!guard.ok) {
    return jsonResponse(
      { ok: false },
      guard.status,
      guard.status === 429 ? { 'Retry-After': String(guard.retryAfter) } : undefined,
    );
  }

  const parsed = await readJsonBodyLimited(request, MAX_BODY_BYTES);
  if (!parsed.ok) return jsonResponse({ ok: false }, parsed.status);
  if (!parsed.data || typeof parsed.data !== 'object') return jsonResponse({ ok: false }, 400);

  const body = parsed.data as Record<string, unknown>;
  const payload = {
    message: clean(body.message, 1000),
    stack: clean(body.stack, 4000),
    digest: clean(body.digest, 200),
    path: clean(body.path, 500),
  };

  if (payload.message) {
    console.error('GAMEYER_CLIENT_ERROR', JSON.stringify(payload));
  }

  return jsonResponse({ ok: true });
}
