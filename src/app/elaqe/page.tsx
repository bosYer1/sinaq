import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Əlaqə və məlumat düzəlişi',
  description: 'GameYer-də klub məlumatının əlavə edilməsi və ya düzəldilməsi qaydası.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← GameYer-ə qayıt
      </Link>

      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
        Əlaqə və məlumat düzəlişi
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
        GameYer-də məqsəd klub məlumatlarını mümkün qədər dəqiq saxlamaqdır. Klub sahibi və ya
        istifadəçi kimi yanlış məlumat gördükdə aşağıdakı məlumatları hazırlamaq düzəlişin daha
        tez yoxlanmasına kömək edir.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-ink">Məlumat düzəlişi</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Klubun adı, dəyişən sahə və düzgün məlumatı qeyd edin. Telefon, iş saatı, qiymət,
            Instagram və xəritə mövqeyi kimi məlumatlar mümkün olduqda klubun rəsmi mənbəsi ilə
            yoxlanılır.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-ink">Yeni klub əlavə etmək</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Klubun adı, tam ünvanı, PC/PlayStation tipi, əlaqə nömrəsi, iş saatları və varsa rəsmi
            sosial şəbəkə hesabını hazırlayın. Təsdiqlənməyən məlumat saytda fakt kimi göstərilmir.
          </p>
        </section>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface-alt p-5">
        <h2 className="font-display text-base font-bold text-ink">Rəsmi müraciət kanalları</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Klub məlumatında səhv, yeni klub təklifi və ya klub sahibinin düzəliş müraciəti üçün
          GameYer-in rəsmi sosial hesablarına yaza bilərsiniz.
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
        Şəxsi məlumatların və lokasiyanın necə istifadə edildiyini{' '}
        <Link href="/mexfilik" className="font-semibold text-primary hover:underline">
          Məxfilik siyasətində
        </Link>{' '}
        oxuya bilərsiniz.
      </p>
    </div>
  );
}
