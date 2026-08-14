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
      title: 'Klub tapılmadı — GameYer',
    };
  }

  const districtName = club.district?.name;

  return {
    title: `${club.name} — GameYer`,
    description:
      club.description ??
      `${club.name}${districtName ? ` — ${districtName} rayonunda` : ''} gaming klubu. Qiymət, ünvan, iş saatları və xəritə məlumatlarına GameYer-də bax.`,
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
