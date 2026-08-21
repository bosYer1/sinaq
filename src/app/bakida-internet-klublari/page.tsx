import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

export const metadata: Metadata = {
  title: 'Bakıda internet klub və kompüter klubları — qiymətlər və ünvanlar',
  description: 'Bakıda internet klub, internet kafe və kompüter klubu axtarırsan? PC gaming məkanlarını qiymət, rayon, iş saatları, ünvan və xəritə ilə müqayisə et.',
  alternates: { canonical: '/bakida-internet-klublari' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: '/bakida-internet-klublari',
    title: 'Bakıda internet və kompüter klubları | GameYer',
    description: 'Bakıdakı internet klub, internet kafe və kompüter klublarını bir yerdə müqayisə et.',
  },
};

function minPcPrice(club: Awaited<ReturnType<typeof getClubs>>[number]) {
  const prices = club.pricing.filter((item) => item.club_type?.slug === 'pc' && item.unit === 'saat' && item.price_from > 0).map((item) => item.price_from);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

export default async function BakuInternetClubsPage() {
  const clubs = await getClubs({ type: 'pc' });
  const priced = clubs.filter((club) => Number.isFinite(minPcPrice(club)));
  const minPrice = priced.length ? Math.min(...priced.map(minPcPrice)) : null;
  const districtCounts = new Map<string, { name: string; slug: string; count: number }>();

  for (const club of clubs) {
    if (!club.district?.slug) continue;
    const current = districtCounts.get(club.district.slug);
    districtCounts.set(club.district.slug, { name: club.district.name, slug: club.district.slug, count: (current?.count ?? 0) + 1 });
  }

  const districts = [...districtCounts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'az'));
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/bakida-internet-klublari`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Bakıda internet klubları', item: pageUrl },
      ] },
      { '@type': 'ItemList', name: 'Bakıda internet və kompüter klubları', numberOfItems: clubs.length, itemListElement: clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })) },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb"><Link href="/">GameYer</Link> / Internet klubları</nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda internet klub və kompüter klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">“Internet klub”, “internet kafe”, “kompüter klubu” və “PC klub” kimi axtarılan Bakı gaming məkanlarını bir siyahıda müqayisə et. Hazırda {clubs.length} aktiv PC məkanı göstərilir.{minPrice != null ? ` Məlum saatlıq tariflər ${minPrice} AZN-dən başlayır.` : ''}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/bakida-pc-klublari" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Bütün PC klubları</Link>
        <Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Qiymətləri müqayisə et</Link>
        <Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Ucuz PC klubları</Link>
        <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">24 saat klublar</Link>
      </div>

      {districts.length > 0 ? <section className="mt-6" aria-labelledby="internet-districts"><h2 id="internet-districts" className="font-display text-base font-bold text-ink">Rayon üzrə internet və kompüter klubları</h2><p className="mt-1 text-xs leading-5 text-muted">Bakı rayonları üzrə PC və internet klublarına keç.</p><div className="mt-3 flex flex-wrap gap-2">{districts.map((district) => <Link key={district.slug} href={`/rayon/${district.slug}/pc`} className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary">{district.name} ({district.count})</Link>)}</div></section> : null}

      <div className="mt-7"><SeoClubList clubs={clubs} /></div>

      <section className="mt-10 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">Internet klubla PC klub arasında fərq varmı?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Azərbaycanda “internet klub”, “internet kafe”, “kompüter klubu” və “PC klub” ifadələri çox vaxt eyni tip məkan üçün işlədilir. Müasir klublar əsasən oyun kompüterləri, sürətli internet, gaming monitor və periferiyalar təklif edir. GameYer bu məkanları PC kateqoriyasında birləşdirib qiymət, ünvan və iş saatlarına görə müqayisə etməyə imkan verir.</p>
      </section>
    </div>
  );
}
