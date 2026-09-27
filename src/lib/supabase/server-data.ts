import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from '@/lib/supabase/public-config';

let serverDataClient: ReturnType<typeof createClient<Database>> | null = null;

function proxyHeaders(headersInit?: HeadersInit) {
  const headers = new Headers(headersInit);
  const result: Record<string, string> = {};
  for (const name of ['accept', 'accept-profile', 'content-type', 'prefer', 'range', 'range-unit']) {
    const value = headers.get(name);
    if (value) result[name] = value;
  }
  return result;
}

async function requestScopedVercelOidcToken() {
  const environmentToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (environmentToken) return environmentToken;

  try {
    const { headers } = await import('next/headers');
    const requestHeaders = await headers();
    return requestHeaders.get('x-vercel-oidc-token')?.trim() || null;
  } catch {
    return null;
  }
}

async function trustedPublicDataFetch(input: RequestInfo | URL, init?: RequestInit) {
  const directRequest = new Request(input, init);
  const ciToken = process.env.GAMEYER_CI_OIDC_TOKEN?.trim() || null;
  const vercelToken = ciToken ? null : await requestScopedVercelOidcToken();
  const trustedToken = ciToken || vercelToken;
  const trustedHeader = ciToken ? 'x-gameyer-github-oidc' : 'x-gameyer-vercel-oidc';

  // Canary safety only applies to production Vercel traffic while anon RLS is
  // still available. CI deliberately has no fallback: a green workflow proves
  // that GitHub OIDC can carry the public-data reads before anon SELECT is cut.
  if (!trustedToken) {
    return fetch(directRequest);
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gameyer-public-data-proxy`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [trustedHeader]: trustedToken,
        ...(SUPABASE_PUBLISHABLE_KEY ? { apikey: SUPABASE_PUBLISHABLE_KEY } : {}),
      },
      body: JSON.stringify({
        url: directRequest.url,
        method: directRequest.method,
        headers: proxyHeaders(directRequest.headers),
      }),
      cache: 'no-store',
    });

    if (response.ok || ciToken) return response;
  } catch (error) {
    if (ciToken) throw error;
    // Production canary falls through to existing public RLS until final cutover.
  }

  return fetch(directRequest);
}

export function createServerDataClient() {
  if (serverDataClient) return serverDataClient;

  const secret = process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const isProduction = process.env.VERCEL_ENV === 'production';
  const hasCiOidc = Boolean(process.env.GAMEYER_CI_OIDC_TOKEN?.trim());

  if (!SUPABASE_URL) {
    throw new Error('Server data client is unavailable: Supabase URL is missing.');
  }

  const key = secret || SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Server data client is unavailable: no Supabase API key is configured.');
  }

  serverDataClient = createClient<Database>(SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    ...((isProduction || hasCiOidc) && !secret
      ? { global: { fetch: trustedPublicDataFetch } }
      : {}),
  });

  return serverDataClient;
}
