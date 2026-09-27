import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getClubs } from '@/lib/queries/clubs';
import { getSiteUrl } from '@/lib/site-url';
import { SeoClubList } from '@/components/seo/SeoClubList';

const getLaLigaClubs = cache(() => getClubs({ q: 'LaLiga' }));

export async function generateMetadata(): Promise<Metadata> {
  const clubs = await getLaLigaClubs();
  const indexable = clubs.length >= 2;
  const title = 'LaLiga Game Center və Lounge filialları — Bakı';
  const description = clubs.length > 0
    ? `Bakıda ${clubs.length} aktiv LaLiga Game Center və LaLiga Lounge filialını müqayisə et. Ünvan, xəritə və mövcud olduqda qiymət və iş saatlarına bax.`
    : 'Bakıda LaLiga Game Center və LaLiga Lounge filiallarını GameYer-də tap.';

  return {
    title,
    description,
    alternates: { canonical: '/laliga-game-center' },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: 'az_AZ',
      url: '/laliga-game-center',
      title: `${title} | GameYer`,
      description,
    },
  };
}

export default async function LaLigaGameCenterPage() {
  const clubs = await getLaLigaClubs();
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/laliga-game-center`;
  const faq = [
    {
      question: 'LaLiga Game Center filiallarını haradan görə bilərəm?',
      answer: 'Bu səhifə GameYer-də LaLiga adına uyğun aktiv Game Center və Lounge filiallarını bir yerdə göstərir. Filial profilindən ünvan və xəritə məlumatına baxa bilərsən.',
    },
    {
      question: 'LaLiga PlayStation və gaming qiymətləri harada göstərilir?',
      answer: 'Qiyməti dərc edilmiş filiallarda saatlıq tariflər klub profilində göstərilir. Məlumat olmayan qiymət uydurulmur.',
    },
    {
      question: 'Mənə yaxın LaLiga filialını necə tapa bilərəm?',
      answer: 'Filialların ünvanlarını və xəritədə yerlərini müqayisə et, sonra uyğun klub profilindən marşruta keç.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GameYer', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'LaLiga Game Center filialları', item: pageUrl },
        ],
      },
      ...(clubs.length > 0 ? [{
        '@type': 'ItemList',
        name: 'LaLiga Game Center və Lounge filialları',
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
        <Link href="/">GameYer</Link> / LaLiga Game Center
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">LaLiga Game Center və Lounge filialları</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        LaLiga Game Center, LaLiga Lounge və LaLiga PlayStation axtarırsansa, uyğun aktiv filialları burada bir yerdə müqayisə et.
        Hazırda {clubs.length} aktiv filial göstərilir. Ünvan, xəritə, əlaqə və mövcud olduqda qiymət və iş saatı məlumatlarına klub profillərində bax.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/?q=LaLiga&view=map" className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">LaLiga filiallarını xəritədə gör</Link>
        <Link href="/bakida-playstation-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PlayStation klubları</Link>
        <Link href="/bakida-pc-klublari" className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink">PC klubları</Link>
      </div>

      {clubs.length > 0 ? (
        <div className="mt-7"><SeoClubList clubs={clubs} /></div>
      ) : (
        <div className="mt-7 rounded-card border border-border bg-surface p-5 text-sm text-muted">
          Hazırda LaLiga adına uyğun aktiv filial görünmür.
        </div>
      )}

      <section className="mt-8" aria-labelledby="laliga-faq-heading">
        <h2 id="laliga-faq-heading" className="font-display text-lg font-bold text-ink">LaLiga Game Center haqqında suallar</h2>
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
