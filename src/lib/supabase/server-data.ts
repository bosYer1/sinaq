import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from '@/lib/supabase/public-config';

const GITHUB_OIDC_AUDIENCE = 'https://gameyer.az/public-data-ci';

let serverDataClient: ReturnType<typeof createClient<Database>> | null = null;
let githubOidcCache: { token: string; expiresAt: number } | null = null;

function proxyHeaders(headersInit?: HeadersInit) {
  const headers = new Headers(headersInit);
  const result: Record<string, string> = {};
  for (const name of ['accept', 'accept-profile', 'content-type', 'prefer', 'range', 'range-unit']) {
    const value = headers.get(name);
    if (value) result[name] = value;
  }
  return result;
}

function githubOidcRuntimeAvailable() {
  return Boolean(
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL?.trim()
    && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN?.trim(),
  );
}

function jwtExpiryMs(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function mintGitHubOidcToken() {
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL?.trim();
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN?.trim();
  if (!requestUrl || !requestToken) return null;

  const url = new URL(requestUrl);
  url.searchParams.set('audience', GITHUB_OIDC_AUDIENCE);
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${requestToken}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`GitHub OIDC mint failed: ${response.status}`);
  }

  const payload = await response.json() as { value?: unknown };
  if (typeof payload.value !== 'string' || !payload.value.trim()) {
    throw new Error('GitHub OIDC mint returned no token.');
  }

  const token = payload.value.trim();
  const expiresAt = jwtExpiryMs(token) || (Date.now() + 60_000);
  githubOidcCache = { token, expiresAt };
  return token;
}

async function requestScopedGitHubOidcToken(force = false) {
  if (githubOidcRuntimeAvailable()) {
    if (!force && githubOidcCache && githubOidcCache.expiresAt > Date.now() + 5_000) {
      return githubOidcCache.token;
    }
    return mintGitHubOidcToken();
  }

  return process.env.GAMEYER_CI_OIDC_TOKEN?.trim() || null;
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

async function proxyPublicDataFetch(
  directRequest: Request,
  trustedHeader: 'x-gameyer-github-oidc' | 'x-gameyer-vercel-oidc',
  trustedToken: string,
) {
  const body = JSON.stringify({
    url: directRequest.url,
    method: directRequest.method,
    headers: proxyHeaders(directRequest.headers),
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gameyer-public-data-proxy`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [trustedHeader]: trustedToken,
        ...(SUPABASE_PUBLISHABLE_KEY ? { apikey: SUPABASE_PUBLISHABLE_KEY } : {}),
      },
      body,
      cache: 'no-store',
    });

    if (![502, 503, 504].includes(response.status) || attempt === 1) {
      return response;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error('Trusted public data proxy retry loop exited unexpectedly.');
}

async function trustedPublicDataFetch(input: RequestInfo | URL, init?: RequestInit) {
  const directRequest = new Request(input, init);
  const githubToken = await requestScopedGitHubOidcToken();
  const vercelToken = githubToken ? null : await requestScopedVercelOidcToken();
  const trustedToken = githubToken || vercelToken;
  const trustedHeader = githubToken ? 'x-gameyer-github-oidc' : 'x-gameyer-vercel-oidc';

  if (!trustedToken) {
    throw new Error('Trusted public data OIDC credential is unavailable.');
  }

  return proxyPublicDataFetch(
    directRequest,
    trustedHeader as 'x-gameyer-github-oidc' | 'x-gameyer-vercel-oidc',
    trustedToken,
  );

}

export function createServerDataClient() {
  if (serverDataClient) return serverDataClient;

  const secret = process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const isProduction = process.env.VERCEL_ENV === 'production';
  const hasCiOidc = githubOidcRuntimeAvailable()
    || Boolean(process.env.GAMEYER_CI_OIDC_TOKEN?.trim());

  if (!SUPABASE_URL) {
    throw new Error('Server data client is unavailable: Supabase URL is missing.');
  }

  const key = secret || SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Server data client is unavailable: no Supabase API key is configured.');
  }

  const baseFetch = (isProduction || hasCiOidc) && !secret
    ? async (input: RequestInfo | URL, init?: RequestInit) => {
        const response = await trustedPublicDataFetch(input, init);
        if (
          response.status === 401
          && githubOidcRuntimeAvailable()
        ) {
          githubOidcCache = null;
          const refreshed = await requestScopedGitHubOidcToken(true);
          if (refreshed) {
            const directRequest = new Request(input, init);
            return proxyPublicDataFetch(directRequest, 'x-gameyer-github-oidc', refreshed);
          }
        }
        return response;
      }
    : undefined;

  serverDataClient = createClient<Database>(SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    ...(baseFetch ? { global: { fetch: baseFetch } } : {}),
  });

  return serverDataClient;
}
