import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 88px',
          background: '#F7F7F9',
          color: '#14161C',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              width: 92,
              height: 92,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 24,
              background: '#7C5CFC',
              color: '#FFFFFF',
              fontSize: 54,
              fontWeight: 800,
            }}
          >
            G
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 800 }}>
            Game<span style={{ color: '#7C5CFC' }}>Yer</span>
          </div>
        </div>

        <div style={{ marginTop: 58, fontSize: 54, fontWeight: 750, lineHeight: 1.12, maxWidth: 980 }}>
          Bakıda PC və PlayStation klublarını tap
        </div>
        <div style={{ marginTop: 24, fontSize: 28, color: '#6B7280' }}>
          Xəritə · yaxın klublar · rayon, tip və qiymət filtrləri
        </div>

        <div style={{ marginTop: 58, display: 'flex', gap: 14 }}>
          <div style={{ padding: '12px 20px', borderRadius: 999, background: '#F1EDFF', color: '#6A47F0', fontSize: 22, fontWeight: 700 }}>PC</div>
          <div style={{ padding: '12px 20px', borderRadius: 999, background: '#E6F8FC', color: '#0288A5', fontSize: 22, fontWeight: 700 }}>PlayStation</div>
          <div style={{ padding: '12px 20px', borderRadius: 999, background: '#FFFFFF', color: '#6B7280', fontSize: 22, fontWeight: 600 }}>Bakı</div>
        </div>
      </div>
    ),
    size
  );
}
