import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

export const metadata: Metadata = {
  title: 'Bakıda gaming klub qiymətləri — PC və PlayStation saatlıq tariflər',
  description: 'Bakıda PC, kompüter və PlayStation klub qiymətlərini müqayisə et. Saatlıq tariflər, ünvan, rayon, iş saatları və xəritə məlumatlarına GameYer-də bax.',
  alternates: { canonical: '/bakida-gaming-klub-qiymetleri' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: '/bakida-gaming-klub-qiymetleri',
    title: 'Bakıda gaming klub qiymətləri | GameYer',
    description: 'PC və PlayStation klublarının saatlıq qiymətlərini və məkan məlumatlarını müqayisə et.',
  },
};

function minPriceForType(club: Awaited<ReturnType<typeof getClubs>>[number], type: 'pc' | 'playstation') {
  const prices = club.pricing
    .filter((item) => item.club_type?.slug === type && item.unit === 'saat' && item.price_from > 0)
    .map((item) => item.price_from);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

export default async function GamingClubPricesPage() {
  const clubs = await getClubs();
  const pricedPc = clubs.filter((club) => Number.isFinite(minPriceForType(club, 'pc'))).sort((a, b) => minPriceForType(a, 'pc') - minPriceForType(b, 'pc'));
  const pricedPs = clubs.filter((club) => Number.isFinite(minPriceForType(club, 'playstation'))).sort((a, b) => minPriceForType(a, 'playstation') - minPriceForType(b, 'playstation'));
  const pcPrices = pricedPc.map((club) => minPriceForType(club, 'pc'));
  const psPrices = pricedPs.map((club) => minPriceForType(club, 'playstation'));
  const pcMin = pcPrices.length ? Math.min(...pcPrices) : null;
  const pcMax = pcPrices.length ? Math.max(...pcPrices) : null;
  const psMin = psPrices.length ? Math.min(...psPrices) : null;
  const psMax = psPrices.length ? Math.max(...psPrices) : null;
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/bakida-gaming-klub-qiymetleri`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Gaming klub qiymətləri', item: pageUrl },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Bakıda qiyməti məlum gaming klubları',
        numberOfItems: new Set([...pricedPc.map((club) => club.id), ...pricedPs.map((club) => club.id)]).size,
        itemListElement: Array.from(new Map([...pricedPc, ...pricedPs].map((club) => [club.id, club])).values()).map((club, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: club.name,
          url: `${siteUrl}/klub/${club.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted"><Link href="/">GameYer</Link> / Gaming klub qiymətləri</nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda gaming klub qiymətləri</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Bakıda PC, kompüter və PlayStation klublarının məlum saatlıq tariflərini müqayisə et. Qiymətlər klubun zona, konsol və tarifinə görə dəyişə bilər; son detalları hər klubun profilində yoxla.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <section className="rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-bold text-ink">PC klub qiymətləri</h2>
          <p className="mt-2 text-sm text-muted">{pcMin != null && pcMax != null ? `Mövcud saatlıq PC tarifləri ${pcMin}–${pcMax} AZN aralığındadır.` : 'Hazırda təsdiqlənmiş PC qiyməti yoxdur.'}</p>
          <Link href="/bakida-pc-klublari" className="mt-3 inline-flex text-sm font-semibold text-primary">Bütün PC klubları →</Link>
        </section>
        <section className="rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-bold text-ink">PlayStation klub qiymətləri</h2>
          <p className="mt-2 text-sm text-muted">{psMin != null && psMax != null ? `Mövcud saatlıq PlayStation tarifləri ${psMin}–${psMax} AZN aralığındadır.` : 'Hazırda təsdiqlənmiş PlayStation qiyməti yoxdur.'}</p>
          <Link href="/bakida-playstation-klublari" className="mt-3 inline-flex text-sm font-semibold text-primary">Bütün PlayStation klubları →</Link>
        </section>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">Ucuz PC klubları</Link>
        <Link href="/bakida-ucuz-playstation-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">Ucuz PlayStation klubları</Link>
        <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">24 saat klublar</Link>
        <Link href="/rayon" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">Rayona görə tap</Link>
      </div>

      {pricedPc.length > 0 ? <section className="mt-9"><h2 className="mb-4 font-display text-xl font-bold text-ink">Qiyməti məlum PC klubları</h2><SeoClubList clubs={pricedPc} /></section> : null}
      {pricedPs.length > 0 ? <section className="mt-9"><h2 className="mb-4 font-display text-xl font-bold text-ink">Qiyməti məlum PlayStation klubları</h2><SeoClubList clubs={pricedPs} /></section> : null}

      <section className="mt-10 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">Gaming klub qiyməti nədən asılıdır?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">PC klublarında kompüter zonası, monitor və avadanlıq səviyyəsi, PlayStation məkanlarında isə konsol modeli və VIP otaq qiymətə təsir edə bilər. Gecə paketləri və uzunmüddətli tariflər də standart saatlıq qiymətdən fərqli ola bilər.</p>
      </section>
    </div>
  );
}
