import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getClubTypes } from '@/lib/queries/districts';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Bakıda PC və PlayStation klubları — qiymət və ünvan',
  description: 'Bakıda PC, kompüter, internet və PlayStation klublarını kateqoriyaya görə tap. Qiymət, ünvan, rayon, iş saatı və xəritə məlumatlarını GameYer-də müqayisə et.',
  alternates: { canonical: '/tip' },
  openGraph: { type: 'website', locale: 'az_AZ', url: '/tip', title: 'Bakıda PC və PlayStation klubları | GameYer', description: 'Bakıdakı PC və PlayStation gaming klublarını kateqoriyaya, qiymətə və rayona görə tap.' },
};

function displayType(slug: string, name: string) {
  if (slug === 'pc') return 'PC';
  if (slug === 'playstation') return 'PlayStation';
  return name;
}

function typeHref(slug: string) {
  if (slug === 'pc') return '/bakida-pc-klublari';
  if (slug === 'playstation') return '/bakida-playstation-klublari';
  return `/tip/${slug}`;
}

export default async function TypeIndexPage() {
  const [types, clubs] = await Promise.all([getClubTypes(), getClubs()]);
  const typeCounts = new Map<string, number>();

  for (const club of clubs) {
    for (const slug of inferClubTypeSlugs(club)) {
      typeCounts.set(slug, (typeCounts.get(slug) ?? 0) + 1);
    }
  }

  const activeTypes = types.filter((type) => (typeCounts.get(type.slug) ?? 0) > 0);
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/tip`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'PC və PlayStation klubları', item: pageUrl },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Bakıda gaming klub kateqoriyaları',
        numberOfItems: activeTypes.length,
        itemListElement: activeTypes.map((type, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${displayType(type.slug, type.name)} klubları`,
          url: `${siteUrl}${typeHref(type.slug)}`,
        })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb"><Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>Klub tipləri</span></nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda PC və PlayStation klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Oynamaq istədiyin platformanı seç və Bakıdakı uyğun gaming klublarını qiymət, rayon, iş saatları və xəritə məlumatları ilə müqayisə et.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {activeTypes.map((type) => {
          const label = displayType(type.slug, type.name);
          const count = typeCounts.get(type.slug) ?? 0;
          return <Link key={type.id} href={typeHref(type.slug)} className="rounded-card border border-border bg-surface p-5 shadow-card transition hover:border-border-strong hover:shadow-card-hover"><span className="font-display text-lg font-semibold text-ink">{label} klubları</span><span className="mt-1 block text-xs text-muted">{count} aktiv klub · müqayisə et →</span></Link>;
        })}
      </div>

      <section className="mt-8 rounded-card border border-border bg-surface p-5" aria-labelledby="popular-searches-heading">
        <h2 id="popular-searches-heading" className="font-display text-lg font-bold text-ink">Populyar gaming klub axtarışları</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Qiymət və iş saatına görə daha konkret seçim etmək üçün aşağıdakı siyahılara keç.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Ucuz PC klubları</Link>
          <Link href="/bakida-ucuz-playstation-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Ucuz PlayStation klubları</Link>
          <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">24 saat gaming klubları</Link>
          <Link href="/rayon" className="rounded-control border border-border px-4 py-2 text-sm font-semibold text-ink">Rayon üzrə klublar</Link>
        </div>
      </section>
    </div>
  );
}
