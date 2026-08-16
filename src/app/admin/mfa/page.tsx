'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type SetupState =
  | { mode: 'loading' }
  | { mode: 'enroll'; factorId: string; qr: string; secret: string }
  | { mode: 'challenge'; factorId: string }
  | { mode: 'ready' };

export default function AdminMfaPage() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<SetupState>({ mode: 'loading' });
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(() =>
    supabase ? null : 'Supabase konfiqurasiyası tapılmadı.'
  );
  const [busy, setBusy] = useState(false);

  const requestedNext = searchParams.get('next');
  const destination =
    requestedNext && requestedNext.startsWith('/admin') && !requestedNext.startsWith('/admin/login') && !requestedNext.startsWith('/admin/mfa')
      ? requestedNext
      : '/admin';

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    async function prepare() {
      const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;

      if (aal.currentLevel === 'aal2' && aal.nextLevel === 'aal2') {
        if (!cancelled) setState({ mode: 'ready' });
        return;
      }

      // Supabase defines aal2 -> aal1 as a stale JWT after the MFA factor was disabled.
      // End that session instead of treating the stale aal2 claim as sufficient admin access.
      if (aal.currentLevel === 'aal2' && aal.nextLevel === 'aal1') {
        await supabase.auth.signOut();
        if (!cancelled) window.location.assign('/admin/login');
        return;
      }

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      const verifiedTotp = factors.totp.find((factor) => factor.status === 'verified');

      if (verifiedTotp) {
        if (!cancelled) setState({ mode: 'challenge', factorId: verifiedTotp.id });
        return;
      }

      const { data: enrollment, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'GameYer Admin',
      });
      if (enrollError) throw enrollError;

      if (!cancelled) {
        setState({
          mode: 'enroll',
          factorId: enrollment.id,
          qr: enrollment.totp.qr_code,
          secret: enrollment.totp.secret,
        });
      }
    }

    prepare().catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'MFA hazırlanmadı.');
    });

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (state.mode === 'ready') window.location.assign(destination);
  }, [destination, state.mode]);

  async function verify() {
    if (!supabase || (state.mode !== 'enroll' && state.mode !== 'challenge')) return;
    const normalized = code.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(normalized)) {
      setError('Authenticator tətbiqindəki 6 rəqəmli kodu daxil et.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: state.factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: state.factorId,
        challengeId: challenge.id,
        code: normalized,
      });
      if (verifyError) throw verifyError;

      window.location.assign(destination);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Kod təsdiqlənmədi.');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[78vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[#7C5CFC]">GameYer Admin</p>
        <h1 className="mt-1 text-xl font-bold text-gray-950">İki mərhələli doğrulama</h1>

        {state.mode === 'loading' ? (
          <p className="mt-4 text-sm text-gray-600">Təhlükəsizlik yoxlanılır...</p>
        ) : null}

        {state.mode === 'enroll' ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-6 text-gray-600">
              İlk girişdir. Google Authenticator, Microsoft Authenticator və ya uyğun TOTP tətbiqi ilə QR kodu skan et. Sonra tətbiqdə görünən 6 rəqəmli kodu daxil et.
            </p>
            <div className="flex justify-center rounded-xl border border-gray-200 bg-white p-4">
              {/* Supabase returns a data URL generated for the authenticated user's TOTP secret. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.qr} alt="GameYer admin MFA QR kodu" className="h-52 w-52" />
            </div>
            <details className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <summary className="cursor-pointer font-medium text-gray-800">QR işləməsə manual kod</summary>
              <code className="mt-2 block break-all select-all text-xs">{state.secret}</code>
            </details>
          </div>
        ) : null}

        {state.mode === 'challenge' ? (
          <p className="mt-4 text-sm leading-6 text-gray-600">
            Şifrə təsdiqləndi. Authenticator tətbiqindəki 6 rəqəmli kodu daxil et.
          </p>
        ) : null}

        {(state.mode === 'enroll' || state.mode === 'challenge') ? (
          <div className="mt-5 space-y-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void verify();
              }}
              placeholder="000000"
              aria-label="6 rəqəmli MFA kodu"
              className="h-12 w-full rounded-xl border border-gray-300 px-4 text-center text-lg font-semibold tracking-[0.35em] text-gray-950 outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/15"
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => void verify()}
              disabled={busy || code.length !== 6}
              className="h-11 w-full rounded-xl bg-[#7C5CFC] px-4 text-sm font-semibold text-white transition hover:bg-[#6d4ee7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Yoxlanılır...' : state.mode === 'enroll' ? 'MFA-nı aktivləşdir' : 'Təsdiqlə'}
            </button>
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
