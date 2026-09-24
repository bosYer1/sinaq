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
import { MobileNav } from '@/components/navigation/MobileNav';
import { MobileViewportSync } from '@/components/navigation/MobileViewportSync';
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
const brandImageId = `${siteUrl}/#brand-image`;

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
      '@type': 'ImageObject',
      '@id': brandImageId,
      url: brandLogo,
      contentUrl: brandLogo,
      width: 1254,
      height: 1254,
      caption: 'GameYer',
      representativeOfPage: true,
    },
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: 'GameYer',
      alternateName: ['GameYer.az'],
      url: siteUrl,
      logo: { '@id': brandImageId },
      image: { '@id': brandImageId },
      areaServed: { '@type': 'Country', name: 'Azerbaijan' },
      description: 'Azərbaycanda PC və PlayStation klublarını tapmaq və müqayisə etmək üçün gaming klub kataloqu və xəritəsi.',
      sameAs: ['https://www.instagram.com/gameyer.az/', 'https://www.tiktok.com/@gameyer.az'],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: siteUrl,
      name: 'GameYer',
      alternateName: ['GameYer.az'],
      inLanguage: 'az-AZ',
      publisher: { '@id': organizationId },
      description: 'Bakıda PC, kompüter, internet və PlayStation klublarını ünvan, rayon və xəritəyə görə tap; qiymət və iş saatlarına məlum olduqda bax.',
    },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
    icon: [
      { url: '/favicon.ico', type: 'image/jpeg', sizes: '1254x1254' },
      { url: '/favicon.jpeg', type: 'image/jpeg', sizes: '1254x1254' },
      { url: '/gameyer-favicon.jpeg', type: 'image/jpeg', sizes: '1254x1254' },
    ],
    shortcut: [{ url: '/favicon.ico', type: 'image/jpeg', sizes: '1254x1254' }],
    apple: [{ url: '/gameyer-logo.jpeg', type: 'image/jpeg', sizes: '1254x1254' }],
  },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  appleWebApp: { capable: true, title: 'GameYer', statusBarStyle: 'default' },
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'az_AZ', url: '/', siteName: 'GameYer', title: 'GameYer — Bakıda gaming, PC və PlayStation klubları', description: 'Bakıda PC, kompüter, internet və PlayStation klublarını xəritə və rayon üzrə tap; mövcud qiymət və iş saatlarına profillərdə bax.', images: [{ url: socialImage, width: 1200, height: 630, alt: 'GameYer — Bakıda gaming klubu tap' }] },
  twitter: { card: 'summary_large_image', title: 'GameYer — Bakıda gaming klubu tap', description: 'PC, internet və PlayStation klublarını xəritə və rayon üzrə tap; mövcud qiymət məlumatlarını müqayisə et.', images: [socialImage] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="overflow-hidden bg-bg font-body text-ink antialiased md:overflow-auto">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData).replace(/</g, '\\u003c') }} />
        <MetaPixel pixelId={metaPixelId} />
        <GoogleAnalytics measurementId={gaMeasurementId} />
        <PostHogAnalytics />
        <PageViewTracker />
        <MobileViewportSync />

        <div
          data-mobile-app-shell="true"
          className="flex h-[var(--gameyer-mobile-vh,100svh)] flex-col overflow-hidden md:min-h-screen md:h-auto md:overflow-visible"
        >
        <header className="sticky top-0 z-30 shrink-0 border-b border-border/80 bg-surface md:bg-surface/95 md:backdrop-blur">
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

            <nav className="hidden items-center gap-5 text-sm font-medium text-muted md:flex" aria-label="Əsas keçidlər">
              <Link href="/" className="font-semibold text-primary">Klublar</Link>
              <Link href="/populyar-klublar" className="transition hover:text-ink">Populyar</Link>
              <Link href="/rayon" className="transition hover:text-ink">Rayonlar</Link>
              <Link href="/tip" className="transition hover:text-ink">PC / PS</Link>
              <Link href="/yenilikler" className="transition hover:text-ink">Yeniliklər</Link>
              <Link href="/haqqimizda" className="transition hover:text-ink">Haqqımızda</Link>
              <Link href="/elaqe" className="transition hover:text-ink">Əlaqə</Link>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/elaqe#new-club" className="hidden rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark sm:inline-flex">+ Klubunu əlavə et</Link>
              <Link href="/elaqe#new-club" className="inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-2.5 text-[11px] font-bold text-white shadow-sm transition active:scale-[0.98] sm:hidden"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-sm leading-none" aria-hidden="true">+</span>Klubunu əlavə et</Link>
            </div>
          </div>
        </header>

        <main
          data-mobile-scroll-root="true"
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain md:overflow-visible md:overscroll-auto"
        >
          {children}
        </main>

        <footer className="hidden border-t border-border bg-surface md:block">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-xs text-muted sm:px-6 lg:px-8">
            <span className="font-semibold text-ink">© 2026 GameYer</span>
            <Link href="/populyar-klublar" className="hover:text-ink">Populyar klublar</Link>
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

        <MobileNav />
        </div>
      </body>
    </html>
  );
}
