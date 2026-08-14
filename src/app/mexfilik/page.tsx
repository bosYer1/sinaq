import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Məxfilik siyasəti',
  description: 'GameYer məxfilik siyasəti və lokasiya məlumatlarının istifadəsi.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← GameYer-ə qayıt
      </Link>

      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
        Məxfilik siyasəti
      </h1>
      <p className="mt-2 text-sm text-muted">Son yenilənmə: 15 avqust 2026</p>

      <div className="mt-8 space-y-7 text-sm leading-7 text-ink">
        <section>
          <h2 className="font-display text-lg font-bold">GameYer hansı məlumatlardan istifadə edir?</h2>
          <p className="mt-2 text-muted">
            GameYer Bakıdakı PC və PlayStation klublarını tapmağı asanlaşdıran platformadır.
            Saytın əsas klub siyahısı və xəritəsi şəxsi hesab yaratmadan istifadə oluna bilər.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold">Lokasiya</h2>
          <p className="mt-2 text-muted">
            “Yaxın klublar” və ya “Mənim konumum” funksiyasını seçəndə brauzer cihazının
            lokasiyasına giriş üçün səndən icazə istəyir. Lokasiya yalnız sənə yaxın klubların
            məsafəsini hesablamaq və xəritəni mövqeyinə fokuslamaq üçün brauzerdə istifadə olunur.
            GameYer bu koordinatları öz verilənlər bazasında saxlamır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold">Klub məlumatları</h2>
          <p className="mt-2 text-muted">
            Klub adı, ünvan, telefon, iş saatı, sosial şəbəkə, qiymət və digər biznes məlumatları
            ictimai mənbələrdən və ya klub tərəfindən təqdim edilən məlumatlardan formalaşa bilər.
            Məlumat dəyişibsə, düzəliş üçün bizimlə əlaqə saxlamaq mümkündür.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold">Xarici xidmətlər</h2>
          <p className="mt-2 text-muted">
            Xəritə funksiyası xəritə plitələri və naviqasiya üçün üçüncü tərəf xidmətlərindən istifadə
            edə bilər. Telefon, Instagram və naviqasiya keçidlərini açanda həmin xidmətlərin öz
            məxfilik qaydaları tətbiq olunur.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold">Əlaqə və düzəliş</h2>
          <p className="mt-2 text-muted">
            GameYer-də klubunuz barədə yanlış və ya köhnə məlumat görürsünüzsə, əlaqə səhifəsindən
            düzəliş tələb edə bilərsiniz.
          </p>
          <Link href="/elaqe" className="mt-3 inline-flex font-semibold text-primary hover:underline">
            Əlaqə səhifəsinə keç →
          </Link>
        </section>
      </div>
    </div>
  );
}
