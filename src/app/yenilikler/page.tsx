import type { Metadata } from 'next';
import Link from 'next/link';
import { ClubUpdatesFeed } from '@/components/growth/ClubUpdatesFeed';
import { getActiveClubUpdates } from '@/lib/queries/club-updates';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Turnirlər və təkliflər',
  description: 'GameYer-də klubların təsdiqlənmiş aktiv turnir və təkliflərini bir yerdə gör.',
  alternates: { canonical: '/yenilikler' },
  robots: { index: false, follow: true },
};

export default async function UpdatesPage() {
  const updates = await getActiveClubUpdates();

  return (
    <main className="min-h-[calc(100dvh-64px)] bg-bg-elevated">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">GameYer yenilikləri</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Turnirlər və aktiv təkliflər</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Yalnız real klub və yoxlanmış mənbə ilə təsdiqlənmiş, vaxtı bitməmiş məlumatlar göstərilir.</p>
          </div>
          <Link href="/" className="w-fit rounded-control border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink no-underline transition hover:border-primary">Klublara qayıt</Link>
        </div>

        {updates.length > 0 ? (
          <ClubUpdatesFeed updates={updates} context="discovery" />
        ) : (
          <section className="rounded-2xl border border-border bg-surface px-5 py-10 text-center sm:px-8">
            <h2 className="font-display text-lg font-bold text-ink">Hazırda aktiv yenilik yoxdur</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">Təsdiqlənmiş turnir və ya təklif əlavə ediləndə burada görünəcək. GameYer məlumat uydurmur və vaxtı keçmiş kampaniyaları aktiv kimi göstərmir.</p>
            <Link href="/" className="mt-5 inline-flex rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-white no-underline">Klubları kəşf et</Link>
          </section>
        )}
      </div>
    </main>
  );
}
