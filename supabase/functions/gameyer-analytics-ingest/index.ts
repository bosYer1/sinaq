/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Supabase Edge Function runs on Deno; Next.js CI typechecks the Node app separately.
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@6.1.0';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const VERCEL_ISSUER = 'https://oidc.vercel.com/gameyer';
const VERCEL_AUDIENCE = 'https://vercel.com/gameyer';
const VERCEL_SUBJECT = 'owner:gameyer:project:gameyer:environment:production';
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?::\d{1,5})?$/i;
const EVENT_TYPES = new Set(['maps_click', 'phone_click', 'instagram_click', 'club_correction_click']);

let jwksPromise: Promise<ReturnType<typeof createRemoteJWKSet>> | null = null;

async function vercelJwks() {
  if (!jwksPromise) {
    jwksPromise = (async () => {
      const response = await fetch(`${VERCEL_ISSUER}/.well-known/openid-configuration`, {
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`OIDC discovery failed: ${response.status}`);
      const discovery = await response.json() as { jwks_uri?: unknown };
      if (typeof discovery.jwks_uri !== 'string') throw new Error('OIDC discovery missing jwks_uri');
      return createRemoteJWKSet(new URL(discovery.jwks_uri));
    })();
  }
  return jwksPromise;
}

async function verifyVercelProductionToken(token: string) {
  const jwks = await vercelJwks();
  await jwtVerify(token, jwks, {
    issuer: VERCEL_ISSUER,
    audience: VERCEL_AUDIENCE,
    subject: VERCEL_SUBJECT,
  });
}

function secretKey() {
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (serviceRole) return serviceRole;

  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) {
    try {
      const parsed = JSON.parse(modern) as Record<string, unknown>;
      const preferred = parsed.default;
      if (typeof preferred === 'string' && preferred.startsWith('sb_secret_')) return preferred;
      for (const value of Object.values(parsed)) {
        if (typeof value === 'string' && value.startsWith('sb_secret_')) return value;
      }
    } catch {
      // No usable modern secret was found.
    }
  }
  return null;
}

function validVisit(row: Record<string, unknown>) {
  return typeof row.session_id === 'string' && ID_RE.test(row.session_id)
    && (row.visit_id === null || (typeof row.visit_id === 'string' && ID_RE.test(row.visit_id)))
    && typeof row.path === 'string' && row.path.length >= 1 && row.path.length <= 300
    && row.path.startsWith('/') && !row.path.startsWith('/admin') && !row.path.startsWith('/api')
    && (row.referrer_host === null || (typeof row.referrer_host === 'string' && row.referrer_host.length <= 255 && HOST_RE.test(row.referrer_host)))
    && (row.user_agent === null || (typeof row.user_agent === 'string' && row.user_agent.length <= 500));
}

function validEvent(row: Record<string, unknown>) {
  return typeof row.session_id === 'string' && ID_RE.test(row.session_id)
    && typeof row.path === 'string' && row.path.length >= 7 && row.path.length <= 300
    && typeof row.event_type === 'string' && EVENT_TYPES.has(row.event_type)
    && typeof row.club_slug === 'string' && row.club_slug.length <= 120 && SLUG_RE.test(row.club_slug)
    && row.path === `/klub/${row.club_slug}`;
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });

  const token = request.headers.get('x-gameyer-vercel-oidc')?.trim();
  if (!token) return Response.json({ ok: false }, { status: 401 });

  try {
    await verifyVercelProductionToken(token);
  } catch (error) {
    console.error('analytics oidc verification failed', error instanceof Error ? error.message : 'unknown');
    return Response.json({ ok: false }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') return Response.json({ ok: false }, { status: 400 });
  const { kind, row } = payload as { kind?: unknown; row?: unknown };
  if (!row || typeof row !== 'object') return Response.json({ ok: false }, { status: 400 });

  const table = kind === 'visit' && validVisit(row as Record<string, unknown>)
    ? 'page_views'
    : kind === 'event' && validEvent(row as Record<string, unknown>)
      ? 'analytics_events'
      : null;
  if (!table) return Response.json({ ok: false }, { status: 400 });

  const url = Deno.env.get('SUPABASE_URL');
  const secret = secretKey();
  if (!url || !secret) {
    console.error('analytics ingest missing server credential');
    return Response.json({ ok: false }, { status: 503 });
  }

  const client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await client.from(table).insert(row);
  if (error) {
    console.error('analytics ingest insert failed', error.message);
    return Response.json({ ok: false }, { status: 500 });
  }

  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store' },
  });
});
