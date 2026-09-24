import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Menyu',
  description: 'GameYer-də klub axtarışı, kateqoriyalar, rayonlar, yeniliklər və məlumat səhifələrinə sürətli keçid.',
  alternates: { canonical: '/menyu' },
};

const discoveryLinks = [
  { href: '/yaxinliqda-gaming-klublari', title: 'Yaxınlıqdakı klublar', description: 'Lokasiyana yaxın gaming məkanları' },
  { href: '/bakida-pc-klublari', title: 'PC klubları', description: 'PC və kompüter klubları' },
  { href: '/bakida-playstation-klublari', title: 'PlayStation klubları', description: 'PlayStation məkanları' },
  { href: '/bakida-gaming-klub-qiymetleri', title: 'Klub qiymətləri', description: 'Dərc olunan tarifləri müqayisə et' },
  { href: '/bakida-24-saat-gaming-klublari', title: '24 saat açıq klublar', description: '24/7 göstərilən məkanlar' },
  { href: '/rayon', title: 'Rayonlar', description: 'Klubları rayon üzrə kəşf et' },
];

const gameYerLinks = [
  { href: '/yenilikler', title: 'Yeniliklər', description: 'Turnirlər və xüsusi təkliflər' },
  { href: '/haqqimizda', title: 'GameYer haqqında', description: 'Platformanın məqsədi və necə işlədiyi' },
  { href: '/melumat-metodologiyasi', title: 'Məlumat metodologiyası', description: 'Klub məlumatlarını necə yoxlayırıq' },
  { href: '/klub-sahibi', title: 'Klubunu əlavə et', description: 'Klub sahibisənsə müraciət et' },
  { href: '/elaqe', title: 'Əlaqə', description: 'Bizimlə əlaqə saxla' },
  { href: '/mexfilik', title: 'Məxfilik', description: 'Məxfilik qaydaları' },
];

export default function MenuPage() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-bg-elevated">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">GameYer</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl">Menyu</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Klub axtarışı, kateqoriyalar və GameYer məlumatlarına bir yerdən keç.
          </p>
        </header>

        <section className="mt-6" aria-labelledby="menu-discovery-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="menu-discovery-heading" className="font-display text-lg font-bold text-ink">Klub tap</h2>
              <p className="mt-0.5 text-xs text-muted">Axtarışı daha konkretləşdir.</p>
            </div>
            <Link href="/" className="text-xs font-semibold text-primary no-underline">Ana axtarış →</Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {discoveryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-border bg-surface p-4 no-underline shadow-[0_8px_24px_rgba(31,35,48,0.04)] transition hover:border-primary/40 hover:shadow-[0_12px_32px_rgba(31,35,48,0.08)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-ink">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                  </div>
                  <span className="shrink-0 text-lg text-primary transition group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-7" aria-labelledby="menu-gameyer-heading">
          <h2 id="menu-gameyer-heading" className="font-display text-lg font-bold text-ink">GameYer</h2>
          <p className="mt-0.5 text-xs text-muted">Platforma və digər bölmələr.</p>

          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
            {gameYerLinks.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between gap-4 px-4 py-4 no-underline transition hover:bg-bg ${index > 0 ? 'border-t border-border' : ''}`}
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                  <p className="mt-0.5 text-xs leading-5 text-muted">{item.description}</p>
                </div>
                <span className="shrink-0 text-base text-muted transition group-hover:text-primary" aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-primary/15 bg-primary/5 p-4" aria-label="GameYer sosial şəbəkələri">
          <h2 className="text-sm font-bold text-ink">GameYer-i izlə</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Yeni klublar, turnirlər və yeniliklər üçün sosial hesablarımız.</p>
          <div className="mt-3 flex gap-2">
            <a
              href="https://www.instagram.com/gameyer.az/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-control bg-primary px-4 py-2 text-xs font-semibold text-white no-underline"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@gameyer.az"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-control border border-border bg-surface px-4 py-2 text-xs font-semibold text-ink no-underline"
            >
              TikTok
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
