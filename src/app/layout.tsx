import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const monoFont = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'BoşYer — Bakıda PC və PlayStation klubları',
  description:
    'Bakıdakı PC gaming və PlayStation klublarını xəritə üzərində tap, rayon, tip və qiymətə görə filtr et.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
      <body className="flex min-h-dvh flex-col font-body antialiased">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink">
              Boş<span className="text-primary">Yer</span>
            </Link>
            <span className="text-xs text-muted">Bakıda gaming klubu tap</span>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
