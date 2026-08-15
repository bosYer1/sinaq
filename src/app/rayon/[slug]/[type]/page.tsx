import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts } from '@/lib/queries/districts';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

interface DistrictTypePageProps { params: Promise<{ slug: string; type: string }> }

function typeLabel(type: string) { return type === 'pc' ? 'PC' : 'PlayStation'; }

const getPageData = cache(async (slug: string, type: string) => {
  if (type !== 'pc' && type !== 'playstation') return null;
  const [districts, clubs] = await Promise.all([getDistricts(), getClubs({ district: slug, type })]);
  const district = districts.find((item) => item.slug === slug);
  if (!district || clubs.length < 2) return null;
  return { district, clubs };
});

export async function generateMetadata({ params }: DistrictTypePageProps): Promise<Metadata> {
  const { slug, type } = await params;
  const data = await getPageData(slug, type);
  if (!data) return { title: 'Klublar tapılmadı', robots: { index: false, follow: true } };
  const label = typeLabel(type);
  const canonical = `/rayon/${data.district.slug}/${type}`;
  const title = `${data.district.name} rayonunda ${label} klubları`;
  const description = `${data.district.name} rayonundakı ${data.clubs.length} aktiv ${label} gaming klubunu GameYer-də müqayisə et. Ünvan, qiymət, iş saatı və xəritə məlumatlarına bax.`;
  return { title, description, alternates: { canonical }, openGraph: { type: 'website', locale: 'az_AZ', url: canonical, title: `${title} | GameYer`, description }, twitter: { card: 'summary', title: `${title} | GameYer`, description } };
}

export default async function DistrictTypePage({ params }: DistrictTypePageProps) {
  const { slug, type } = await params;
  const data = await getPageData(slug, type);
  if (!data) notFound();
  const label = typeLabel(type);
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/rayon/${data.district.slug}/${type}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: `${data.district.name} klubları`, item: `${siteUrl}/rayon/${data.district.slug}` },
        { '@type': 'ListItem', position: 3, name: `${label} klubları`, item: pageUrl },
      ] },
      { '@type': 'ItemList', name: `${data.district.name} rayonunda ${label} klubları`, numberOfItems: data.clubs.length, itemListElement: data.clubs.map((club, index) => ({ '@type': 'ListItem', position: index + 1, name: club.name, url: `${siteUrl}/klub/${club.slug}` })) },
    ],
  };
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb"><Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <Link href={`/rayon/${data.district.slug}`} className="hover:text-ink">{data.district.name}</Link> <span aria-hidden="true">/</span> <span>{label}</span></nav>
    <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{data.district.name} rayonunda {label} klubları</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{data.district.name} ərazisində {label} klub axtaranlar üçün {data.clubs.length} aktiv məkanı bir yerdə müqayisə et. Ünvan, xəritə, iş saatları və mövcud olduqda qiymət məlumatları klub səhifələrində göstərilir.</p>
    <div className="mt-7"><SeoClubList clubs={data.clubs} /></div>
    <div className="mt-8 flex flex-wrap gap-2"><Link href={`/?district=${encodeURIComponent(data.district.slug)}&type=${type}&view=map`} className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Xəritədə göstər</Link><Link href={`/rayon/${data.district.slug}`} className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">{data.district.name} üzrə bütün klublar</Link><Link href={type === 'pc' ? '/bakida-pc-klublari' : '/bakida-playstation-klublari'} className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Bakı üzrə {label} klubları</Link></div>
  </div>;
}
