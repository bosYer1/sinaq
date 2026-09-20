import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getClubPopularityMetrics } from '@/lib/queries/club-popularity';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { isPremiumActive } from '@/lib/utils';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ən çox baxılan gaming klubları — Populyar klublar',
  description: 'GameYer-də son 30 gündə real klub profil baxışlarına görə ən çox maraq görən PC və PlayStation klublarına bax.',
  alternates: { canonical: '/populyar-klublar' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: '/populyar-klublar',
    title: 'Populyar gaming klubları | GameYer',
    description: 'Son 30 gündə real istifadəçi baxışlarına görə GameYer-də ən çox maraq görən gaming klubları.',
  },
};

function typeLabel(club: Awaited<ReturnType<typeof getClubs>>[number]) {
  return inferClubTypeSlugs(club)
    .map((slug) => (slug === 'pc' ? 'PC' : 'PlayStation'))
    .join(' + ');
}

export default async function PopularClubsPage() {
  const [clubs, metrics] = await Promise.all([getClubs(), getClubPopularityMetrics()]);
  const metricBySlug = new Map(metrics.map((metric) => [metric.slug, metric]));

  // This page is an organic ranking. Premium status is displayed transparently
  // but never changes the rank here.
  const ranked = clubs
    .map((club) => ({ club, metric: metricBySlug.get(club.slug) }))
    .filter((item) => (item.metric?.sessions ?? 0) > 0)
    .sort((a, b) =>
      (b.metric?.sessions ?? 0) - (a.metric?.sessions ?? 0)
      || (b.metric?.views ?? 0) - (a.metric?.views ?? 0)
      || a.club.name.localeCompare(b.club.name, 'az')
    )
    .slice(0, 20);

  const siteUrl = getSiteUrl();
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'GameYer-də ən çox baxılan gaming klubları',
    numberOfItems: ranked.length,
    itemListElement: ranked.map(({ club }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: club.name,
      url: `${siteUrl}/klub/${club.slug}`,
    })),
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>Populyar klublar</span>
      </nav>

      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Son 30 gün</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Ən çox baxılan klublar</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Sıralama GameYer-də klub profillərinə daxil olan unikal sessiyalara əsaslanır. Təkrar baxışlar yalnız bərabərlik zamanı nəzərə alınır.
          Premium status bu səhifədə orqanik sıralamaya təsir etmir.
        </p>
      </div>

      {ranked.length > 0 ? (
        <ol className="mt-7 grid gap-3">
          {ranked.map(({ club }, index) => {
            const label = typeLabel(club);
            const premium = isPremiumActive(club);
            return (
              <li key={club.id}>
                <Link
                  href={`/klub/${encodeURIComponent(club.slug)}`}
                  className="flex items-center gap-4 rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-border-strong hover:shadow-card-hover"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-base font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-display text-base font-bold text-ink">{club.name}</span>
                      {premium ? <span className="rounded-full bg-warn-tint px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-warn">Premium</span> : null}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {club.district?.name ?? 'Bakı'}{club.address ? ` · ${club.address}` : ''}{label ? ` · ${label}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-primary">Kluba bax →</span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-7 rounded-card border border-border bg-surface p-5 text-sm text-muted">
          Populyarlıq məlumatı hazırda yenilənir. Klub siyahısına ana səhifədən baxa bilərsən.
        </div>
      )}

      <section className="mt-8 rounded-card border border-primary/15 bg-primary/5 p-5">
        <h2 className="font-display text-lg font-bold text-ink">Premium və populyarlıq fərqlidir</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Əsas klub siyahısında aktiv Premium klublar əlavə görünürlük əldə edir və yuxarı yerləşdirilir. Bu səhifədə isə sıralama yalnız real istifadəçi marağına əsaslanır.
        </p>
      </section>
    </main>
  );
}
