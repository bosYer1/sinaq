/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Supabase Edge Function runs on Deno; Next.js CI typechecks the Node app separately.
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@6.1.0';

const VERCEL_ISSUER = 'https://oidc.vercel.com/gameyer';
const VERCEL_AUDIENCE = 'https://vercel.com/gameyer';
const VERCEL_SUBJECT = 'owner:gameyer:project:gameyer:environment:production';

const ALLOWED_PATHS = new Set([
  '/rest/v1/clubs',
  '/rest/v1/districts',
  '/rest/v1/club_types',
  '/rest/v1/club_updates',
]);

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
      // Fall through to legacy key.
    }
  }

  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return serviceRole || null;
}

type ProxyPayload = {
  url?: unknown;
  method?: unknown;
  headers?: unknown;
};

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });

  const token = request.headers.get('x-gameyer-vercel-oidc')?.trim();
  if (!token) return Response.json({ ok: false }, { status: 401 });

  try {
    await verifyVercelProductionToken(token);
  } catch (error) {
    console.error('public data proxy oidc verification failed', error instanceof Error ? error.message : 'unknown');
    return Response.json({ ok: false }, { status: 401 });
  }

  let payload: ProxyPayload;
  try {
    payload = await request.json() as ProxyPayload;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (typeof payload.url !== 'string' || typeof payload.method !== 'string') {
    return Response.json({ ok: false }, { status: 400 });
  }

  const method = payload.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    return Response.json({ ok: false }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const secret = secretKey();
  if (!supabaseUrl || !secret) {
    console.error('public data proxy missing server credential');
    return Response.json({ ok: false }, { status: 503 });
  }

  let target: URL;
  try {
    target = new URL(payload.url);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const expectedOrigin = new URL(supabaseUrl).origin;
  if (target.origin !== expectedOrigin || !ALLOWED_PATHS.has(target.pathname)) {
    return Response.json({ ok: false }, { status: 403 });
  }

  const incomingHeaders = payload.headers && typeof payload.headers === 'object'
    ? payload.headers as Record<string, unknown>
    : {};
  const upstreamHeaders = new Headers();
  for (const name of ['accept', 'accept-profile', 'content-type', 'prefer', 'range', 'range-unit']) {
    const value = incomingHeaders[name];
    if (typeof value === 'string' && value.length <= 1024) upstreamHeaders.set(name, value);
  }
  upstreamHeaders.set('apikey', secret);
  if (secret.startsWith('eyJ')) upstreamHeaders.set('authorization', `Bearer ${secret}`);

  const upstream = await fetch(target, {
    method,
    headers: upstreamHeaders,
    redirect: 'error',
  });

  const responseHeaders = new Headers({ 'cache-control': 'no-store' });
  for (const name of ['content-type', 'content-range', 'preference-applied']) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  if (method === 'HEAD') {
    return new Response(null, { status: upstream.status, headers: responseHeaders });
  }

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
});
