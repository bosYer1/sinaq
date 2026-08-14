import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Əlaqə və məlumat düzəlişi',
  description: 'GameYer-də klub məlumatının əlavə edilməsi və ya düzəldilməsi barədə məlumat.',
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
        GameYer-də klubunuzun məlumatı səhvdirsə, dəyişibsə və ya klubunuzu platformaya əlavə
        etmək istəyirsinizsə, bizə məlumat verə bilərsiniz.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-ink">Məlumat düzəlişi</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Klub adı, ünvan, telefon, iş saatı, qiymət, klub tipi, Instagram və ya xəritə mövqeyi
            yanlışdırsa, klubun adını və düzgün məlumatı göndərin.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-ink">Yeni klub əlavə etmək</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Klubun adı, tam ünvanı, PC/PlayStation tipi, əlaqə nömrəsi və varsa sosial şəbəkə
            hesabını təqdim edin. Məlumat yoxlanıldıqdan sonra platformaya əlavə edilə bilər.
          </p>
        </section>
      </div>

      <div className="mt-6 rounded-xl border border-primary/20 bg-primary-light p-5">
        <p className="text-sm font-semibold text-ink">Əlaqə kanalı hazırlanır</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Rəsmi GameYer e-poçtu və ya sosial şəbəkə hesabı müəyyən edilən kimi burada birbaşa
          əlaqə düyməsi yerləşdiriləcək. Hələlik səhifə public launch üçün düzəliş prosesini
          istifadəçiyə aydın şəkildə izah edir.
        </p>
      </div>

      <p className="mt-8 text-xs leading-5 text-muted">
        Şəxsi məlumatların və lokasiyanın necə istifadə edildiyini
        {' '}<Link href="/mexfilik" className="font-semibold text-primary hover:underline">Məxfilik siyasətində</Link>{' '}
        oxuya bilərsiniz.
      </p>
    </div>
  );
}
