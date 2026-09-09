import type { ReactNode } from 'react';
import { ClubUpdatesFeed } from '@/components/growth/ClubUpdatesFeed';
import { getClubBySlug } from '@/lib/queries/clubs';
import { getActiveClubUpdatesByClubId } from '@/lib/queries/club-updates';

interface ClubDetailLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ClubDetailLayout({ children, params }: ClubDetailLayoutProps) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);

  if (!club) return children;

  const updates = await getActiveClubUpdatesByClubId(club.id);

  return (
    <>
      {children}
      {updates.length > 0 ? (
        <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6" aria-labelledby="club-updates-heading">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Aktiv yeniliklər</p>
            <h2 id="club-updates-heading" className="mt-1 font-display text-xl font-bold tracking-tight text-ink">{club.name} — turnir və təkliflər</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Yalnız yoxlanmış mənbə ilə təsdiqlənmiş və vaxtı bitməmiş məlumatlar.</p>
          </div>
          <ClubUpdatesFeed updates={updates} context="club_detail" />
        </section>
      ) : null}
    </>
  );
}
