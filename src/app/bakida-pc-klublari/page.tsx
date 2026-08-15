import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

export const metadata: Metadata = {
  title: 'Bakıda PC və kompüter klubları — qiymətlər və ünvanlar',
  description: 'Bakıda PC klub, kompüter klubu və internet klub axtarırsan? Gaming məkanlarını qiymət, ünvan, rayon, iş saatları və xəritə ilə GameYer-də müqayisə et.',
  alternates: { canonical: '/bakida-pc-klublari' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: '/bakida-pc-klublari',
    title: 'Bakıda PC və kompüter klubları | GameYer',
    description: 'Bakıdakı PC, kompüter və internet klublarını qiymət, ünvan və xəritə məlumatları ilə müqayisə et.',
  },
};

export default async function BakuPcClubsPage() {
  const clubs = await getClubs({ type: 'pc' });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/bakida-pc-klublari`;
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Bakıda PC klubları', item: url },
      ] },
      { '@type': 'ItemList', name: 'Bakıda PC və kompüter klubları', numberOfItems: clubs.length, itemListElement: clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })) },
    ],
  };

  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
    <nav className="mb-5 text-xs text-muted"><Link href="/">GameYer</Link> / Bakıda PC klubları</nav>
    <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda PC və kompüter klubları</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Bakıda PC klub, kompüter klubu, internet klub və internet-kafe kimi axtarılan gaming məkanlarını bir yerdə müqayisə et. Hazırda {clubs.length} PC klubu göstərilir. Klub səhifəsindən ünvanı, xəritəni, iş saatlarını və mövcud olduqda saatlıq qiymətləri yoxlaya bilərsən.</p>
    <div className="mt-7"><SeoClubList clubs={clubs} /></div>
    <section className="mt-10 rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-bold">PC klubunu necə seçmək olar?</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Rayonuna yaxınlığı, saatlıq qiyməti, iş saatlarını və klubun xəritədə yerini müqayisə et. Daha konkret nəticə üçün rayon səhifələrindən istifadə edə, 24 saat işləyən məkanlara baxa və ya bütün klubları xəritədə görə bilərsən.</p>
      <div className="mt-4 flex flex-wrap gap-2"><Link href="/?type=pc&view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">PC klubları xəritədə</Link><Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">24 saat PC klubları</Link><Link href="/rayon" className="rounded-control border border-border px-4 py-2 text-sm font-semibold">Rayon üzrə axtar</Link></div>
    </section>
  </div>;
}
