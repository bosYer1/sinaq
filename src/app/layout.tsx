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

export const viewport: Viewport = { themeColor: '#7C5CFC', colorScheme: 'light' };
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'GameYer — Bakıda PC və PlayStation klubları', template: '%s | GameYer' },
  description: 'Bakıda PC klub, kompüter klubu və PlayStation klub tap. Qiymət, ünvan, rayon, iş saatları və xəritəyə görə gaming klublarını GameYer-də müqayisə et.',
  applicationName: 'GameYer', manifest: '/manifest.webmanifest', verification: { google: googleVerification },
  appleWebApp: { capable: true, title: 'GameYer', statusBarStyle: 'default' }, alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'az_AZ', url: '/', siteName: 'GameYer', title: 'GameYer — Bakıda PC və PlayStation klubları', description: 'Bakıda PC, kompüter və PlayStation klublarını qiymət, ünvan və xəritə məlumatları ilə tap.' },
  twitter: { card: 'summary_large_image', title: 'GameYer — Bakıda gaming klubu tap', description: 'PC və PlayStation klublarını xəritə, rayon və qiymətə görə tap.' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="az" className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}><body className="bg-bg font-body text-ink antialiased">
    <PageViewTracker />
    <header className="sticky top-0 z-30 border-b border-border bg-surface"><div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2" aria-label="GameYer ana səhifə"><span className="flex h-7 w-7 items-center justify-center rounded-control bg-primary text-sm font-bold text-white">G</span><span className="font-display text-base font-bold tracking-tight text-ink">Game<span className="text-primary">Yer</span></span></Link>
      <nav className="flex items-center gap-3 text-[11px] font-medium text-muted sm:gap-4 sm:text-xs" aria-label="Əsas keçidlər"><Link href="/rayon" className="hidden transition hover:text-ink sm:inline">Rayonlar</Link><Link href="/tip" className="hidden transition hover:text-ink sm:inline">PC / PS</Link><Link href="/klub-sahibi" className="hidden transition hover:text-primary md:inline">Klub sahibləri</Link><Link href="/elaqe" className="transition hover:text-ink">Əlaqə</Link><Link href="/mexfilik" className="hidden transition hover:text-ink lg:inline">Məxfilik</Link></nav>
    </div></header>
    <main>{children}</main>
    <footer className="border-t border-border bg-surface"><div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-5 text-xs text-muted sm:px-6"><span>© GameYer</span><Link href="/bakida-pc-klublari" className="font-medium hover:text-ink">Bakıda PC klubları</Link><Link href="/bakida-playstation-klublari" className="font-medium hover:text-ink">Bakıda PlayStation klubları</Link><Link href="/rayon" className="hover:text-ink">Rayonlar üzrə klublar</Link><Link href="/klub-sahibi" className="font-semibold text-primary hover:underline">Klub sahibləri üçün</Link><Link href="/elaqe" className="hover:text-ink">Əlaqə</Link></div></footer>
  </body></html>;
}
