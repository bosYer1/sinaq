import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getDistricts } from '@/lib/queries/districts';
import { GameYerExplorer } from '@/components/home/GameYerExplorer';
import { getSiteUrl } from '@/lib/site-url';

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

function minHourlyPrice(clubs: Awaited<ReturnType<typeof getClubs>>, type: 'pc' | 'playstation') {
  const prices = clubs.flatMap((club) => club.pricing
    .filter((item) => item.club_type?.slug === type && item.unit === 'saat' && item.price_from > 0)
    .map((item) => item.price_from));
  return prices.length > 0 ? Math.min(...prices) : null;
}

export default async function HomePage() {
  const [clubs, districts] = await Promise.all([getClubs(), getDistricts()]);
  const activeDistricts = districts.filter((district) => clubs.some((club) => club.district?.slug === district.slug));
  const pcMinPrice = minHourlyPrice(clubs, 'pc');
  const playstationMinPrice = minHourlyPrice(clubs, 'playstation');
  const siteUrl = getSiteUrl();
  const faq = [
    {
      question: 'Bakıda gaming klubu necə tapa bilərəm?',
      answer: 'GameYer-də PC və PlayStation klublarını rayon və klub tipinə görə filtr edə, xəritədə yerləşmələrinə baxa və klub profilində mövcud əlaqə məlumatlarını yoxlaya bilərsən.',
    },
    {
      question: 'Gaming klub qiymətlərini haradan müqayisə edə bilərəm?',
      answer: `Qiyməti təsdiqlənmiş klubların saatlıq tarifləri GameYer-də göstərilir.${pcMinPrice != null ? ` Məlum PC tarifləri ${pcMinPrice} AZN-dən başlayır.` : ''}${playstationMinPrice != null ? ` Məlum PlayStation tarifləri ${playstationMinPrice} AZN-dən başlayır.` : ''}`,
    },
    {
      question: 'Mənə yaxın gaming klubunu necə tapa bilərəm?',
      answer: 'Xəritə görünüşünə keçərək koordinatı məlum aktiv klubları görə bilərsən. Rayon səhifələri də Bakı üzrə məkanları daraltmağa kömək edir.',
    },
  ];
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'GameYer',
        url: siteUrl,
        inLanguage: 'az-AZ',
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <div className="mx-auto w-full max-w-[1440px] px-3 pb-8 pt-3 sm:px-4 lg:px-6">
      <div className="rounded-[26px] border border-border bg-surface p-3 shadow-card sm:p-4 lg:p-5">
        <header className="px-1 pb-4 pt-2 sm:px-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Azərbaycan gaming klub platforması</p>
          <h1 className="mt-2 max-w-4xl font-display text-2xl font-bold leading-tight text-ink sm:text-3xl lg:text-[2rem]">Bakıda gaming klubları — PC və PlayStation məkanlarını tap</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">GameYer Bakıdakı aktiv gaming klublarını bir yerdə müqayisə etməyə kömək edir. Rayon, PC və PlayStation filtrlərindən istifadə et, xəritədə klubları gör, ünvan və mövcud əlaqə məlumatlarına bax.</p>
        </header>

        <GameYerExplorer clubs={clubs} districts={activeDistricts} />

        <section className="mt-6 rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6 lg:mt-7" aria-labelledby="discover-heading">
          <h2 id="discover-heading" className="font-display text-base font-bold text-ink">Bakıda gaming klubunu daha konkret tap</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">Yaxınlıqdakı gaming klubu, PC klubu, internet klub, internet kafe, kompüter klubu, PlayStation klubu, ucuz saatlıq tarif, 24 saat açıq məkan və Bakı rayonları üzrə ayrıca siyahılara keç.</p>
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Gaming klub kateqoriyaları">
            <Link href="/yaxinliqda-gaming-klublari" className="rounded-control bg-primary px-3 py-2 text-xs font-semibold text-white">Yaxınlıqdakı gaming klubları</Link>
            <Link href="/bakida-gaming-klub-qiymetleri" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">Gaming klub qiymətləri</Link>
            <Link href="/bakida-pc-klublari" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">PC klubları</Link>
            <Link href="/bakida-internet-klublari" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">Internet kafe və klubları</Link>
            <Link href="/bakida-playstation-klublari" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">PlayStation klubları</Link>
            <Link href="/bakida-ucuz-pc-klublari" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">Ucuz PC klubları</Link>
            <Link href="/bakida-ucuz-playstation-klublari" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">Ucuz PlayStation klubları</Link>
            <Link href="/bakida-24-saat-gaming-klublari" className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink hover:border-primary">24 saat klublar</Link>
            {activeDistricts.map((district) => <Link key={district.slug} href={`/rayon/${district.slug}`} className="rounded-control border border-border bg-bg px-3 py-2 text-xs font-medium text-muted hover:border-primary hover:text-ink">{district.name}</Link>)}
          </nav>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6" aria-labelledby="seo-help-heading">
          <h2 id="seo-help-heading" className="font-display text-base font-bold text-ink">GameYer-də hansı məlumatları müqayisə edə bilərsən?</h2>
          <p className="mt-2 max-w-4xl text-xs leading-5 text-muted">Klub profilində mövcud olduqda PC və PlayStation saatlıq qiymətləri, ünvan, rayon, iş saatları, telefon, Instagram, şəkillər və xəritə koordinatları göstərilir. Azərbaycanda internet klub, internet kafe və kompüter klubu kimi axtarılan məkanlar da PC kateqoriyasında toplanır. Yaxın klub axtarışı üçün xəritə və rayon səhifələrindən istifadə edə bilərsən.</p>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6" aria-labelledby="home-faq-heading">
          <h2 id="home-faq-heading" className="font-display text-base font-bold text-ink">Gaming klubu tapmaq haqqında suallar</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {faq.map((item) => (
              <article key={item.question} className="rounded-xl border border-border/80 bg-bg p-4">
                <h3 className="text-sm font-bold text-ink">{item.question}</h3>
                <p className="mt-2 text-xs leading-5 text-muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  </>;
}
