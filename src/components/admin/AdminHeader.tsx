'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AdminHeader() {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace('/admin/login');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <span className="font-display text-base font-bold text-ink">GameYer Admin</span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="text-xs font-medium text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loggingOut ? 'Çıxılır...' : 'Çıxış'}
      </button>
    </header>
  );
}
