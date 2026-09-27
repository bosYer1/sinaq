/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Supabase Edge Function runs on Deno; Next.js CI typechecks the Node app separately.
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@6.1.0';

const VERCEL_ISSUER = 'https://oidc.vercel.com/gameyer';
const VERCEL_AUDIENCE = 'https://vercel.com/gameyer';
const VERCEL_SUBJECT = 'owner:gameyer:project:gameyer:environment:production';

const GITHUB_ISSUER = 'https://token.actions.githubusercontent.com';
const GITHUB_AUDIENCE = 'https://gameyer.az/public-data-ci';
const GITHUB_REPOSITORY = 'bosYer1/sinaq';
const GITHUB_REPOSITORY_ID = '1332798813';
const GITHUB_TRUSTED_ACTOR_ID = '315903980';
const GITHUB_ALLOWED_EVENTS = new Set(['push', 'pull_request']);
const GITHUB_ALLOWED_WORKFLOW_PREFIXES = [
  'bosYer1/sinaq/.github/workflows/ci.yml@',
  'bosYer1/sinaq/.github/workflows/responsive.yml@',
];

const ALLOWED_PATHS = new Set([
  '/rest/v1/clubs',
  '/rest/v1/districts',
  '/rest/v1/club_types',
  '/rest/v1/club_updates',
]);

let vercelJwksPromise: Promise<ReturnType<typeof createRemoteJWKSet>> | null = null;
let githubJwksPromise: Promise<ReturnType<typeof createRemoteJWKSet>> | null = null;

async function remoteJwks(
  issuer: string,
  current: Promise<ReturnType<typeof createRemoteJWKSet>> | null,
  assign: (value: Promise<ReturnType<typeof createRemoteJWKSet>>) => void,
) {
  if (current) return current;

  const promise = (async () => {
    const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`OIDC discovery failed: ${response.status}`);
    const discovery = await response.json() as { jwks_uri?: unknown };
    if (typeof discovery.jwks_uri !== 'string') throw new Error('OIDC discovery missing jwks_uri');
    return createRemoteJWKSet(new URL(discovery.jwks_uri));
  })();

  assign(promise);
  return promise;
}

async function vercelJwks() {
  return remoteJwks(VERCEL_ISSUER, vercelJwksPromise, (value) => {
    vercelJwksPromise = value;
  });
}

async function githubJwks() {
  return remoteJwks(GITHUB_ISSUER, githubJwksPromise, (value) => {
    githubJwksPromise = value;
  });
}

async function verifyVercelProductionToken(token: string) {
  const jwks = await vercelJwks();
  await jwtVerify(token, jwks, {
    issuer: VERCEL_ISSUER,
    audience: VERCEL_AUDIENCE,
    subject: VERCEL_SUBJECT,
  });
}

async function verifyGitHubActionsToken(token: string) {
  const jwks = await githubJwks();
  const { payload } = await jwtVerify(token, jwks, {
    issuer: GITHUB_ISSUER,
    audience: GITHUB_AUDIENCE,
  });

  const repository = typeof payload.repository === 'string' ? payload.repository : '';
  const repositoryId = typeof payload.repository_id === 'string'
    ? payload.repository_id
    : String(payload.repository_id ?? '');
  const actorId = typeof payload.actor_id === 'string'
    ? payload.actor_id
    : String(payload.actor_id ?? '');
  const runnerEnvironment = typeof payload.runner_environment === 'string'
    ? payload.runner_environment
    : '';
  const eventName = typeof payload.event_name === 'string' ? payload.event_name : '';
  const workflowRef = typeof payload.workflow_ref === 'string' ? payload.workflow_ref : '';
  const ref = typeof payload.ref === 'string' ? payload.ref : '';

  if (repository !== GITHUB_REPOSITORY
    || repositoryId !== GITHUB_REPOSITORY_ID
    || actorId !== GITHUB_TRUSTED_ACTOR_ID
    || runnerEnvironment !== 'github-hosted'
    || !GITHUB_ALLOWED_EVENTS.has(eventName)
    || !GITHUB_ALLOWED_WORKFLOW_PREFIXES.some((prefix) => workflowRef.startsWith(prefix))
  ) {
    throw new Error('GitHub OIDC claims are outside the trusted GameYer CI boundary');
  }

  if (eventName === 'push' && ref !== 'refs/heads/main') {
    throw new Error('GitHub push OIDC is only trusted on main');
  }
  if (eventName === 'pull_request' && !/^refs\/pull\/\d+\/merge$/.test(ref)) {
    throw new Error('GitHub pull_request OIDC ref is invalid');
  }
}

async function authenticateRequest(request: Request) {
  const vercelToken = request.headers.get('x-gameyer-vercel-oidc')?.trim() || '';
  const githubToken = request.headers.get('x-gameyer-github-oidc')?.trim() || '';

  if (Boolean(vercelToken) === Boolean(githubToken)) {
    throw new Error('Exactly one trusted OIDC credential is required');
  }

  if (vercelToken) {
    await verifyVercelProductionToken(vercelToken);
    return 'vercel';
  }

  await verifyGitHubActionsToken(githubToken);
  return 'github-actions';
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

  let authMode: 'vercel' | 'github-actions';
  try {
    authMode = await authenticateRequest(request);
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

  const responseHeaders = new Headers({
    'cache-control': 'no-store',
    'x-gameyer-trusted-source': authMode,
  });
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
