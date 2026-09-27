import 'server-only';

import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from '@/lib/supabase/public-config';

function proxyHeaders(headersInit?: HeadersInit) {
  const source = new Headers(headersInit);
  const result: Record<string, string> = {};
  for (const name of ['accept', 'accept-profile', 'content-type', 'prefer', 'range', 'range-unit']) {
    const value = source.get(name);
    if (value) result[name] = value;
  }
  return result;
}

function trustedProxyFetch(oidcToken: string) {
  return async function oidcPublicDataFetch(input: RequestInfo | URL, init?: RequestInit) {
    const directRequest = new Request(input, init);

    return fetch(`${SUPABASE_URL}/functions/v1/gameyer-public-data-proxy`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-gameyer-vercel-oidc': oidcToken,
        ...(SUPABASE_PUBLISHABLE_KEY ? { apikey: SUPABASE_PUBLISHABLE_KEY } : {}),
      },
      body: JSON.stringify({
        url: directRequest.url,
        method: directRequest.method,
        headers: proxyHeaders(directRequest.headers),
      }),
      cache: 'no-store',
    });
  };
}

async function requestScopedVercelOidcToken() {
  const buildToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (buildToken) return buildToken;

  try {
    return (await headers()).get('x-vercel-oidc-token')?.trim() || null;
  } catch {
    return null;
  }
}

export async function createServerDataClient() {
  const secret = process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const isProduction = process.env.VERCEL_ENV === 'production';

  if (!SUPABASE_URL) {
    throw new Error('Server data client is unavailable: Supabase URL is missing.');
  }

  if (secret) {
    return createClient<Database>(SUPABASE_URL, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Server data client is unavailable: no Supabase API key is configured.');
  }

  if (!isProduction) {
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  const oidcToken = await requestScopedVercelOidcToken();
  if (!oidcToken) {
    throw new Error('Trusted public data bridge is unavailable: Vercel OIDC token is missing.');
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: trustedProxyFetch(oidcToken),
    },
  });
}
