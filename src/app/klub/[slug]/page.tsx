import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getClubBySlug } from '@/lib/queries/clubs';
import { ClubDetail } from '@/components/clubs/ClubDetail';

interface ClubPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ClubPageProps): Promise<Metadata> {
  const club = await getClubBySlug(params.slug);

  if (!club) {
    return {
      title: 'Klub tapılmadı',
      robots: { index: false, follow: false },
    };
  }

  const districtName = club.district?.name;
  const description =
    club.description ??
    `${club.name}${districtName ? ` — ${districtName} rayonunda` : ''} gaming klubu. Qiymət, ünvan, iş saatları və xəritə məlumatlarına GameYer-də bax.`;
  const canonical = `/klub/${club.slug}`;
  const coverImage = [...club.images]
    .sort((a, b) => a.position - b.position)
    .find((image) => image.is_cover)?.url ??
    [...club.images].sort((a, b) => a.position - b.position)[0]?.url;

  return {
    title: club.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'az_AZ',
      url: canonical,
      siteName: 'GameYer',
      title: `${club.name} — GameYer`,
      description,
      images: coverImage ? [{ url: coverImage, alt: club.name }] : undefined,
    },
    twitter: {
      card: coverImage ? 'summary_large_image' : 'summary',
      title: `${club.name} — GameYer`,
      description,
      images: coverImage ? [coverImage] : undefined,
    },
  };
}

export default async function ClubPage({ params }: ClubPageProps) {
  const club = await getClubBySlug(params.slug);

  if (!club) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bosyer-web.vercel.app';
  const typeNames = club.club_types.map((item) => item.club_type.name);
  const coverImage = [...club.images]
    .sort((a, b) => a.position - b.position)
    .find((image) => image.is_cover)?.url ??
    [...club.images].sort((a, b) => a.position - b.position)[0]?.url;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: club.name,
    url: `${siteUrl}/klub/${club.slug}`,
    description: club.description || undefined,
    image: coverImage || undefined,
    telephone: club.phone || undefined,
    address: club.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: club.address,
          addressLocality: 'Bakı',
          addressCountry: 'AZ',
        }
      : undefined,
    geo:
      club.latitude != null && club.longitude != null
        ? {
            '@type': 'GeoCoordinates',
            latitude: club.latitude,
            longitude: club.longitude,
          }
        : undefined,
    sameAs: club.instagram_url ? [club.instagram_url] : undefined,
    keywords: typeNames.length > 0 ? typeNames.join(', ') : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <ClubDetail club={club} />
    </>
  );
}
