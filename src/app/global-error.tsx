'use client';

import Link from 'next/link';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="az">
      <body style={{ margin: 0, background: '#ffffff', color: '#151515', fontFamily: 'Arial, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                margin: '0 auto',
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#7C5CFC',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              G
            </div>
            <h1 style={{ margin: '20px 0 8px', fontSize: 24 }}>GameYer-i yükləmək mümkün olmadı</h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
              Sistem səviyyəsində müvəqqəti problem yarandı. Yenidən cəhd edin və problem davam edərsə ana səhifəyə qayıdın.
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  border: 0,
                  borderRadius: 10,
                  background: '#7C5CFC',
                  color: '#ffffff',
                  padding: '11px 18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Yenidən cəhd et
              </button>
              <Link
                href="/"
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: 10,
                  color: '#151515',
                  padding: '10px 18px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Ana səhifə
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
