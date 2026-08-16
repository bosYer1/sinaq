'use client';

import {
  useState,
  type FormEvent,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (!supabase) {
      setError('Supabase konfiqurasiyası tapılmadı.');
      setLoading(false);
      return;
    }

    const {
      data,
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user || !data.session) {
      setError('E-poçt və ya şifrə yanlışdır.');
      setLoading(false);
      return;
    }

    const { data: adminRow, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      await supabase.auth.signOut();
      setError('Bu hesabın admin panelinə giriş icazəsi yoxdur.');
      setLoading(false);
      return;
    }

    const requestedNext = searchParams.get('next');
    const destination =
      requestedNext &&
      requestedNext.startsWith('/admin') &&
      !requestedNext.startsWith('/admin/login')
        ? requestedNext
        : '/admin';

    window.location.assign(destination);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-card">
        <div>
          <p className="text-sm font-semibold text-primary">GameYer</p>
          <h1 className="mt-1 font-display text-xl font-bold text-ink">Admin girişi</h1>
          <p className="mt-1 text-sm text-muted">İdarəetmə panelinə daxil ol.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">E-poçt</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading}
              className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
              placeholder="E-poçt ünvanı"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-ink">Şifrə</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
              className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-10 w-full rounded-md bg-primary px-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Daxil olunur...' : 'Daxil ol'}
          </button>
        </form>
      </div>
    </div>
  );
}
