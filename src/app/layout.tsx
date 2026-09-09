import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/site-url';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';
import { MetaPixel } from '@/components/analytics/MetaPixel';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { PostHogAnalytics } from '@/components/analytics/PostHogAnalytics';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import './globals.css';

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const monoFont = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
const siteUrl = getSiteUrl();
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const socialImage = `${siteUrl}/opengraph-image`;
const brandLogo = `${siteUrl}/gameyer-logo.jpeg`;
const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;

const themeInitScript = `(() => {
  try {
    const key = 'gameyer-theme';
    const stored = localStorage.getItem(key);
    const preference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    const resolved = preference === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = resolved;
  } catch {
    document.documentElement.dataset.themePreference = 'system';
    document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
})();`;

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
      description: 'Bakıda PC, kompüter, internet və PlayStation klublarını ünvan, rayon və xəritəyə görə tap; qiymət və iş saatlarına məlum olduqda bax.',
    },
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7C5CFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0D12' },
  ],
  colorScheme: 'light dark',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'GameYer — Bakıda gaming, PC və PlayStation klubları', template: '%s | GameYer' },
  description: 'Bakıda PC klub, kompüter klubu, internet klub və PlayStation klub tap. Ünvan, rayon və xəritəyə görə müqayisə et; qiymət və iş saatları məlum olduqda klub profilində göstərilir.',
  applicationName: 'GameYer',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/gameyer-favicon.jpeg', type: 'image/jpeg', sizes: '1254x1254' }],
    apple: [{ url: '/gameyer-logo.jpeg', type: 'image/jpeg', sizes: '1254x1254' }],
  },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  appleWebApp: { capable: true, title: 'GameYer', statusBarStyle: 'default' },
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'az_AZ', url: '/', siteName: 'GameYer', title: 'GameYer — Bakıda gaming, PC və PlayStation klubları', description: 'Bakıda PC, kompüter, internet və PlayStation klublarını ünvan, rayon və xəritə ilə tap; mövcud qiymət və iş saatlarına profillərdə bax.', images: [{ url: socialImage, width: 1200, height: 630, alt: 'GameYer — Bakıda gaming klubu tap' }] },
  twitter: { card: 'summary_large_image', title: 'GameYer — Bakıda gaming klubu tap', description: 'PC, internet və PlayStation klublarını xəritə və rayon üzrə tap; mövcud qiymət məlumatlarını müqayisə et.', images: [socialImage] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-bg font-body text-ink antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData).replace(/</g, '\u003c') }} />
        <MetaPixel pixelId={metaPixelId} />
        <GoogleAnalytics measurementId={gaMeasurementId} />
        <PostHogAnalytics />
        <PageViewTracker />

        <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5" aria-label="GameYer ana səhifə">
              <Image
                src="/gameyer-logo.jpeg"
                alt="GameYer loqosu"
                width={36}
                height={36}
                priority
                className="h-9 w-9 rounded-xl object-cover shadow-sm"
              />
              <span className="font-display text-xl font-bold tracking-[-0.04em] text-ink">Game<span className="text-primary">Yer</span></span>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex" aria-label="Əsas keçidlər">
              <Link href="/" className="font-semibold text-primary">Klublar</Link>
              <Link href="/rayon" className="transition hover:text-ink">Rayonlar</Link>
              <Link href="/tip" className="transition hover:text-ink">PC / PS</Link>
              <Link href="/yenilikler" className="transition hover:text-ink">Yeniliklər</Link>
              <Link href="/haqqimizda" className="transition hover:text-ink">Haqqımızda</Link>
              <Link href="/elaqe" className="transition hover:text-ink">Əlaqə</Link>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/klub-sahibi" className="hidden rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark sm:inline-flex">+ Klubunu əlavə et</Link>
              <Link href="/elaqe" className="inline-flex h-10 items-center rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary sm:hidden">Əlaqə</Link>
            </div>
          </div>
        </header>

        <main className="pb-[76px] md:pb-0">{children}</main>

        <footer className="border-t border-border bg-surface pb-[68px] md:pb-0">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-xs text-muted sm:px-6 lg:px-8">
            <span className="font-semibold text-ink">© 2026 GameYer</span>
            <Link href="/yaxinliqda-gaming-klublari" className="hover:text-ink">Yaxın klublar</Link>
            <Link href="/bakida-gaming-klub-qiymetleri" className="hover:text-ink">Klub qiymətləri</Link>
            <Link href="/bakida-pc-klublari" className="hover:text-ink">PC klubları</Link>
            <Link href="/bakida-internet-klublari" className="hover:text-ink">Internet klubları</Link>
            <Link href="/bakida-playstation-klublari" className="hover:text-ink">PlayStation</Link>
            <Link href="/bakida-ucuz-pc-klublari" className="hover:text-ink">Ucuz PC</Link>
            <Link href="/bakida-ucuz-playstation-klublari" className="hover:text-ink">Ucuz PlayStation</Link>
            <Link href="/bakida-24-saat-gaming-klublari" className="hover:text-ink">24/7</Link>
            <Link href="/yenilikler" className="hover:text-ink">Yeniliklər</Link>
            <Link href="/haqqimizda" className="hover:text-ink">Haqqımızda</Link>
            <Link href="/melumat-metodologiyasi" className="hover:text-ink">Metodologiya</Link>
            <Link href="/mexfilik" className="hover:text-ink">Məxfilik</Link>
            <a href="https://www.instagram.com/gameyer.az/" target="_blank" rel="noopener noreferrer" className="ml-auto hover:text-ink">Instagram</a>
            <a href="https://www.tiktok.com/@gameyer.az" target="_blank" rel="noopener noreferrer" className="hover:text-ink">TikTok</a>
          </div>
        </footer>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[68px] grid-cols-5 border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(31,35,48,0.06)] backdrop-blur md:hidden" aria-label="Mobil naviqasiya">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-primary">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 8h9a4 4 0 0 1 3.7 5.5l-1.3 3.2a2 2 0 0 1-3.2.7L14 16h-4l-1.7 1.4a2 2 0 0 1-3.2-.7l-1.3-3.2A4 4 0 0 1 7.5 8Z"/><path d="M8 11v4M6 13h4M16.5 12h.01M18 14h.01"/></svg>
            <span>Klublar</span>
          </Link>
          <Link href="/rayon" className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 6.5 5-2 7 2 5-2v13l-5 2-7-2-5 2v-13Z"/><path d="M8.5 4.5v13M15.5 6.5v13"/><path d="M12 8.2a2.4 2.4 0 0 1 2.4 2.4c0 1.8-2.4 4.3-2.4 4.3s-2.4-2.5-2.4-4.3A2.4 2.4 0 0 1 12 8.2Z"/><circle cx="12" cy="10.6" r=".7"/></svg>
            <span>Rayonlar</span>
          </Link>
          <Link href="/#club-search" className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-primary">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-[0_5px_16px_rgba(124,92,252,0.3)]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
            </span>
            <span>Axtar</span>
          </Link>
          <Link href="/yenilikler" className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            <span>Yeniliklər</span>
          </Link>
          <Link href="/tip" className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            <span>Menyu</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
