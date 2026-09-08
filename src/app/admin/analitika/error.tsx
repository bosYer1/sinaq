'use client';

export default function FounderAnalyticsError({ reset }: { reset: () => void }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="text-xl font-bold text-red-900">Analitika paneli açılmadı</h1><p className="mt-2 text-sm text-red-700">Admin sessiyasını və provider bağlantılarını yoxlayıb yenidən cəhd et.</p><button onClick={reset} className="mt-5 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Yenidən cəhd et</button></div>;
}
