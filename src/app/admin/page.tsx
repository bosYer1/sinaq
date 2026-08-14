import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createClient();
  if (!supabase) return <p className="text-sm text-red-600">Supabase konfiqurasiyası tapılmadı.</p>;

  const [{ count: total }, { count: active }, { count: premium }] = await Promise.all([
    supabase.from('clubs').select('*', { count: 'exact', head: true }),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_premium', true),
  ]);

  const cards = [['Ümumi klub', total ?? 0], ['Aktiv', active ?? 0], ['Premium', premium ?? 0]] as const;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="mt-1 text-sm text-gray-500">GameYer məlumatlarını bir yerdən idarə et.</p></div>
        <Link href="/admin/klublar/yeni" className="rounded-lg bg-[#7C5CFC] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6A47F0]">+ Yeni klub</Link>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => <div key={label} className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}
      </div>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">Sürətli idarəetmə</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/klublar" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Bütün klublar</Link>
          <Link href="/admin/klublar/yeni" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Klub əlavə et</Link>
          <Link href="/" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Sayta bax</Link>
        </div>
      </div>
    </div>
  );
}
