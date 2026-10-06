import { NextResponse } from 'next/server';
import { guardPublicPost, readJsonBodyLimited } from '@/lib/security/publicRequestGuard';
import {
  buildMetaCapiServerEvent,
  normalizeMetaCapiPixelId,
  normalizeMetaGraphApiVersion,
  sanitizeMetaCapiInput,
} from '@/lib/meta-capi';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 2048;
const DEFAULT_GRAPH_API_VERSION = 'v26.0';

export async function POST(request: Request) {
  const guard = guardPublicPost(request, {
    keyPrefix: 'meta-capi',
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

  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const pixelId = normalizeMetaCapiPixelId(
    process.env.META_CAPI_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID,
  );
  if (!accessToken || !pixelId) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'cache-control': 'no-store',
        'x-gameyer-meta-capi': 'disabled',
      },
    });
  }

  const parsed = await readJsonBodyLimited(request, MAX_BODY_BYTES);
  if (!parsed.ok) return NextResponse.json({ ok: false }, { status: parsed.status });

  const input = sanitizeMetaCapiInput(parsed.data);
  if (!input) return NextResponse.json({ ok: false }, { status: 400 });

  const userAgent = request.headers.get('user-agent')?.trim();
  if (!userAgent) return NextResponse.json({ ok: false }, { status: 400 });

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://gameyer.az';
  const apiVersion =
    normalizeMetaGraphApiVersion(process.env.META_GRAPH_API_VERSION) ||
    DEFAULT_GRAPH_API_VERSION;

  let serverEvent;
  try {
    serverEvent = buildMetaCapiServerEvent(input, siteOrigin, userAgent);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const endpoint = new URL(
    `https://graph.facebook.com/${apiVersion}/${pixelId}/events`,
  );
  endpoint.searchParams.set('access_token', accessToken);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: [serverEvent] }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('meta capi delivery failed', {
        status: response.status,
        eventName: input.name,
      });
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  } catch {
    console.error('meta capi delivery failed', {
      status: 'network_error',
      eventName: input.name,
    });
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'cache-control': 'no-store',
      'x-gameyer-meta-capi': 'delivered',
    },
  });
}
