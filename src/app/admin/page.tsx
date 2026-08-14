import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createClient();

  let totalClubs = 0;
  let activeClubs = 0;
  let premiumClubs = 0;

  if (supabase) {
    const [
      totalResult,
      activeResult,
      premiumResult,
    ] = await Promise.all([
      supabase
        .from('clubs')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      supabase
        .from('clubs')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('is_active', true),

      supabase
        .from('clubs')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('is_premium', true),
    ]);

    totalClubs = totalResult.count ?? 0;
    activeClubs = activeResult.count ?? 0;
    premiumClubs = premiumResult.count ?? 0;
  }

  return (
    <div>
      {/* Başlıq */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            GameYer məlumatlarını bir yerdən idarə et.
          </p>
        </div>

        <Link
          href="/admin/klublar/yeni"
          className="rounded-lg bg-[#7C5CFC] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6A47F0]"
        >
          + Yeni klub
        </Link>
      </div>

      {/* Statistika */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Ümumi klub
          </p>

          <p className="mt-2 text-4xl font-bold">
            {totalClubs}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Aktiv
          </p>

          <p className="mt-2 text-4xl font-bold">
            {activeClubs}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Premium
          </p>

          <p className="mt-2 text-4xl font-bold">
            {premiumClubs}
          </p>
        </div>
      </div>

      {/* Sürətli idarəetmə */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">
          Sürətli idarəetmə
        </h2>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/klublar"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
          >
            Bütün klublar
          </Link>

          <Link
            href="/admin/klublar/yeni"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
          >
            Klub əlavə et
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
          >
            Sayta bax
          </Link>
        </div>
      </div>
    </div>
  );
}
