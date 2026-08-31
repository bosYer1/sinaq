import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnalyticsWriteMode, type AnalyticsWriteMode } from '@/lib/supabase/analytics-server';

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

export async function GET() {
  const analyticsWrite = getAnalyticsWriteMode();

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('clubs')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (error) {
      return healthResponse(
        {
          ok: false,
          service: 'gameyer',
          database: 'error',
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
  } catch {
    return healthResponse(
      {
        ok: false,
        service: 'gameyer',
        database: 'unavailable',
        analytics_write: analyticsWrite,
      },
      503
    );
  }
}
