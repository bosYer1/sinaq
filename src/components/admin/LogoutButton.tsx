'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace('/admin/login');
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className={
        compact
          ? 'shrink-0 text-gray-500 disabled:cursor-not-allowed disabled:opacity-50'
          : 'mt-6 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-left text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50'
      }
    >
      {loggingOut ? 'Çıxılır...' : 'Çıxış'}
    </button>
  );
}
