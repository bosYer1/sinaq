import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

const getForGamerClubs = cache(() => getClubs({ q: 'ForGamer' }));

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getForGamerClubs();
  const indexable = clubs.length >= 2;
  const title = 'ForGamer filialları — Bakı PC klubları';
  const description = clubs.length > 0
    ? `Bakıda ${clubs.length} aktiv ForGamer filialını müqayisə et. Ünvan, xəritə və mövcud olduqda qiymət və iş saatlarına GameYer-də bax.`
    : 'Bakıda ForGamer filiallarını GameYer-də tap.';

  return {
    title,
    description,
    alternates: { canonical: '/forgamer' },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: 'az_AZ',
      url: '/forgamer',
      title: `${title} | GameYer`,
      description,
    },
  };
}

export default async function ForGamerPage() {
  const clubs = await getForGamerClubs();
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/forgamer`;
  const faq = [
    {
      question: 'ForGamer filiallarını haradan görə bilərəm?',
      answer: 'Bu səhifə GameYer-də ForGamer adına uyğun aktiv filialları bir yerdə göstərir. Hər filialın profilindən ünvan və xəritə məlumatına baxa bilərsən.',
    },
    {
      question: 'ForGamer qiymətləri harada göstərilir?',
      answer: 'Qiyməti təsdiqlənmiş filiallarda saatlıq tariflər klub profilində göstərilir. Məlumat olmayan qiymət uydurulmur.',
    },
    {
      question: 'Mənə yaxın ForGamer filialını necə seçə bilərəm?',
      answer: 'Filialların rayon və ünvanlarını müqayisə et, sonra uyğun profil səhifəsindən xəritəyə və marşruta keç.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'ForGamer filialları', item: pageUrl },
        ],
      },
      ...(clubs.length > 0 ? [{
        '@type': 'ItemList',
        name: 'ForGamer filialları',
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
        <Link href="/">GameYer</Link> / ForGamer
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">ForGamer filialları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        Bakıda ForGamer axtarırsansa, uyğun aktiv filialları burada bir yerdə müqayisə et.
        Hazırda {clubs.length} aktiv filial göstərilir. Ünvan, rayon, xəritə və mövcud olduqda qiymət və iş saatı məlumatlarına klub profillərində bax.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/?q=ForGamer&view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">ForGamer filiallarını xəritədə gör</Link>
        <Link href="/bakida-pc-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PC klubları</Link>
        <Link href="/bakida-internet-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">Internet klubları</Link>
      </div>

      {clubs.length > 0 ? (
        <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      ) : (
        <div className="mt-7 rounded-card border border-border bg-surface p-5 text-sm text-muted">
          Hazırda ForGamer adına uyğun aktiv filial görünmür.
        </div>
      )}

      <section className="mt-8" aria-labelledby="forgamer-faq-heading">
        <h2 id="forgamer-faq-heading" className="font-display text-lg font-bold text-ink">ForGamer haqqında suallar</h2>
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
