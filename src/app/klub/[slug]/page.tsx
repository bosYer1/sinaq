import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClubBySlug } from '@/lib/queries/clubs';
import { ClubDetail } from '@/components/clubs/ClubDetail';
import { getSiteUrl } from '@/lib/site-url';

interface ClubPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const SCHEMA_DAY_NAMES = [
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
  'https://schema.org/Sunday',
] as const;

export async function generateMetadata({ params }: ClubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const club = await getClubBySlug(slug);

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
  const images = Array.isArray(club.images) ? club.images : [];
  const sortedImages = [...images].sort((a, b) => a.position - b.position);
  const coverImage = sortedImages.find((image) => image.is_cover)?.url ?? sortedImages[0]?.url;

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
  const { slug } = await params;
  const club = await getClubBySlug(slug);

  if (!club) notFound();

  const siteUrl = getSiteUrl();
  const typeAssignments = Array.isArray(club.type_assignments) ? club.type_assignments : [];
  const openingHours = Array.isArray(club.opening_hours) ? club.opening_hours : [];
  const images = Array.isArray(club.images) ? club.images : [];
  const pricing = Array.isArray(club.pricing) ? club.pricing : [];
  const typeNames = typeAssignments
    .map((item) => item?.club_type?.name)
    .filter((name): name is string => Boolean(name));
  const typeLinks = typeAssignments.flatMap((item) => {
    const type = item?.club_type;
    return type?.slug ? [{ slug: type.slug, name: type.name }] : [];
  });
  const sortedImages = [...images].sort((a, b) => a.position - b.position);
  const coverImage = sortedImages.find((image) => image.is_cover)?.url ?? sortedImages[0]?.url;
  const openingHoursSpecification = openingHours
    .filter(
      (hours) =>
        !hours.is_closed &&
        hours.open_time &&
        hours.close_time &&
        hours.day_of_week >= 0 &&
        hours.day_of_week <= 6
    )
    .map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAY_NAMES[hours.day_of_week],
      opens: hours.open_time!.slice(0, 5),
      closes: hours.close_time!.slice(0, 5),
    }));

  const validPrices = pricing
    .flatMap((item) => {
      const values = [item.price_from, item.price_to]
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
      return values;
    });
  const priceRange = validPrices.length > 0
    ? `${Math.min(...validPrices)}–${Math.max(...validPrices)} AZN`
    : undefined;
  const aggregateRating =
    club.rating_avg != null &&
    Number.isFinite(club.rating_avg) &&
    club.rating_avg > 0 &&
    club.rating_avg <= 5 &&
    club.rating_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: club.rating_avg,
          ratingCount: club.rating_count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: club.name,
    url: `${siteUrl}/klub/${club.slug}`,
    description: club.description || undefined,
    image: coverImage || undefined,
    telephone: club.phone || undefined,
    priceRange,
    aggregateRating,
    address: {
      '@type': 'PostalAddress',
      streetAddress: club.address,
      addressLocality: 'Bakı',
      addressCountry: 'AZ',
    },
    geo:
      club.latitude != null && club.longitude != null
        ? {
            '@type': 'GeoCoordinates',
            latitude: club.latitude,
            longitude: club.longitude,
          }
        : undefined,
    openingHoursSpecification:
      openingHoursSpecification.length > 0 ? openingHoursSpecification : undefined,
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
      <nav className="mx-auto flex max-w-5xl flex-wrap gap-2 px-4 pb-8 pt-2 text-xs sm:px-6" aria-label="Əlaqəli klub kateqoriyaları">
        {club.district?.slug ? (
          <Link href={`/rayon/${club.district.slug}`} className="rounded-control border border-border bg-surface px-3 py-2 text-muted transition hover:text-ink">
            {club.district.name} rayonundakı digər klublar
          </Link>
        ) : null}
        {typeLinks.map((type) => (
          <Link key={type.slug} href={`/tip/${type.slug}`} className="rounded-control border border-border bg-surface px-3 py-2 text-muted transition hover:text-ink">
            {type.slug === 'pc' ? 'Digər PC klubları' : type.slug === 'playstation' ? 'Digər PlayStation klubları' : `${type.name} klubları`}
          </Link>
        ))}
      </nav>
    </>
  );
}
