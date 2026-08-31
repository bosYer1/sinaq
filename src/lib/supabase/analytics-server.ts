import { createClient } from '@supabase/supabase-js';

export type AnalyticsWriteMode = 'server-secret' | 'vercel-oidc-edge' | 'disabled';

type AnalyticsWrite =
  | {
      kind: 'visit';
      row: {
        session_id: string;
        visit_id: string | null;
        path: string;
        referrer_host: string | null;
        user_agent: string | null;
      };
    }
  | {
      kind: 'event';
      row: {
        session_id: string;
        path: string;
        event_type: string;
        club_slug: string;
      };
    };

function serverAnalyticsSecret() {
  return process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || null;
}

export function getAnalyticsWriteMode(): AnalyticsWriteMode {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && serverAnalyticsSecret()) {
    return 'server-secret';
  }
  if (process.env.VERCEL_OIDC_TOKEN?.trim()) return 'vercel-oidc-edge';
  return 'disabled';
}

export async function writeAnalyticsRecord(write: AnalyticsWrite): Promise<{
  error: { message: string } | null;
  mode: AnalyticsWriteMode;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = serverAnalyticsSecret();

  if (supabaseUrl && secret) {
    const client = createClient(supabaseUrl, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const table = write.kind === 'visit' ? 'page_views' : 'analytics_events';
    const { error } = await client.from(table).insert(write.row);
    return { error: error ? { message: error.message } : null, mode: 'server-secret' };
  }

  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (supabaseUrl && oidcToken) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/gameyer-analytics-ingest`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-gameyer-vercel-oidc': oidcToken,
          ...(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
            ? { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() }
            : {}),
        },
        body: JSON.stringify(write),
        cache: 'no-store',
      });

      if (!response.ok) {
        return {
          error: { message: `trusted analytics bridge returned ${response.status}` },
          mode: 'vercel-oidc-edge',
        };
      }

      return { error: null, mode: 'vercel-oidc-edge' };
    } catch (error) {
      return {
        error: { message: error instanceof Error ? error.message : 'trusted analytics bridge failed' },
        mode: 'vercel-oidc-edge',
      };
    }
  }

  if (process.env.VERCEL_ENV === 'production') {
    return {
      error: { message: 'no trusted production analytics writer is available' },
      mode: 'disabled',
    };
  }

  // Local/CI environments intentionally do not write first-party analytics.
  return { error: null, mode: 'disabled' };
}
