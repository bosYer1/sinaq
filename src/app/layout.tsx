import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/site-url';
import './globals.css';

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const monoFont = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

const siteUrl = getSiteUrl();
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const viewport: Viewport = {
  themeColor: '#7C5CFC',
  colorScheme: 'light',
};

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
  verification: googleVerification ? { google: googleVerification } : undefined,
  appleWebApp: {
    capable: true,
    title: 'GameYer',
    statusBarStyle: 'default',
  },
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
    card: 'summary_large_image',
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

            <nav className="flex items-center gap-3 text-[11px] font-medium text-muted sm:gap-4 sm:text-xs" aria-label="Əsas keçidlər">
              <Link href="/rayon" className="hidden transition hover:text-ink sm:inline">Rayonlar</Link>
              <Link href="/tip" className="hidden transition hover:text-ink sm:inline">PC / PS</Link>
              <Link href="/elaqe" className="transition hover:text-ink">Əlaqə</Link>
              <Link href="/mexfilik" className="hidden transition hover:text-ink md:inline">Məxfilik</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-5 text-xs text-muted sm:px-6">
            <span>© GameYer</span>
            <Link href="/rayon" className="hover:text-ink">Rayonlar üzrə klublar</Link>
            <Link href="/tip/pc" className="hover:text-ink">PC klubları</Link>
            <Link href="/tip/playstation" className="hover:text-ink">PlayStation klubları</Link>
            <Link href="/elaqe" className="hover:text-ink">Əlaqə</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
