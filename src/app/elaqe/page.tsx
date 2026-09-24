import type { Metadata } from 'next';
import Link from 'next/link';
import { SubmissionForm } from '@/components/submissions/SubmissionForm';

export const metadata: Metadata = {
  title: 'Əlaqə və məlumat düzəlişi',
  description: 'GameYer-də klub məlumatının əlavə edilməsi və düzəldilməsi üçün müraciət göndər.',
  alternates: { canonical: '/elaqe' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: '/elaqe',
    title: 'Əlaqə və məlumat düzəlişi | GameYer',
    description: 'Klub məlumatında düzəliş və yeni klub təklifi üçün GameYer müraciət səhifəsi.',
  },
};

interface ContactPageProps {
  searchParams: Promise<{
    club?: string;
    slug?: string;
    sent?: string;
    error?: string;
    rate?: string;
  }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const selectedClub = params.club?.trim().slice(0, 120) || null;
  const selectedSlug = params.slug?.trim().slice(0, 120) || null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← GameYer-ə qayıt
      </Link>

      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
        Əlaqə və məlumat düzəlişi
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
        GameYer-də klub məlumatlarını mümkün qədər dəqiq saxlayırıq. Səhv məlumat gördükdə və ya
        siyahıda olmayan klub bildikdə müraciəti birbaşa buradan göndərə bilərsiniz.
      </p>

      {params.sent === '1' ? (
        <div role="status" className="mt-6 rounded-xl border border-live/30 bg-live/10 p-4 text-sm text-ink">
          Müraciət qəbul edildi. Məlumat yoxlanıldıqdan sonra lazım olarsa göstərdiyiniz əlaqə vasitəsilə sizinlə əlaqə saxlanılacaq.
        </div>
      ) : null}
      {params.rate === '1' ? (
        <div role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Bu əlaqə məlumatından qısa müddətdə çox müraciət göndərilib. Təxminən 15 dəqiqə sonra yenidən cəhd edin.
        </div>
      ) : null}
      {params.error === '1' ? (
        <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Müraciət göndərilmədi. Sahələri və əlaqə məlumatını yoxlayıb yenidən cəhd edin.
        </div>
      ) : null}

      {selectedClub ? (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Seçilmiş klub</p>
          <p className="mt-1 font-display text-lg font-bold text-ink">{selectedClub}</p>
          {selectedSlug ? (
            <Link href={`/klub/${selectedSlug}`} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
              Klub səhifəsinə qayıt
            </Link>
          ) : null}
        </div>
      ) : null}

      <section className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
        <h2 className="font-display text-xl font-bold text-ink">Məlumat düzəlişi</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Klubun adını və əlaqə nömrənizi yazın. Düzəlişi dəqiqləşdirmək üçün sizinlə əlaqə saxlanılacaq.
        </p>
        <SubmissionForm
          kind="correction"
          clubName={selectedClub}
          clubSlug={selectedSlug}
          returnTo="/elaqe"
          submitLabel="Düzəlişi göndər"
        />
      </section>

      <section id="new-club" className="mt-6 scroll-mt-24 rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
        <h2 className="font-display text-xl font-bold text-ink">Yeni klub təklif et</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Klubun adını və əlaqə nömrənizi yazın. Klubu yoxlayıb məlumatları dəqiqləşdirmək üçün sizinlə əlaqə saxlanılacaq.
        </p>
        <SubmissionForm
          kind="new_club"
          returnTo="/elaqe"
          submitLabel="Klubu təklif et"
        />
      </section>

      <div className="mt-6 rounded-xl border border-border bg-surface-alt p-5">
        <h2 className="font-display text-base font-bold text-ink">Alternativ əlaqə kanalları</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Formdan istifadə etmək istəmirsinizsə GameYer-in rəsmi sosial hesablarına da yaza bilərsiniz.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="https://www.instagram.com/gameyer.az/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
          >
            Instagram @gameyer.az
          </a>
          <a
            href="https://www.tiktok.com/@gameyer.az"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
          >
            TikTok @gameyer.az
          </a>
        </div>
      </div>

      <p className="mt-8 text-xs leading-5 text-muted">
        Müraciətdə verdiyiniz əlaqə məlumatının necə istifadə edildiyini{' '}
        <Link href="/mexfilik" className="font-semibold text-primary hover:underline">
          Məxfilik siyasətində
        </Link>{' '}
        oxuya bilərsiniz.
      </p>
    </div>
  );
}
