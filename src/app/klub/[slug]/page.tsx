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
    `${club.name}${districtName ? ` — ${districtName} rayonunda` : ''} gaming klubu. Qiymət, ünvan, iş saatları və xəritə məlumatlarına BosYer-də bax.`;
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
      siteName: 'BosYer',
      title: `${club.name} — BosYer`,
      description,
      images: coverImage ? [{ url: coverImage, alt: club.name }] : undefined,
    },
    twitter: {
      card: coverImage ? 'summary_large_image' : 'summary',
      title: `${club.name} — BosYer`,
      description,
      images: coverImage ? [coverImage] : undefined,
    },
  };
}

export default async function ClubPage({
  params,
}: ClubPageProps) {
  const club = await getClubBySlug(params.slug);

  if (!club) {
    notFound();
  }

  return <ClubDetail club={club} />;
}
