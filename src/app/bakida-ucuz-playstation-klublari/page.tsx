import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

export const metadata: Metadata = {
  title: 'Bakıda ucuz PlayStation klubları — 3 AZN-dək qiymətlər',
  description: 'Bakıda ucuz PlayStation klub axtarırsan? Saatlıq qiyməti 3 AZN-dək olan PS4 və PS5 gaming klublarını ünvan, rayon, iş saatı və xəritə ilə müqayisə et.',
  alternates: { canonical: '/bakida-ucuz-playstation-klublari' },
  openGraph: { type: 'website', locale: 'az_AZ', url: '/bakida-ucuz-playstation-klublari', title: 'Bakıda ucuz PlayStation klubları | GameYer', description: 'Saatlıq qiyməti 3 AZN-dək olan Bakı PlayStation klublarını müqayisə et.' },
};

function psMinPrice(club: Awaited<ReturnType<typeof getClubs>>[number]) {
  const prices = club.pricing.filter((item) => item.club_type?.slug === 'playstation' && item.unit === 'saat' && item.price_from > 0).map((item) => item.price_from);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

export default async function CheapPlayStationClubsPage() {
  const clubs = (await getClubs({ type: 'playstation', priceMax: 3 })).sort((a, b) => psMinPrice(a) - psMinPrice(b));
  const districtCounts = new Map<string, { slug: string; name: string; count: number }>();
  for (const club of clubs) {
    if (!club.district?.slug) continue;
    const current = districtCounts.get(club.district.slug);
    districtCounts.set(club.district.slug, { slug: club.district.slug, name: club.district.name, count: (current?.count ?? 0) + 1 });
  }
  const districts = [...districtCounts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'az'));
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/bakida-ucuz-playstation-klublari`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Bakıda PlayStation klubları', item: `${siteUrl}/bakida-playstation-klublari` },
        { '@type': 'ListItem', position: 3, name: 'Bakıda ucuz PlayStation klubları', item: url },
      ] },
      { '@type': 'ItemList', name: 'Bakıda 3 AZN-dək PlayStation klubları', numberOfItems: clubs.length, itemListElement: clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })) },
    ],
  };

  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <nav className="mb-5 text-xs text-muted"><Link href="/">GameYer</Link> / <Link href="/bakida-playstation-klublari">PlayStation klubları</Link> / Ucuz PlayStation klubları</nav>
    <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda ucuz PlayStation klubları</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Saatlıq PlayStation qiyməti 3 AZN-dək olan Bakı gaming məkanlarını müqayisə et. Hazırda qiyməti təsdiqlənmiş {clubs.length} uyğun klub göstərilir. PS4, PS5 və VIP otaq tarifləri eyni klubda fərqli ola bilər.</p>
    <div className="mt-4 flex flex-wrap gap-2"><Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control bg-primary px-3 py-2 text-sm font-semibold text-white">Bütün gaming qiymətləri</Link><Link href="/bakida-playstation-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">Bütün PlayStation klubları</Link><Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold">24 saat klublar</Link></div>
    {districts.length > 0 ? <section className="mt-6"><h2 className="font-display text-base font-bold text-ink">Ucuz PlayStation klubları hansı rayonlardadır?</h2><p className="mt-1 text-xs leading-5 text-muted">3 AZN-dək qiyməti olan PlayStation klublarının yerləşdiyi rayonlara keç.</p><div className="mt-3 flex flex-wrap gap-2">{districts.map((district) => <Link key={district.slug} href={`/rayon/${district.slug}`} className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary">{district.name} ({district.count})</Link>)}</div></section> : null}
    <div className="mt-7"><SeoClubList clubs={clubs} /></div>
    <section className="mt-10 rounded-card border border-border bg-surface p-5"><h2 className="font-display text-lg font-bold">Ucuz PlayStation klubu necə seçmək olar?</h2><p className="mt-2 text-sm leading-6 text-muted">Konsol modelini, otağın standart və ya VIP olmasını, saatlıq tarifi, gecə qiymətlərini və iş saatlarını müqayisə et. Minimum qiymətin hansı konsol və tarifə aid olduğunu klub profilində yoxla.</p></section>
  </div>;
}
