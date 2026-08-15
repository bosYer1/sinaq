import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClubs } from '@/lib/queries/clubs';
import { getClubTypes } from '@/lib/queries/districts';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

interface TypePageProps {
  params: Promise<{ slug: string }>;
}

function displayType(slug: string, name?: string) {
  if (slug === 'pc') return 'PC';
  if (slug === 'playstation') return 'PlayStation';
  return name || slug;
}

export async function generateMetadata({ params }: TypePageProps): Promise<Metadata> {
  const { slug } = await params;
  const types = await getClubTypes();
  const clubType = types.find((item) => item.slug === slug);

  if (!clubType) {
    return { title: 'Klub tipi tapılmadı', robots: { index: false, follow: false } };
  }

  const label = displayType(clubType.slug, clubType.name);
  const title = `Bakıda ${label} klubları`;
  const description = `Bakıdakı ${label} gaming klublarını GameYer-də tap və müqayisə et. Ünvan, qiymət, iş saatları və xəritə məlumatlarına bax.`;
  const canonical = `/tip/${clubType.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', locale: 'az_AZ', url: canonical, title: `${title} | GameYer`, description },
    twitter: { card: 'summary', title: `${title} | GameYer`, description },
  };
}

export default async function TypePage({ params }: TypePageProps) {
  const { slug } = await params;
  const types = await getClubTypes();
  const clubType = types.find((item) => item.slug === slug);
  if (!clubType) notFound();

  const clubs = await getClubs({ type: clubType.slug });
  const label = displayType(clubType.slug, clubType.name);
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/tip/${clubType.slug}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: `${label} klubları`, item: pageUrl },
        ],
      },
      {
        '@type': 'ItemList',
        name: `Bakıda ${label} klubları`,
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
        <Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>{label}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakıda {label} klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Bakı üzrə aktiv {label} klublarını bir yerdə müqayisə et. Hazırda {clubs.length} klub göstərilir; klub səhifələrində ünvan, xəritə, iş saatları və mövcud olduqda qiymətlər var.
      </p>
      <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/?type=${encodeURIComponent(clubType.slug)}&view=map`} className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Xəritədə göstər</Link>
        <Link href="/" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Bütün klublar</Link>
      </div>
    </div>
  );
}
