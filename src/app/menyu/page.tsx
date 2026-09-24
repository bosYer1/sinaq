import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Menyu',
  description: 'GameYer-də klub axtarışı, kateqoriyalar, rayonlar, yeniliklər və məlumat səhifələrinə sürətli keçid.',
  alternates: { canonical: '/menyu' },
};

type IconName =
  | 'nearby'
  | 'pc'
  | 'playstation'
  | 'price'
  | 'clock'
  | 'district'
  | 'pin'
  | 'spark'
  | 'info'
  | 'shield'
  | 'owner'
  | 'contact'
  | 'privacy';

const discoveryLinks: Array<{
  href: string;
  title: string;
  description: string;
  icon: IconName;
  featured?: boolean;
}> = [
  {
    href: '/yaxinliqda-gaming-klublari',
    title: 'Yaxınlıqdakı klublar',
    description: 'Sənə ən yaxın gaming məkanlarını tap',
    icon: 'nearby',
    featured: true,
  },
  { href: '/bakida-pc-klublari', title: 'PC klubları', description: 'PC və kompüter klubları', icon: 'pc' },
  { href: '/bakida-playstation-klublari', title: 'PlayStation', description: 'PS məkanlarını kəşf et', icon: 'playstation' },
  { href: '/bakida-gaming-klub-qiymetleri', title: 'Qiymətlər', description: 'Saatlıq tarifləri müqayisə et', icon: 'price' },
  { href: '/bakida-24-saat-gaming-klublari', title: '24/7 açıq', description: 'Gecə-gündüz açıq klublar', icon: 'clock' },
  { href: '/rayon', title: 'Rayonlar', description: 'Rayon üzrə klub seç', icon: 'district' },
  { href: '/28-may-gaming-klublari', title: '28 May', description: '28 May ərazisində klublar', icon: 'pin' },
];

const gameYerLinks: Array<{ href: string; title: string; description: string; icon: IconName }> = [
  { href: '/yenilikler', title: 'Yeniliklər', description: 'Turnirlər və xüsusi təkliflər', icon: 'spark' },
  { href: '/haqqimizda', title: 'GameYer haqqında', description: 'Platformanın məqsədi', icon: 'info' },
  { href: '/melumat-metodologiyasi', title: 'Məlumat yoxlaması', description: 'Məlumatları necə təsdiqləyirik', icon: 'shield' },
  { href: '/elaqe#new-club', title: 'Klub əlavə et', description: 'Klubun adı və əlaqə nömrəsini göndər', icon: 'owner' },
  { href: '/elaqe', title: 'Əlaqə', description: 'Klub təklif et və ya düzəliş bildir', icon: 'contact' },
  { href: '/mexfilik', title: 'Məxfilik', description: 'Məlumatların istifadəsi', icon: 'privacy' },
];

function MenuIcon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

  if (name === 'nearby') {
    return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="8" /></svg>;
  }
  if (name === 'pc') {
    return <svg {...common}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>;
  }
  if (name === 'playstation') {
    return <svg {...common}><path d="M8.5 8.5 6 9.3a3.5 3.5 0 0 0-2.2 2.2L3 15a2.7 2.7 0 0 0 4.5 2.6l2.1-2.1h4.8l2.1 2.1A2.7 2.7 0 0 0 21 15l-.8-3.5A3.5 3.5 0 0 0 18 9.3l-2.5-.8" /><path d="M9 11v4M7 13h4M16.5 12h.01M18 14h.01" /></svg>;
  }
  if (name === 'price') {
    return <svg {...common}><path d="M12 3v18M16 7.5c0-1.4-1.8-2.5-4-2.5S8 6.1 8 7.5 9.8 10 12 10s4 1.1 4 2.5S14.2 15 12 15s-4-1.1-4-2.5" /></svg>;
  }
  if (name === 'clock') {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  }
  if (name === 'district') {
    return <svg {...common}><path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" /><path d="M9 4v14M15 6v14" /></svg>;
  }
  if (name === 'pin') {
    return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  }
  if (name === 'spark') {
    return <svg {...common}><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></svg>;
  }
  if (name === 'info') {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></svg>;
  }
  if (name === 'shield') {
    return <svg {...common}><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" /><path d="m9.5 12 1.7 1.7 3.4-3.7" /></svg>;
  }
  if (name === 'owner') {
    return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" /><path d="M18 6h3M19.5 4.5v3" /></svg>;
  }
  if (name === 'contact') {
    return <svg {...common}><path d="M4 5h16v12H8l-4 4V5Z" /><path d="M8 9h8M8 13h5" /></svg>;
  }
  return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
}

export default function MenuPage() {
  return (
    <div className="min-h-full md:min-h-[calc(100vh-64px)] bg-bg-elevated">
      <div className="mx-auto max-w-4xl px-4 pb-10 pt-4 sm:px-6 sm:pb-12 sm:pt-8">
        <header className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-surface px-5 py-5 shadow-[0_18px_50px_rgba(31,35,48,0.06)] sm:px-6 sm:py-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">GameYer</p>
            <div className="mt-1 flex items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-[28px] font-bold tracking-[-0.04em] text-ink sm:text-3xl">Menyu</h1>
                <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
                  Klub tapmaqdan GameYer məlumatlarına qədər hər şey bir yerdə.
                </p>
              </div>
              <Link
                href="/#club-search"
                className="hidden shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-[0_10px_24px_rgba(124,92,252,0.22)] transition hover:bg-primary-dark sm:inline-flex"
              >
                Klub axtar
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <Link
              href="/#club-search"
              className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-white no-underline shadow-[0_12px_28px_rgba(124,92,252,0.22)] transition active:scale-[0.99] sm:hidden"
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
              </svg>
              Klub axtar
            </Link>
          </div>
        </header>

        <section className="mt-7" aria-labelledby="menu-discovery-heading">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <h2 id="menu-discovery-heading" className="font-display text-lg font-bold text-ink">Klub tap</h2>
              <p className="mt-0.5 text-xs text-muted">Sənə uyğun yolu seç.</p>
            </div>
            <Link href="/" className="text-xs font-semibold text-primary no-underline">Hamısı →</Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {discoveryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.featured
                  ? 'group col-span-2 flex min-h-[104px] items-center justify-between gap-4 rounded-[24px] border border-primary/15 bg-primary/10 p-4 no-underline shadow-[0_10px_30px_rgba(124,92,252,0.08)] transition hover:border-primary/30 sm:p-5'
                  : 'group min-h-[132px] rounded-[22px] border border-border bg-surface p-4 no-underline shadow-[0_8px_24px_rgba(31,35,48,0.04)] transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_12px_30px_rgba(31,35,48,0.07)]'
                }
              >
                {item.featured ? (
                  <>
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_8px_20px_rgba(124,92,252,0.2)]">
                        <MenuIcon name={item.icon} className="h-[22px] w-[22px]" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-ink">{item.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                      </div>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-lg text-primary shadow-sm transition group-hover:translate-x-0.5" aria-hidden="true">→</span>
                  </>
                ) : (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <MenuIcon name={item.icon} />
                    </span>
                    <h3 className="mt-4 text-sm font-bold text-ink">{item.title}</h3>
                    <p className="mt-1 text-[11px] leading-[18px] text-muted sm:text-xs">{item.description}</p>
                  </>
                )}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="menu-gameyer-heading">
          <div className="mb-3 px-1">
            <h2 id="menu-gameyer-heading" className="font-display text-lg font-bold text-ink">GameYer</h2>
            <p className="mt-0.5 text-xs text-muted">Platforma, dəstək və klub sahibləri üçün.</p>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-border bg-surface shadow-[0_10px_30px_rgba(31,35,48,0.04)]">
            {gameYerLinks.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex min-h-[72px] items-center gap-3.5 px-4 py-3.5 no-underline transition hover:bg-primary/5 ${index > 0 ? 'border-t border-border' : ''}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bg-elevated text-muted transition group-hover:bg-primary/10 group-hover:text-primary">
                  <MenuIcon name={item.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                  <p className="mt-0.5 truncate text-xs text-muted">{item.description}</p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-muted transition group-hover:bg-primary/10 group-hover:text-primary" aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="menu-social-heading">
          <div className="mb-3 px-1">
            <h2 id="menu-social-heading" className="font-display text-lg font-bold text-ink">Bizi izlə</h2>
            <p className="mt-0.5 text-xs text-muted">Yeni klublar və gaming yenilikləri.</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <a
              href="https://www.instagram.com/gameyer.az/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-[22px] border border-border bg-surface p-4 no-underline shadow-[0_8px_24px_rgba(31,35,48,0.04)] transition hover:border-primary/25"
            >
              <div>
                <p className="text-sm font-bold text-ink">Instagram</p>
                <p className="mt-0.5 text-[11px] text-muted">@gameyer.az</p>
              </div>
              <span className="text-primary" aria-hidden="true">↗</span>
            </a>
            <a
              href="https://www.tiktok.com/@gameyer.az"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-[22px] border border-border bg-surface p-4 no-underline shadow-[0_8px_24px_rgba(31,35,48,0.04)] transition hover:border-primary/25"
            >
              <div>
                <p className="text-sm font-bold text-ink">TikTok</p>
                <p className="mt-0.5 text-[11px] text-muted">@gameyer.az</p>
              </div>
              <span className="text-primary" aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
