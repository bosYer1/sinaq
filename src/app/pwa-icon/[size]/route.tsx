import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: rawSize } = await params;
  const size = Number(rawSize);

  if (size !== 192 && size !== 512) {
    return new Response('Not found', { status: 404 });
  }

  const fontSize = Math.round(size * 0.52);
  const radius = Math.round(size * 0.22);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#7C5CFC',
          color: '#FFFFFF',
          fontSize,
          fontWeight: 800,
          borderRadius: radius,
        }}
      >
        G
      </div>
    ),
    {
      width: size,
      height: size,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
