import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const monoFont = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bosyer-web.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'GameYer — Bakıda PC və PlayStation klubları',
    template: '%s | GameYer',
  },
  description:
    'Bakıdakı PC gaming və PlayStation klublarını xəritə üzərində tap, rayon, tip və qiymətə görə filtr et.',
  applicationName: 'GameYer',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: '/',
    siteName: 'GameYer',
    title: 'GameYer — Bakıda PC və PlayStation klubları',
    description:
      'Bakıdakı PC gaming və PlayStation klublarını xəritə üzərində tap, rayon, tip və qiymətə görə filtr et.',
  },
  twitter: {
    card: 'summary',
    title: 'GameYer — Bakıda gaming klubu tap',
    description: 'PC və PlayStation klublarını xəritə və filtrlərlə tap.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
      <body className="bg-bg font-body text-ink antialiased">
        <header className="sticky top-0 z-30 border-b border-border bg-surface">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2" aria-label="GameYer ana səhifə">
              <span className="flex h-7 w-7 items-center justify-center rounded-control bg-primary text-sm font-bold text-white">
                G
              </span>
              <span className="font-display text-base font-bold tracking-tight text-ink">
                Game<span className="text-primary">Yer</span>
              </span>
            </Link>
            <span className="hidden text-xs text-muted sm:inline">Bakıda gaming klubu tap</span>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
