import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts } from '@/lib/queries/districts';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

interface DistrictTypePageProps {
  params: Promise<{ slug: string; type: string }>;
}

const getComboClubs = cache((district: string, type: string) => getClubs({ district, type }));

function typeLabel(type: string) {
  if (type === 'pc') return 'PC';
  if (type === 'playstation') return 'PlayStation';
  return null;
}

export async function generateMetadata({ params }: DistrictTypePageProps): Promise<Metadata> {
  const { slug, type } = await params;
  const label = typeLabel(type);
  const districts = await getDistricts();
  const district = districts.find((item) => item.slug === slug);
  if (!district || !label) return { title: 'Səhifə tapılmadı', robots: { index: false, follow: false } };

  const clubs = await getComboClubs(slug, type);
  const canonical = `/rayon/${slug}/${type}`;
  const title = `${district.name} rayonunda ${label} klubları`;
  const description = `${district.name} rayonunda ${label} klub axtarırsan? ${clubs.length} aktiv klubu ünvan, qiymət, iş saatları və xəritə məlumatları ilə GameYer-də müqayisə et.`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: clubs.length >= 2 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', locale: 'az_AZ', url: canonical, title: `${title} | GameYer`, description },
    twitter: { card: 'summary', title: `${title} | GameYer`, description },
  };
}

export default async function DistrictTypePage({ params }: DistrictTypePageProps) {
  const { slug, type } = await params;
  const label = typeLabel(type);
  const [districts, clubs] = await Promise.all([getDistricts(), getComboClubs(slug, type)]);
  const district = districts.find((item) => item.slug === slug);
  if (!district || !label) notFound();

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/rayon/${slug}/${type}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: `${district.name} klubları`, item: `${siteUrl}/rayon/${slug}` },
          { '@type': 'ListItem', position: 3, name: `${label} klubları`, item: pageUrl },
        ],
      },
      {
        '@type': 'ItemList',
        name: `${district.name} rayonunda ${label} klubları`,
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
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span>{' '}
        <Link href={`/rayon/${slug}`} className="hover:text-ink">{district.name}</Link> <span aria-hidden="true">/</span>{' '}
        <span>{label}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{district.name} rayonunda {label} klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        {district.name} rayonunda {label} klub axtaranlar üçün aktiv məkanları müqayisə et. Hazırda {clubs.length} klub göstərilir. Klub səhifələrində ünvan, xəritə, iş saatları və mövcud olduqda qiymət məlumatı var.
      </p>
      <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/?district=${encodeURIComponent(slug)}&type=${encodeURIComponent(type)}&view=map`} className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Xəritədə göstər</Link>
        <Link href={`/rayon/${slug}`} className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">{district.name} üzrə bütün klublar</Link>
        <Link href={type === 'pc' ? '/bakida-pc-klublari' : '/bakida-playstation-klublari'} className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Bakı üzrə {label} klubları</Link>
      </div>
    </div>
  );
}
