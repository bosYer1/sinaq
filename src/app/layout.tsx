import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/site-url';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import './globals.css';

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const monoFont = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
const siteUrl = getSiteUrl();
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim() || 'p4_LT_BjLRiy0oSjt8chd_QgipidT5IWv1N0rKzUl3I';
const socialImage = `${siteUrl}/opengraph-image`;
const brandLogo = `${siteUrl}/apple-icon`;
const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;

const siteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: 'GameYer',
      url: siteUrl,
      logo: brandLogo,
      description: 'Azərbaycanda PC və PlayStation klublarını tapmaq və müqayisə etmək üçün gaming klub kataloqu və xəritəsi.',
      sameAs: ['https://www.instagram.com/gameyer.az/', 'https://www.tiktok.com/@gameyer.az'],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: siteUrl,
      name: 'GameYer',
      inLanguage: 'az-AZ',
      publisher: { '@id': organizationId },
      description: 'Bakıda PC, kompüter, internet və PlayStation klublarını ünvan, iş saatı, qiymət və xəritəyə görə tap.',
    },
  ],
};

export const viewport: Viewport = { themeColor: '#7C5CFC', colorScheme: 'light' };
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'GameYer — Bakıda PC və PlayStation klubları', template: '%s | GameYer' },
  description: 'Bakıda PC klub, kompüter klubu və PlayStation klub tap. Qiymət, ünvan, rayon, iş saatları və xəritəyə görə gaming klublarını GameYer-də müqayisə et.',
  applicationName: 'GameYer',
  manifest: '/manifest.webmanifest',
  verification: { google: googleVerification },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  appleWebApp: { capable: true, title: 'GameYer', statusBarStyle: 'default' },
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'az_AZ', url: '/', siteName: 'GameYer', title: 'GameYer — Bakıda PC və PlayStation klubları', description: 'Bakıda PC, kompüter və PlayStation klublarını qiymət, ünvan və xəritə məlumatları ilə tap.', images: [{ url: socialImage, width: 1200, height: 630, alt: 'GameYer — Bakıda gaming klubu tap' }] },
  twitter: { card: 'summary_large_image', title: 'GameYer — Bakıda gaming klubu tap', description: 'PC və PlayStation klublarını xəritə, rayon və qiymətə görə tap.', images: [socialImage] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
      <body className="bg-bg font-body text-ink antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData).replace(/</g, '\\u003c') }} />
        <PageViewTracker />

        <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5" aria-label="GameYer ana səhifə">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#4D8DFF] text-sm font-black text-white shadow-sm">G</span>
              <span className="font-display text-xl font-bold tracking-[-0.04em] text-ink">Game<span className="text-primary">Yer</span></span>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex" aria-label="Əsas keçidlər">
              <Link href="/" className="font-semibold text-primary">Klublar</Link>
              <Link href="/rayon" className="transition hover:text-ink">Rayonlar</Link>
              <Link href="/tip" className="transition hover:text-ink">PC / PS</Link>
              <Link href="/haqqimizda" className="transition hover:text-ink">Haqqımızda</Link>
              <Link href="/elaqe" className="transition hover:text-ink">Əlaqə</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/klub-sahibi" className="hidden rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark sm:inline-flex">+ Klubunu əlavə et</Link>
              <Link href="/elaqe" className="inline-flex h-10 items-center rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary sm:hidden">Əlaqə</Link>
            </div>
          </div>
        </header>

        <main className="pb-[76px] md:pb-0">{children}</main>

        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-xs text-muted sm:px-6 lg:px-8">
            <span className="font-semibold text-ink">© 2026 GameYer</span>
            <Link href="/bakida-pc-klublari" className="hover:text-ink">PC klubları</Link>
            <Link href="/bakida-playstation-klublari" className="hover:text-ink">PlayStation</Link>
            <Link href="/bakida-24-saat-gaming-klublari" className="hover:text-ink">24/7</Link>
            <Link href="/haqqimizda" className="hover:text-ink">Haqqımızda</Link>
            <Link href="/melumat-metodologiyasi" className="hover:text-ink">Metodologiya</Link>
            <Link href="/mexfilik" className="hover:text-ink">Məxfilik</Link>
            <a href="https://www.instagram.com/gameyer.az/" target="_blank" rel="noopener noreferrer" className="ml-auto hover:text-ink">Instagram</a>
            <a href="https://www.tiktok.com/@gameyer.az" target="_blank" rel="noopener noreferrer" className="hover:text-ink">TikTok</a>
          </div>
        </footer>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[68px] grid-cols-5 border-t border-border bg-white/96 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(31,35,48,0.06)] backdrop-blur md:hidden" aria-label="Mobil naviqasiya">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-primary"><span className="text-lg leading-none">⌖</span><span>Klublar</span></Link>
          <Link href="/rayon" className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted"><span className="text-lg leading-none">▦</span><span>Rayonlar</span></Link>
          <Link href="/#club-search" className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-primary"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xl text-white shadow-[0_5px_16px_rgba(124,92,252,0.3)]">⌕</span><span>Axtar</span></Link>
          <Link href="/elaqe" className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted"><span className="text-lg leading-none">◌</span><span>Əlaqə</span></Link>
          <Link href="/tip" className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted"><span className="text-lg leading-none">☰</span><span>Menyu</span></Link>
        </nav>
      </body>
    </html>
  );
}
