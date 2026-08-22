import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClubBySlug } from '@/lib/queries/clubs';
import { ClubDetail } from '@/components/clubs/ClubDetail';
import { ShareClubButton } from '@/components/clubs/ShareClubButton';
import { getSiteUrl } from '@/lib/site-url';

interface ClubPageProps { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic';

const SCHEMA_DAY_NAMES = [
  'https://schema.org/Monday','https://schema.org/Tuesday','https://schema.org/Wednesday','https://schema.org/Thursday','https://schema.org/Friday','https://schema.org/Saturday','https://schema.org/Sunday',
] as const;

function typeLandingHref(slug: string) {
  if (slug === 'pc') return '/bakida-pc-klublari';
  if (slug === 'playstation') return '/bakida-playstation-klublari';
  return `/tip/${slug}`;
}

function clubCategory(typeSlugs: string[]) {
  const hasPc = typeSlugs.includes('pc');
  const hasPlayStation = typeSlugs.includes('playstation');
  if (hasPc && hasPlayStation) return 'PC və PlayStation klubu';
  if (hasPc) return 'PC klubu';
  if (hasPlayStation) return 'PlayStation klubu';
  return 'gaming klubu';
}

function schemaBusinessType(typeSlugs: string[]) {
  const hasPc = typeSlugs.includes('pc');
  const hasPlayStation = typeSlugs.includes('playstation');
  if (hasPc && hasPlayStation) return ['InternetCafe', 'EntertainmentBusiness'];
  if (hasPc) return 'InternetCafe';
  if (hasPlayStation) return 'EntertainmentBusiness';
  return 'LocalBusiness';
}

function isOpen24HoursEveryDay(openingHours: Array<{ day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }>) {
  const hoursByDay = new Map(openingHours.map((hours) => [hours.day_of_week, hours]));
  return Array.from({ length: 7 }, (_, day) => day).every((day) => {
    const hours = hoursByDay.get(day);
    if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) return false;
    const opensMidnight = hours.open_time.startsWith('00:00');
    const closesFullDay = hours.close_time.startsWith('23:59') || hours.close_time.startsWith('00:00');
    return opensMidnight && closesFullDay;
  });
}

export async function generateMetadata({ params }: ClubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) return { title: 'Klub tapılmadı', robots: { index: false, follow: false } };

  const districtName = club.district?.name;
  const typeSlugs = (club.type_assignments ?? []).map((item) => item?.club_type?.slug).filter((value): value is string => Boolean(value));
  const category = clubCategory(typeSlugs);
  const pricing = Array.isArray(club.pricing) ? club.pricing : [];
  const validPrices = pricing.flatMap((item) => [item.price_from, item.price_to]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
  const priceText = minPrice != null ? ` Saatlıq qiymətlər ${minPrice} AZN-dən başlayır.` : '';
  const title = `${club.name} — ${districtName ? `${districtName}, ` : ''}${category} qiymətləri və ünvan`;
  const locationText = districtName ? `${districtName} rayonunda` : 'Bakıda';
  const description = `${club.name} ${locationText} ${category.toLowerCase()}.${priceText} Ünvan: ${club.address}. İş saatları, telefon və xəritə məlumatlarına GameYer-də bax.`;
  const canonical = `/klub/${club.slug}`;
  const images = Array.isArray(club.images) ? club.images : [];
  const sortedImages = [...images].sort((a, b) => a.position - b.position);
  const socialImage = club.profile_image_url || sortedImages.find((image) => image.is_cover)?.url || sortedImages[0]?.url;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', locale: 'az_AZ', url: canonical, siteName: 'GameYer', title: `${title} | GameYer`, description, images: socialImage ? [{ url: socialImage, alt: `${club.name} — GameYer profil şəkli` }] : undefined },
    twitter: { card: socialImage ? 'summary_large_image' : 'summary', title: `${title} | GameYer`, description, images: socialImage ? [socialImage] : undefined },
  };
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) notFound();

  const siteUrl = getSiteUrl();
  const clubUrl = `${siteUrl}/klub/${club.slug}`;
  const typeAssignments = Array.isArray(club.type_assignments) ? club.type_assignments : [];
  const openingHours = Array.isArray(club.opening_hours) ? club.opening_hours : [];
  const images = Array.isArray(club.images) ? club.images : [];
  const pricing = Array.isArray(club.pricing) ? club.pricing : [];
  const typeNames = typeAssignments.map((item) => item?.club_type?.name).filter((name): name is string => Boolean(name));
  const typeLinks = typeAssignments.flatMap((item) => {
    const type = item?.club_type;
    return type?.slug ? [{ slug: type.slug, name: type.name }] : [];
  });
  const typeSlugs = typeLinks.map((type) => type.slug);
  const hasPc = typeSlugs.includes('pc');
  const businessType = schemaBusinessType(typeSlugs);
  const sortedImages = [...images].sort((a, b) => a.position - b.position);
  const coverImage = sortedImages.find((image) => image.is_cover)?.url ?? sortedImages[0]?.url;
  const primaryImage = club.profile_image_url || coverImage;
  const allBusinessImages = Array.from(new Set([club.profile_image_url, ...sortedImages.map((image) => image.url)].filter((url): url is string => Boolean(url))));
  const openingHoursSpecification = openingHours.filter((hours) => !hours.is_closed && hours.open_time && hours.close_time && hours.day_of_week >= 0 && hours.day_of_week <= 6).map((hours) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: SCHEMA_DAY_NAMES[hours.day_of_week], opens: hours.open_time!.slice(0, 5), closes: hours.close_time!.slice(0, 5) }));

  const validPrices = pricing.flatMap((item) => [item.price_from, item.price_to].filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0));
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;
  const priceRange = minPrice != null && maxPrice != null ? (minPrice === maxPrice ? `${minPrice} AZN` : `${minPrice}–${maxPrice} AZN`) : undefined;
  const pcPrices = pricing.filter((item) => item.club_type?.slug === 'pc' && item.unit === 'saat' && item.price_from > 0).map((item) => item.price_from);
  const playStationPrices = pricing.filter((item) => item.club_type?.slug === 'playstation' && item.unit === 'saat' && item.price_from > 0).map((item) => item.price_from);
  const minPcPrice = pcPrices.length > 0 ? Math.min(...pcPrices) : null;
  const minPlayStationPrice = playStationPrices.length > 0 ? Math.min(...playStationPrices) : null;
  const open24Hours = isOpen24HoursEveryDay(openingHours);
  const hasMap = club.latitude != null && club.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${club.latitude},${club.longitude}` : undefined;
  const offerCatalog = pricing.length > 0 ? {
    '@type': 'OfferCatalog',
    name: `${club.name} saatlıq oyun qiymətləri`,
    itemListElement: pricing.filter((item) => item.price_from > 0).map((item) => ({ '@type': 'Offer', priceCurrency: 'AZN', price: item.price_from, category: item.club_type?.name || 'Gaming', description: `${item.club_type?.name || 'Gaming'} — ${item.price_from} AZN-dən / ${item.unit}`, url: clubUrl })),
  } : undefined;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': businessType,
        '@id': `${clubUrl}#business`,
        name: club.name,
        url: clubUrl,
        mainEntityOfPage: clubUrl,
        description: club.description || undefined,
        image: allBusinessImages.length > 0 ? allBusinessImages : primaryImage || undefined,
        logo: club.profile_image_url || undefined,
        telephone: club.phone || undefined,
        priceRange,
        currenciesAccepted: 'AZN',
        address: { '@type': 'PostalAddress', streetAddress: club.address, addressLocality: 'Bakı', addressRegion: club.district?.name || 'Bakı', addressCountry: 'AZ' },
        geo: club.latitude != null && club.longitude != null ? { '@type': 'GeoCoordinates', latitude: club.latitude, longitude: club.longitude } : undefined,
        hasMap,
        openingHoursSpecification: openingHoursSpecification.length > 0 ? openingHoursSpecification : undefined,
        sameAs: club.instagram_url ? [club.instagram_url] : undefined,
        keywords: hasPc ? [...typeNames, 'kompüter klubu', 'internet klub', 'internet kafe'].join(', ') : typeNames.length > 0 ? typeNames.join(', ') : undefined,
        hasOfferCatalog: offerCatalog,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          ...(club.district?.slug ? [{ '@type': 'ListItem', position: 2, name: `${club.district.name} klubları`, item: `${siteUrl}/rayon/${club.district.slug}` }] : []),
          { '@type': 'ListItem', position: club.district?.slug ? 3 : 2, name: club.name, item: clubUrl },
        ],
      },
    ],
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <ClubDetail club={club} />
    <nav className="mx-auto flex max-w-5xl flex-wrap gap-2 px-4 pb-8 pt-2 text-xs sm:px-6" aria-label="Əlaqəli klub kateqoriyaları və paylaşım">
      <ShareClubButton name={club.name} url={clubUrl} />
      {club.district?.slug ? <Link href={`/rayon/${club.district.slug}`} className="rounded-control border border-border bg-surface px-3 py-2 text-muted transition hover:text-ink">{club.district.name} rayonundakı digər klublar</Link> : null}
      {typeLinks.map((type) => <Link key={type.slug} href={typeLandingHref(type.slug)} className="rounded-control border border-border bg-surface px-3 py-2 text-muted transition hover:text-ink">{type.slug === 'pc' ? 'Digər PC klubları' : type.slug === 'playstation' ? 'Digər PlayStation klubları' : `${type.name} klubları`}</Link>)}
      {hasPc ? <Link href="/bakida-internet-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-muted transition hover:text-ink">Internet və kompüter klubları</Link> : null}
      {minPcPrice != null && minPcPrice <= 2 ? <Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-muted transition hover:text-ink">Ucuz PC klubları</Link> : null}
      {minPlayStationPrice != null && minPlayStationPrice <= 3 ? <Link href="/bakida-ucuz-playstation-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-muted transition hover:text-ink">Ucuz PlayStation klubları</Link> : null}
      {open24Hours ? <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-surface px-3 py-2 text-muted transition hover:text-ink">24 saat gaming klubları</Link> : null}
    </nav>
  </>;
}
