import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts } from '@/lib/queries/districts';
import { getSiteUrl } from '@/lib/site-url';
import { inferClubTypeSlugs } from '@/lib/clubType';
import { SeoClubList } from '@/components/seo/SeoClubList';

interface DistrictPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DistrictPageProps): Promise<Metadata> {
  const { slug } = await params;
  const districts = await getDistricts();
  const district = districts.find((item) => item.slug === slug);

  if (!district) {
    return { title: 'Rayon tapılmadı', robots: { index: false, follow: false } };
  }

  const title = `${district.name} rayonunda PC və PlayStation klubları`;
  const description = `${district.name} rayonundakı PC və PlayStation klublarını GameYer-də müqayisə et. Ünvan, qiymət, iş saatları və xəritə məlumatlarına bax.`;
  const canonical = `/rayon/${district.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', locale: 'az_AZ', url: canonical, title: `${title} | GameYer`, description },
    twitter: { card: 'summary', title: `${title} | GameYer`, description },
  };
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { slug } = await params;
  const [districts, clubs] = await Promise.all([getDistricts(), getClubs({ district: slug })]);
  const district = districts.find((item) => item.slug === slug);
  if (!district) notFound();

  const pcCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('pc')).length;
  const playStationCount = clubs.filter((club) => inferClubTypeSlugs(club).includes('playstation')).length;
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/rayon/${district.slug}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: `${district.name} klubları`, item: pageUrl },
        ],
      },
      {
        '@type': 'ItemList',
        name: `${district.name} rayonunda gaming klubları`,
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
        <Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>{district.name}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{district.name} rayonunda gaming klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        {district.name} rayonunda aktiv PC və PlayStation klublarını müqayisə et. Hazırda {clubs.length} klub göstərilir; klub səhifələrində ünvan, xəritə, iş saatları və mövcud olduqda qiymətlər yer alır.
      </p>

      {(pcCount >= 2 || playStationCount >= 2) ? (
        <div className="mt-5 flex flex-wrap gap-2" aria-label={`${district.name} üzrə klub növləri`}>
          {pcCount >= 2 ? <Link href={`/rayon/${district.slug}/pc`} className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary">{district.name} PC klubları ({pcCount})</Link> : null}
          {playStationCount >= 2 ? <Link href={`/rayon/${district.slug}/playstation`} className="rounded-control border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-primary">{district.name} PlayStation klubları ({playStationCount})</Link> : null}
        </div>
      ) : null}

      <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/?district=${encodeURIComponent(district.slug)}&view=map`} className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Xəritədə göstər</Link>
        <Link href="/" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Bütün klublar</Link>
      </div>
    </div>
  );
}
