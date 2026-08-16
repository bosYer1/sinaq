import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getClubTypes } from '@/lib/queries/districts';
import { inferClubTypeSlugs } from '@/lib/clubType';

export const metadata: Metadata = {
  title: 'PC və PlayStation klubları',
  description: 'Bakıda PC və PlayStation gaming klublarını kateqoriyaya görə tap və müqayisə et. Ünvan, qiymət, iş saatları və xəritəyə bax.',
  alternates: { canonical: '/tip' },
  openGraph: { type: 'website', locale: 'az_AZ', url: '/tip', title: 'PC və PlayStation klubları | GameYer', description: 'Bakıda gaming klublarını PC və PlayStation kateqoriyalarına görə tap.' },
};

function displayType(slug: string, name: string) {
  if (slug === 'pc') return 'PC';
  if (slug === 'playstation') return 'PlayStation';
  return name;
}

function typeHref(slug: string) {
  if (slug === 'pc') return '/bakida-pc-klublari';
  if (slug === 'playstation') return '/bakida-playstation-klublari';
  return `/tip/${slug}`;
}

export default async function TypeIndexPage() {
  const [types, clubs] = await Promise.all([getClubTypes(), getClubs()]);
  const typeCounts = new Map<string, number>();

  for (const club of clubs) {
    for (const slug of inferClubTypeSlugs(club)) {
      typeCounts.set(slug, (typeCounts.get(slug) ?? 0) + 1);
    }
  }

  const activeTypes = types.filter((type) => (typeCounts.get(type.slug) ?? 0) > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb"><Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>Klub tipləri</span></nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">PC və PlayStation klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Oynamaq istədiyin platformanı seç və Bakıdakı uyğun gaming klublarını müqayisə et.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {activeTypes.map((type) => {
          const label = displayType(type.slug, type.name);
          const count = typeCounts.get(type.slug) ?? 0;
          return <Link key={type.id} href={typeHref(type.slug)} className="rounded-card border border-border bg-surface p-5 shadow-card transition hover:border-border-strong hover:shadow-card-hover"><span className="font-display text-lg font-semibold text-ink">{label} klubları</span><span className="mt-1 block text-xs text-muted">{count} aktiv klub · müqayisə et →</span></Link>;
        })}
      </div>
    </div>
  );
}
