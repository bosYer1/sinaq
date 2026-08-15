import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';

export const metadata: Metadata = {
  title: 'Bakı rayonları üzrə gaming klubları',
  description: 'Bakının rayonları üzrə aktiv PC, kompüter və PlayStation klublarını GameYer-də tap. Rayon seç, klubları müqayisə et və xəritədə bax.',
  alternates: { canonical: '/rayon' },
  openGraph: { type: 'website', locale: 'az_AZ', url: '/rayon', title: 'Bakı rayonları üzrə gaming klubları | GameYer', description: 'Bakının rayonları üzrə aktiv PC və PlayStation klublarını tap və müqayisə et.' },
};

export default async function DistrictIndexPage() {
  const clubs = await getClubs();
  const counts = new Map<string, { id: string; name: string; slug: string; count: number }>();
  for (const club of clubs) {
    const district = club.district;
    if (!district?.slug) continue;
    const existing = counts.get(district.slug);
    if (existing) existing.count += 1;
    else counts.set(district.slug, { id: district.id, name: district.name, slug: district.slug, count: 1 });
  }
  const districts = [...counts.values()].sort((a, b) => a.name.localeCompare(b.name, 'az'));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb"><Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>Rayonlar</span></nav>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bakı rayonları üzrə gaming klubları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Aktiv klub olan rayonu seç və həmin ərazidəki PC, kompüter və PlayStation klublarını müqayisə et.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {districts.map((district) => (
          <Link key={district.id} href={`/rayon/${district.slug}`} className="rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-border-strong hover:shadow-card-hover">
            <span className="font-display text-sm font-semibold text-ink">{district.name}</span>
            <span className="mt-1 block text-xs text-muted">{district.count} aktiv gaming klubu →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
