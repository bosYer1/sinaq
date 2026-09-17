import type { Metadata } from 'next';
import Link from 'next/link';
import { ClubUpdatesFeed } from '@/components/growth/ClubUpdatesFeed';
import { getActiveClubUpdates } from '@/lib/queries/club-updates';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Turnirlər və təkliflər',
  description: 'GameYer-də klubların aktual turnir və təkliflərini bir yerdə kəşf et.',
  alternates: { canonical: '/yenilikler' },
  robots: { index: false, follow: true },
};

export default async function UpdatesPage() {
  const updates = await getActiveClubUpdates();

  return (
    <main className="min-h-[calc(100dvh-64px)] bg-bg-elevated">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <section className="mb-5 overflow-hidden rounded-[28px] border border-primary/10 bg-surface p-5 shadow-[0_10px_34px_rgba(31,35,48,0.05)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">GameYer yenilikləri</p>
              <h1 className="mt-1.5 font-display text-[28px] font-bold leading-[1.08] tracking-tight text-ink sm:text-4xl">Turnirlər və aktiv təkliflər</h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-muted sm:text-base">Klubların aktual təklif və turnirlərini bir yerdə kəşf et.</p>
            </div>
            {updates.length > 0 ? (
              <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary sm:text-sm">
                <span aria-hidden="true">📣</span>
                <span>{updates.length} aktiv yenilik</span>
              </div>
            ) : null}
          </div>
        </section>

        {updates.length > 0 ? (
          <ClubUpdatesFeed updates={updates} context="discovery" />
        ) : (
          <section className="rounded-[28px] border border-border bg-surface px-5 py-12 text-center shadow-[0_10px_34px_rgba(31,35,48,0.04)] sm:px-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl" aria-hidden="true">🔔</div>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">Hazırda aktiv yenilik yoxdur</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">Yeni turnir və ya təklif təsdiqlənəndə burada görünəcək. Yalnız aktual və yoxlanmış məlumatları göstəririk.</p>
            <Link href="/" className="mt-5 inline-flex rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-white no-underline">Klubları kəşf et</Link>
          </section>
        )}
      </div>
    </main>
  );
}
