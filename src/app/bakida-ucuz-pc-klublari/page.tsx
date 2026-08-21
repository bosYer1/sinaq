import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

export const metadata: Metadata = {
  title: 'Bakıda ucuz PC klubları — 2 AZN-dək saatlıq qiymətlər',
  description: 'Bakıda ucuz PC klub axtarırsan? Saatlıq qiyməti 2 AZN-dək olan PC və kompüter klublarını ünvan, rayon, iş saatı və xəritə ilə müqayisə et.',
  alternates: { canonical: '/bakida-ucuz-pc-klublari' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: '/bakida-ucuz-pc-klublari',
    title: 'Bakıda ucuz PC klubları | GameYer',
    description: 'Saatlıq qiyməti 2 AZN-dək olan Bakı PC klublarını müqayisə et.',
  },
};

function pcMinPrice(club: Awaited<ReturnType<typeof getClubs>>[number]) {
  const prices = club.pricing
    .filter((item) => item.club_type?.slug === 'pc' && item.unit === 'saat' && item.price_from > 0)
    .map((item) => item.price_from);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

export default async function CheapPcClubsPage() {
  const clubs = (await getClubs({ type: 'pc', priceMax: 2 })).sort((a, b) => pcMinPrice(a) - pcMinPrice(b));
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/bakida-ucuz-pc-klublari`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Bakıda PC klubları', item: `${siteUrl}/bakida-pc-klublari` },
          { '@type': 'ListItem', position: 3, name: 'Bakıda ucuz PC klubları', item: url },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Bakıda 2 AZN-dək PC klubları',
        numberOfItems: clubs.length,
        itemListElement: clubs.map((club, index) => ({
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
      <nav className="mb-5 text-xs text-muted"><Link href="/">GameYer</Link> / <Link href="/bakida-pc-klublari">PC klubları</Link> / Ucuz PC klubları</nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda ucuz PC klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Saatlıq PC qiyməti 2 AZN-dək olan Bakı gaming klublarını bir siyahıda müqayisə et. Hazırda qiyməti təsdiqlənmiş {clubs.length} uyğun klub göstərilir. Qiymət tarif və saat aralığına görə dəyişə bildiyi üçün klub səhifəsində detallı tarifləri yoxla.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/bakida-pc-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">Bütün PC klubları</Link>
        <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">24 saat klublar</Link>
        <Link href="/rayon" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">Rayona görə tap</Link>
      </div>
      <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      <section className="mt-10 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold">Ucuz PC klub seçəndə nəyə baxmaq lazımdır?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Təkcə minimum qiymətə yox, kompüter zonasına, tarifin keçərli olduğu saatlara, iş saatlarına və klubun sənə məsafəsinə də bax. Bəzi məkanlarda gecə və paket tarifləri gündüz qiymətindən daha sərfəli ola bilər.</p>
      </section>
    </div>
  );
}
