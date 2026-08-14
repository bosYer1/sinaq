'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AdminHeader() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <span className="font-display text-base font-bold text-ink">GameYer Admin</span>
      <button
        onClick={handleLogout}
        className="text-xs font-medium text-muted transition-colors hover:text-ink"
      >
        Çıxış
      </button>
    </header>
  );
}
