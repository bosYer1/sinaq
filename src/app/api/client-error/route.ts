import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function clean(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = {
      message: clean(body?.message, 1000),
      stack: clean(body?.stack, 4000),
      digest: clean(body?.digest, 200),
      path: clean(body?.path, 500),
      userAgent: clean(body?.userAgent, 500),
    };

    console.error('GAMEYER_CLIENT_ERROR', JSON.stringify(payload));
  } catch (error) {
    console.error('GAMEYER_CLIENT_ERROR_REPORT_FAILED', error);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
