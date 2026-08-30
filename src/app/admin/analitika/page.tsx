import Link from 'next/link';

const POSTHOG_DASHBOARD_URL = 'https://us.posthog.com/project/585472/dashboard/491088';

export default function FounderAnalyticsPage() {
  return (
    <div>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Founder analitikası</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          GameYer trafikini iki müstəqil mənbədən yoxla: Supabase operativ statistika və PostHog public davranış/conversion analitikası.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Supabase</p>
          <h2 className="mt-2 text-xl font-bold">Operativ trafik</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">24 saat/7 gün/30 gün baxışlar, anonim sessiyalar, mənbələr, cihazlar və klub CTA statistikası.</p>
          <Link href="/admin/statistika" className="mt-5 inline-flex rounded-lg bg-[#7C5CFC] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6A47F0]">Supabase statistikasını aç</Link>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">PostHog</p>
          <h2 className="mt-2 text-xl font-bold">Real public davranış</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">Public pageview, unikal user/session, klub kartı klikləri, profil baxışları, telefon/Instagram/Maps conversion-ları və müraciət nəticələri.</p>
          <a href={POSTHOG_DASHBOARD_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">PostHog Founder Dashboard</a>
        </section>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <strong>Data quality:</strong> PostHog public trafik filtri admin/API və bot/automation trafikini çıxarır. Məlum Cloud Browser test visitor-u yeni production eventlərində ayrıca bloklanır. Supabase “unikal” göstəricisi anonim sessiya ID-sidir və real şəxs sayı kimi qəbul edilmir.
      </div>
    </div>
  );
}
