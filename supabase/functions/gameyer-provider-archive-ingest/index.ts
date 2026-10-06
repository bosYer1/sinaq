/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Supabase Edge Function runs on Deno.
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@6.1.0';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const GITHUB_ISSUER = 'https://token.actions.githubusercontent.com';
const GITHUB_AUDIENCE = 'https://gameyer.az/provider-archive-ci';
const GITHUB_REPOSITORY = 'bosYer1/sinaq';
const GITHUB_REPOSITORY_ID = '1332798813';
const GITHUB_TRUSTED_ACTOR_ID = '315903980';
const GITHUB_WORKFLOW_PREFIX = 'bosYer1/sinaq/.github/workflows/provider-data-archive.yml@';
const ALLOWED_EVENTS = new Set(['schedule', 'workflow_dispatch']);
const PROVIDERS = new Set(['gsc', 'ga4', 'posthog', 'meta']);
const DATASET_RE = /^[a-z0-9_]{1,80}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SNAPSHOTS = 100;
const MAX_PAYLOAD_BYTES = 1_900_000;

let githubJwksPromise: Promise<ReturnType<typeof createRemoteJWKSet>> | null = null;

async function githubJwks() {
  if (githubJwksPromise) return githubJwksPromise;
  githubJwksPromise = (async () => {
    const response = await fetch(`${GITHUB_ISSUER}/.well-known/openid-configuration`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`OIDC discovery failed: ${response.status}`);
    const discovery = await response.json() as { jwks_uri?: unknown };
    if (typeof discovery.jwks_uri !== 'string') throw new Error('OIDC discovery missing jwks_uri');
    return createRemoteJWKSet(new URL(discovery.jwks_uri));
  })();
  return githubJwksPromise;
}

async function verifyGitHubActionsToken(token: string) {
  const { payload } = await jwtVerify(token, await githubJwks(), {
    issuer: GITHUB_ISSUER,
    audience: GITHUB_AUDIENCE,
  });

  const repository = typeof payload.repository === 'string' ? payload.repository : '';
  const repositoryId = String(payload.repository_id ?? '');
  const actorId = String(payload.actor_id ?? '');
  const runnerEnvironment = typeof payload.runner_environment === 'string' ? payload.runner_environment : '';
  const eventName = typeof payload.event_name === 'string' ? payload.event_name : '';
  const workflowRef = typeof payload.workflow_ref === 'string' ? payload.workflow_ref : '';
  const ref = typeof payload.ref === 'string' ? payload.ref : '';

  if (
    repository !== GITHUB_REPOSITORY
    || repositoryId !== GITHUB_REPOSITORY_ID
    || actorId !== GITHUB_TRUSTED_ACTOR_ID
    || runnerEnvironment !== 'github-hosted'
    || !ALLOWED_EVENTS.has(eventName)
    || !workflowRef.startsWith(GITHUB_WORKFLOW_PREFIX)
    || ref !== 'refs/heads/main'
  ) {
    throw new Error('GitHub OIDC claims are outside the provider archive trust boundary');
  }
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
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || null;
}

type SnapshotInput = {
  provider?: unknown;
  snapshot_date?: unknown;
  dataset?: unknown;
  chunk_index?: unknown;
  row_count?: unknown;
  payload?: unknown;
  source_version?: unknown;
};

function payloadBytes(payload: unknown) {
  return new TextEncoder().encode(JSON.stringify(payload)).byteLength;
}

function normalizeSnapshot(input: SnapshotInput) {
  const provider = typeof input.provider === 'string' ? input.provider : '';
  const snapshotDate = typeof input.snapshot_date === 'string' ? input.snapshot_date : '';
  const dataset = typeof input.dataset === 'string' ? input.dataset : '';
  const chunkIndex = Number(input.chunk_index ?? 0);
  const rowCount = Number(input.row_count ?? 0);
  const sourceVersion = typeof input.source_version === 'string' ? input.source_version : 'v1';

  if (!PROVIDERS.has(provider)) throw new Error('invalid provider');
  if (!DATE_RE.test(snapshotDate)) throw new Error('invalid snapshot date');
  if (!DATASET_RE.test(dataset)) throw new Error('invalid dataset');
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex > 500) throw new Error('invalid chunk index');
  if (!Number.isInteger(rowCount) || rowCount < 0 || rowCount > 25000) throw new Error('invalid row count');
  if (!input.payload || typeof input.payload !== 'object') throw new Error('invalid payload');
  if (payloadBytes(input.payload) > MAX_PAYLOAD_BYTES) throw new Error('payload too large');
  if (!/^[A-Za-z0-9._-]{1,40}$/.test(sourceVersion)) throw new Error('invalid source version');

  return {
    provider,
    snapshot_date: snapshotDate,
    dataset,
    chunk_index: chunkIndex,
    row_count: rowCount,
    payload: input.payload,
    source_version: sourceVersion,
    captured_at: new Date().toISOString(),
  };
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });

  const token = request.headers.get('x-gameyer-github-oidc')?.trim();
  if (!token) return Response.json({ ok: false }, { status: 401 });

  try {
    await verifyGitHubActionsToken(token);
  } catch (error) {
    console.error('provider archive oidc verification failed', error instanceof Error ? error.message : 'unknown');
    return Response.json({ ok: false }, { status: 401 });
  }

  let body: { snapshots?: unknown };
  try {
    body = await request.json() as { snapshots?: unknown };
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (!Array.isArray(body.snapshots) || body.snapshots.length < 1 || body.snapshots.length > MAX_SNAPSHOTS) {
    return Response.json({ ok: false }, { status: 400 });
  }

  let rows;
  try {
    rows = body.snapshots.map((snapshot) => normalizeSnapshot(snapshot as SnapshotInput));
  } catch (error) {
    console.error('provider archive validation failed', error instanceof Error ? error.message : 'unknown');
    return Response.json({ ok: false }, { status: 400 });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const secret = secretKey();
  if (!url || !secret) {
    console.error('provider archive missing server credential');
    return Response.json({ ok: false }, { status: 503 });
  }

  const client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { error } = await client
    .from('provider_metric_snapshots')
    .upsert(rows, { onConflict: 'provider,snapshot_date,dataset,chunk_index' });

  if (error) {
    console.error('provider archive persistence failed', error.message);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true, stored: rows.length }, {
    status: 200,
    headers: { 'cache-control': 'no-store' },
  });
});
