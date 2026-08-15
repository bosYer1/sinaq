'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('GameYer admin xətası:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl" aria-hidden="true">
        ⚠️
      </div>
      <h1 className="mt-4 text-xl font-bold text-gray-900">Admin əməliyyatı tamamlanmadı</h1>
      <p className="mt-2 text-sm leading-6 text-gray-500">
        Məlumatı yükləyərkən və ya saxlayarkən xəta baş verdi. Yenidən cəhd edə və ya dashboard-a qayıda bilərsən.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Yenidən cəhd et
        </button>
        <a
          href="/admin"
          className="rounded-lg bg-[#7C5CFC] px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[#6A47F0]"
        >
          Dashboard-a qayıt
        </a>
      </div>
    </div>
  );
}
