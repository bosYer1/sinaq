import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();

  try {
    const supabase = createClient();
    const { count, error } = await supabase
      .from('clubs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          service: 'gameyer',
          database: 'error',
          error: 'Database health check failed',
          timestamp: new Date().toISOString(),
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        service: 'gameyer',
        database: 'ok',
        activeClubs: count ?? 0,
        responseMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: 'gameyer',
        database: 'unavailable',
        error: 'Health check unavailable',
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
