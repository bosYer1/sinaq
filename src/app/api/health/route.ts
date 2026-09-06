import { NextResponse } from 'next/server';
import { getDatabaseHealth } from '@/lib/health';
import { createClient } from '@/lib/supabase/server';
import {
  getAnalyticsWriteMode,
  requestVercelOidcToken,
  type AnalyticsWriteMode,
} from '@/lib/supabase/analytics-server';

export const dynamic = 'force-dynamic';

function healthResponse(
  body: {
    ok: boolean;
    service: 'gameyer';
    database: 'ok' | 'error' | 'unavailable';
    analytics_write: AnalyticsWriteMode;
  },
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export async function GET(request: Request) {
  const analyticsWrite = getAnalyticsWriteMode(requestVercelOidcToken(request));

  const database = await getDatabaseHealth(async () => {
    const supabase = await createClient();
    return supabase
      .from('clubs')
      .select('id')
      .eq('is_active', true)
      .limit(1);
  });

  if (database !== 'ok') {
    return healthResponse(
      {
        ok: false,
        service: 'gameyer',
        database,
        analytics_write: analyticsWrite,
      },
      503
    );
  }

  return healthResponse({
    ok: true,
    service: 'gameyer',
    database: 'ok',
    analytics_write: analyticsWrite,
  });
}
