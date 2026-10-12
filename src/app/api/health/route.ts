import { NextResponse } from 'next/server';
import { getDatabaseHealth } from '@/lib/health';
import { emergencyNeonCatalogEnabled, getEmergencyPublicClubs } from '@/lib/neon/emergency-catalog';
import { createServerDataClient } from '@/lib/supabase/server-data';
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
  // During temporary catalog recovery, validate the actual serving database.
  // Analytics writes remain disabled while the original provider is restricted.
  if (emergencyNeonCatalogEnabled()) {
    try {
      const clubs = await getEmergencyPublicClubs();
      if (clubs.length > 0) {
        return healthResponse({
          ok: true, service: 'gameyer', database: 'ok', analytics_write: 'disabled',
        });
      }
    } catch (error) {
      console.error('Neon emergency health probe failed:', error);
    }
    return healthResponse({
      ok: false, service: 'gameyer', database: 'error', analytics_write: 'disabled',
    }, 503);
  }


  const database = await getDatabaseHealth(async () => {
    const supabase = createServerDataClient();
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
