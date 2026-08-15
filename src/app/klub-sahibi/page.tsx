import type { Metadata } from 'next';
import Link from 'next/link';
import { SubmissionForm } from '@/components/submissions/SubmissionForm';

export const metadata: Metadata = {
  title: 'Klub sahibləri üçün',
  description: 'GameYer-də klub məlumatını təsdiqlə, düzəliş göndər və rəsmi klub məlumatlarının dəqiq saxlanmasına kömək et.',
  alternates: { canonical: '/klub-sahibi' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: '/klub-sahibi',
    title: 'Klub sahibləri üçün | GameYer',
    description: 'Klub məlumatını təsdiqləmək və rəsmi düzəliş göndərmək üçün GameYer klub sahibi axını.',
  },
};

interface ClubOwnerPageProps {
  searchParams: Promise<{
    club?: string;
    slug?: string;
    sent?: string;
    error?: string;
    rate?: string;
  }>;
}

export default async function ClubOwnerPage({ searchParams }: ClubOwnerPageProps) {
  const params = await searchParams;
  const selectedClub = params.club?.trim().slice(0, 120) || null;
  const selectedSlug = params.slug?.trim().slice(0, 120) || null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← GameYer-ə qayıt
      </Link>

      <div className="mt-6 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Klub sahibləri üçün</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Klub məlumatını GameYer-də təsdiqlə
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
          Klubun sahibi və ya rəsmi nümayəndəsisinizsə, GameYer-dəki klub məlumatının sizə aid
          olduğunu təsdiqləyə və səhv məlumatların düzəldilməsini istəyə bilərsiniz. Təsdiqləmə prosesi ödənişsizdir.
        </p>
      </div>

      {params.sent === '1' ? (
        <div role="status" className="mt-6 rounded-xl border border-live/30 bg-live/10 p-4 text-sm text-ink">
          Təsdiq müraciəti qəbul edildi. Müraciətin klubun rəsmi nümayəndəsindən gəldiyi yoxlanıldıqdan sonra sizinlə əlaqə saxlanılacaq.
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
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Təsdiqləmək istədiyiniz klub</p>
          <p className="mt-1 font-display text-lg font-bold text-ink">{selectedClub}</p>
          {selectedSlug ? (
            <Link href={`/klub/${selectedSlug}`} className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline">
              Klub səhifəsinə qayıt
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">1</span>
          <h2 className="mt-4 font-display text-base font-bold text-ink">Klubu seç</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            GameYer-dəki klub səhifəsindən bu axına keçdikdə klub avtomatik seçilir; yoxdursa adını əl ilə yazın.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">2</span>
          <h2 className="mt-4 font-display text-base font-bold text-ink">Rəsmi əlaqəni göstər</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Klubun rəsmi Instagram hesabını, açıq telefon nömrəsini və ya rəsmi e-poçtu qeyd edin.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">3</span>
          <h2 className="mt-4 font-display text-base font-bold text-ink">Yoxlamanı gözlə</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            GameYer müraciətin həqiqətən klubun rəsmi nümayəndəsindən gəldiyini yoxladıqdan sonra məlumatı təsdiqləyir.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface-alt p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">Nəyi təsdiqləyə bilərik?</h2>
        <div className="mt-4 grid gap-2 text-sm text-ink sm:grid-cols-2">
          <p>✓ Klub adı və ünvan</p>
          <p>✓ Telefon və rəsmi Instagram</p>
          <p>✓ PC / PlayStation tipi</p>
          <p>✓ İş saatları</p>
          <p>✓ Qiymətlər</p>
          <p>✓ Klub şəkilləri</p>
        </div>
        <p className="mt-5 text-xs leading-5 text-muted">
          GameYer heç vaxt klub hesabının şifrəsini, SMS kodunu və ya giriş məlumatlarını istəmir.
          Təsdiq yalnız müraciətin həqiqətən klubun rəsmi nümayəndəsindən gəldiyini yoxlamaq üçündür.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold text-ink">Təsdiq müraciəti göndər</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Klubla əlaqənizi və dəyişməli məlumatları qısa şəkildə yazın. Əlaqə məlumatınız public göstərilməyəcək.
        </p>
        <SubmissionForm
          kind="owner_claim"
          clubName={selectedClub}
          clubSlug={selectedSlug}
          returnTo="/klub-sahibi"
          submitLabel="Təsdiq müraciətini göndər"
        />
      </section>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-ink">Alternativ əlaqə</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          İstəsəniz GameYer-in rəsmi Instagram hesabına da müraciət edə bilərsiniz.
        </p>
        <a
          href="https://www.instagram.com/gameyer.az/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-control border border-border-strong bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
        >
          Instagram @gameyer.az
        </a>
      </div>

      <p className="mt-8 text-xs leading-5 text-muted">
        Sadəcə məlumat səhvi bildirmək istəyirsinizsə{' '}
        <Link href="/elaqe" className="font-semibold text-primary hover:underline">
          əlaqə və düzəliş səhifəsinə
        </Link>{' '}
        keçin.
      </p>
    </div>
  );
}
