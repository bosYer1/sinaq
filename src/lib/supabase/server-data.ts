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

async function oidcPublicDataFetch(input: RequestInfo | URL, init?: RequestInit) {
  const directRequest = new Request(input, init);
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

  if (!oidcToken) {
    throw new Error('Trusted public data bridge is unavailable: VERCEL_OIDC_TOKEN is missing.');
  }

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
}

export function createServerDataClient() {
  if (serverDataClient) return serverDataClient;

  const secret = process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const isProduction = process.env.VERCEL_ENV === 'production';
  const oidcBridgeEnabled = process.env.GAMEYER_PUBLIC_DATA_OIDC_ENABLED === '1';

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
    ...(isProduction && !secret && oidcBridgeEnabled
      ? { global: { fetch: oidcPublicDataFetch } }
      : {}),
  });

  return serverDataClient;
}
