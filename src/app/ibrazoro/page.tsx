import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

export const dynamic = 'force-dynamic';

const getIbrazoroClubs = cache(() => getClubs({ q: 'Ibrazoro' }));

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getIbrazoroClubs();
  const indexable = clubs.length >= 2;
  const title = 'Ibrazoro filialları — Bakı PC və PlayStation';
  const description = clubs.length > 0
    ? `Bakıda ${clubs.length} aktiv Ibrazoro filialını müqayisə et. PC və PlayStation seçimlərinə, ünvan, xəritə və mövcud qiymətlərə GameYer-də bax.`
    : 'Bakıda Ibrazoro filiallarını GameYer-də tap.';

  return {
    title,
    description,
    alternates: { canonical: '/ibrazoro' },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: 'az_AZ',
      url: '/ibrazoro',
      title: `${title} | GameYer`,
      description,
    },
  };
}

export default async function IbrazoroPage() {
  const clubs = await getIbrazoroClubs();
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/ibrazoro`;
  const faq = [
    {
      question: 'Ibrazoro filiallarını haradan görə bilərəm?',
      answer: 'Bu səhifə GameYer-də Ibrazoro adına uyğun aktiv filialları bir yerdə göstərir. Filial profilindən ünvan, xəritə və mövcud oyun platformalarına baxa bilərsən.',
    },
    {
      question: 'Ibrazoro PC və PlayStation qiymətləri harada göstərilir?',
      answer: 'Qiyməti təsdiqlənmiş filiallarda PC və ya PlayStation tarifləri klub profilində göstərilir. Məlumat olmayan qiymət uydurulmur.',
    },
    {
      question: 'Ibrazoro filialları arasında necə seçim edə bilərəm?',
      answer: 'Filialın rayonunu, oyun platformasını, qiymətini və iş saatlarını müqayisə et, sonra uyğun profil səhifəsindən marşruta keç.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Ibrazoro filialları', item: pageUrl },
        ],
      },
      ...(clubs.length > 0 ? [{
        '@type': 'ItemList',
        name: 'Ibrazoro filialları',
        numberOfItems: clubs.length,
        itemListElement: clubs.map((club, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: club.name,
          url: `${siteUrl}/klub/${club.slug}`,
        })),
      }] : []),
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav className="mb-5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/">GameYer</Link> / Ibrazoro
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Ibrazoro filialları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Bakıda Ibrazoro axtarırsansa, uyğun aktiv filialları burada bir yerdə müqayisə et.
        Hazırda {clubs.length} aktiv filial göstərilir. PC və PlayStation seçimi, ünvan, xəritə və mövcud olduqda qiymət və iş saatı məlumatlarını profil səhifələrində yoxla.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/?q=Ibrazoro&view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">Ibrazoro filiallarını xəritədə gör</Link>
        <Link href="/bakida-playstation-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PlayStation klubları</Link>
        <Link href="/bakida-pc-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PC klubları</Link>
      </div>

      {clubs.length > 0 ? (
        <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      ) : (
        <div className="mt-7 rounded-card border border-border bg-surface p-5 text-sm text-muted">
          Hazırda Ibrazoro adına uyğun aktiv filial görünmür.
        </div>
      )}

      <section className="mt-8" aria-labelledby="ibrazoro-faq-heading">
        <h2 id="ibrazoro-faq-heading" className="font-display text-lg font-bold text-ink">Ibrazoro haqqında suallar</h2>
        <div className="mt-4 space-y-3">
          {faq.map((item) => (
            <article key={item.question} className="rounded-card border border-border bg-surface p-4">
              <h3 className="font-semibold text-ink">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
