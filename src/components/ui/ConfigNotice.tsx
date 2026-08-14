export function ConfigNotice() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warn-light text-3xl">⚙️</div>
      <h1 className="font-display text-xl font-semibold text-ink">Supabase konfiqurasiyası tapılmadı</h1>
      <p className="text-sm text-muted">
        <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> və{' '}
        <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
        environment dəyişənləri tapılmadı.
      </p>
      <div className="mt-2 w-full rounded-lg border border-border bg-surface p-4 text-left text-xs text-muted">
        <p className="mb-1.5 font-medium text-ink">Vercel-də deploy edilibsə:</p>
        <p>Project → Settings → Environment Variables bölməsində bu iki dəyişəni əlavə edin, sonra yenidən deploy edin.</p>
        <p className="mb-1.5 mt-3 font-medium text-ink">Yerli mühitdə:</p>
        <p>
          <code className="font-mono">.env.local.example</code>-i <code className="font-mono">.env.local</code>-a
          köçürüb dəyərləri Supabase Dashboard → Project Settings → API-dən doldurun.
        </p>
      </div>
    </div>
  );
}
