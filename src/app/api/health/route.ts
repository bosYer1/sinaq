import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAnalyticsWriteMode,
  requestVercelOidcToken,
  type AnalyticsWriteMode,
} from '@/lib/supabase/analytics-server';
import { classifyPublicClubRead, type PublicDataStatus } from '@/lib/dr-health';

export const dynamic = 'force-dynamic';

function healthResponse(
  body: {
    ok: boolean;
    service: 'gameyer';
    database: 'ok' | 'error' | 'unavailable';
    public_data: PublicDataStatus;
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

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('clubs')
      .select('id')
      .eq('is_active', true)
      .limit(1);
    const publicData = classifyPublicClubRead(data, error);

    if (publicData !== 'ok') {
      return healthResponse(
        {
          ok: false,
          service: 'gameyer',
          database: error ? 'error' : 'ok',
          public_data: publicData,
          analytics_write: analyticsWrite,
        },
        503
      );
    }

    return healthResponse({
      ok: true,
      service: 'gameyer',
      database: 'ok',
      public_data: 'ok',
      analytics_write: analyticsWrite,
    });
  } catch {
    return healthResponse(
      {
        ok: false,
        service: 'gameyer',
        database: 'unavailable',
        public_data: 'unavailable',
        analytics_write: analyticsWrite,
      },
      503
    );
  }
}
