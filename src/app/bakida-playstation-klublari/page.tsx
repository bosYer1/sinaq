import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

const title = 'Bakıda PlayStation klubları — PS klub qiymətləri və ünvanlar';
const description = 'Bakıda PlayStation və PS klub axtarırsan? PlayStation klublarını qiymət, ünvan, rayon, iş saatı və xəritə məlumatları ilə GameYer-də müqayisə et.';

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getClubs({ type: 'playstation' });
  return {
    title,
    description,
    alternates: { canonical: '/bakida-playstation-klublari' },
    robots: clubs.length > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', locale: 'az_AZ', url: '/bakida-playstation-klublari', title: 'Bakıda PlayStation klubları | GameYer', description: 'Bakıdakı PlayStation və PS klublarını qiymət, ünvan və xəritə məlumatları ilə müqayisə et.' },
  };
}

export default async function BakuPlayStationClubsPage() {
  const clubs = await getClubs({ type: 'playstation' });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/bakida-playstation-klublari`;
  const districtCounts = new Map<string, { slug: string; name: string; count: number }>();

  for (const club of clubs) {
    if (!club.district?.slug) continue;
    const current = districtCounts.get(club.district.slug);
    districtCounts.set(club.district.slug, { slug: club.district.slug, name: club.district.name, count: (current?.count ?? 0) + 1 });
  }

  const strongDistricts = [...districtCounts.values()].filter((district) => district.count >= 2).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'az'));

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Bakıda PlayStation klubları', item: url },
      ] },
      { '@type': 'ItemList', name: 'Bakıda PlayStation və PS klubları', numberOfItems: clubs.length, itemListElement: clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })) },
    ],
  };

  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
    <nav className="mb-5 text-xs text-muted"><Link href="/">GameYer</Link> / Bakıda PlayStation klubları</nav>
    <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda PlayStation və PS klubları</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Bakıda PlayStation klub və PS klub axtaranlar üçün aktiv məkanları bir yerdə müqayisə et. Hazırda {clubs.length} PlayStation klubu göstərilir. Ünvan, xəritə, iş saatları və mövcud olduqda saatlıq qiymət məlumatları klub səhifələrindədir.</p>

    <div className="mt-4 flex flex-wrap gap-2">
      <Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold">PlayStation qiymətlərini müqayisə et</Link>
      <Link href="/bakida-ucuz-playstation-klublari" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Ucuz PlayStation klubları — 3 AZN-dək</Link>
      <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold">24 saat PlayStation klubları</Link>
    </div>

    {strongDistricts.length > 0 ? (
      <section className="mt-6" aria-labelledby="ps-districts-heading">
        <h2 id="ps-districts-heading" className="font-display text-base font-bold text-ink">Rayon üzrə PlayStation klubları</h2>
        <p className="mt-1 text-xs leading-5 text-muted">Ən azı 2 aktiv PlayStation klubu olan rayonlara birbaşa keç.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {strongDistricts.map((district) => (
            <Link key={district.slug} href={`/rayon/${district.slug}/playstation`} className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary">
              {district.name} PlayStation klubları ({district.count})
            </Link>
          ))}
        </div>
      </section>
    ) : null}

    <div className="mt-7"><SeoClubList clubs={clubs} /></div>
    <section className="mt-10 rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-bold">Yaxın PlayStation klubunu tap</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Rayon, qiymət, iş saatı və lokasiyaya görə müqayisə et. Xəritə görünüşü yaxın PS klublarını tapmağı, 24 saat səhifəsi gecə-gündüz açıq məkanları, rayon səhifələri isə konkret ərazidə seçim etməyi asanlaşdırır.</p>
      <div className="mt-4 flex flex-wrap gap-2"><Link href="/?type=playstation&view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">PS klubları xəritədə</Link><Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">PlayStation qiymətləri</Link><Link href="/bakida-ucuz-playstation-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">Ucuz PlayStation klubları</Link><Link href="/rayon" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">Rayon üzrə axtar</Link></div>
    </section>
  </div>;
}
