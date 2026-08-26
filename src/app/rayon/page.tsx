import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts } from '@/lib/queries/districts';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Bakı rayonları üzrə gaming klubları — PC və PlayStation',
  description: 'Nərimanov, Nəsimi, Yasamal və Bakının digər rayonlarında PC, kompüter və PlayStation klublarını tap. Qiymət, ünvan, iş saatı və xəritəyə görə müqayisə et.',
  alternates: { canonical: '/rayon' },
  openGraph: { type: 'website', locale: 'az_AZ', url: '/rayon', title: 'Bakı rayonları üzrə gaming klubları | GameYer', description: 'Bakının rayonları üzrə aktiv PC və PlayStation klublarını tap və müqayisə et.' },
};

export default async function DistrictIndexPage() {
  const [clubs, districts] = await Promise.all([getClubs(), getDistricts()]);
  const clubCountByDistrict = new Map<string, number>();

  for (const club of clubs) {
    const slug = club.district?.slug;
    if (!slug) continue;
    clubCountByDistrict.set(slug, (clubCountByDistrict.get(slug) ?? 0) + 1);
  }

  const districtCards = districts
    .map((district) => ({ ...district, count: clubCountByDistrict.get(district.slug) ?? 0 }))
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.name.localeCompare(b.name, 'az');
    });

  const coveredDistricts = districtCards.filter((district) => district.count > 0);
  const coveredDistrictCount = coveredDistricts.length;
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/rayon`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Bakı rayonları üzrə gaming klubları', item: pageUrl },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Bakı rayonları üzrə gaming klubları',
        numberOfItems: coveredDistricts.length,
        itemListElement: coveredDistricts.map((district, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${district.name} rayonunda gaming klubları`,
          url: `${siteUrl}/rayon/${district.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-bg-elevated">
      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
        <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">GameYer</Link> <span aria-hidden="true">/</span> <span>Rayonlar</span>
        </nav>

        <section className="overflow-hidden rounded-[22px] border border-border bg-surface px-5 py-6 shadow-[0_10px_35px_rgba(31,35,48,0.05)] sm:px-7 sm:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Bakı üzrə kəşf et</p>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.035em] text-ink sm:text-3xl">Rayonlar üzrə gaming klubları</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Bakının rayonlarında PC, kompüter, internet və PlayStation klublarını bir yerdə tap. Aktiv klub olan rayona keçib qiymət, ünvan, iş saatları və xəritə məlumatlarını müqayisə et.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <div className="rounded-xl border border-border bg-bg-elevated px-3 py-2 text-center">
                <div className="text-lg font-bold text-ink">{districtCards.length}</div>
                <div className="text-[10px] text-muted">rayon</div>
              </div>
              <div className="rounded-xl border border-border bg-pc-tint px-3 py-2 text-center">
                <div className="text-lg font-bold text-primary">{coveredDistrictCount}</div>
                <div className="text-[10px] text-muted">aktiv məlumat</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-border/70 pt-5">
            <Link href="/yaxinliqda-gaming-klublari" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Yaxınlıqdakı klubları tap</Link>
            <Link href="/bakida-gaming-klub-qiymetleri" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary">Qiymətləri müqayisə et</Link>
            <Link href="/bakida-pc-klublari" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary">Bakıda PC klubları</Link>
            <Link href="/bakida-playstation-klublari" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary">Bakıda PlayStation klubları</Link>
            <Link href="/bakida-24-saat-gaming-klublari" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary">24 saat klublar</Link>
          </div>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {districtCards.map((district) => {
            const hasClubs = district.count > 0;
            const cardClass = `group rounded-[18px] border bg-surface p-4 transition ${hasClubs ? 'border-border shadow-[0_5px_18px_rgba(31,35,48,0.04)] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_10px_26px_rgba(31,35,48,0.08)]' : 'border-border/80 opacity-75'}`;

            if (!hasClubs) {
              return (
                <div key={district.id} className={cardClass} aria-label={`${district.name} — məlumat hazırlanır`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-base font-bold text-ink">{district.name}</h2>
                      <p className="mt-1 text-xs text-muted">Klub məlumatı hazırlanır</p>
                    </div>
                    <span className="rounded-full bg-surface-alt px-2.5 py-1 text-[10px] font-semibold text-muted">Tezliklə</span>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-muted">Bu rayon siyahıdan gizlədilmir. Təsdiqlənmiş klub əlavə olunan kimi burada görünəcək.</p>
                </div>
              );
            }

            return (
              <Link key={district.id} href={`/rayon/${district.slug}`} className={cardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold text-ink transition group-hover:text-primary">{district.name}</h2>
                    <p className="mt-1 text-xs text-muted">{district.count} aktiv gaming klubu</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pc-tint text-sm font-bold text-primary transition group-hover:bg-primary group-hover:text-white">→</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-[11px]">
                  <span className="font-medium text-muted">PC və PlayStation</span>
                  <span className="font-semibold text-primary">Bax</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
