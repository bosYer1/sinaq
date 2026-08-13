import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-card">
        <h1 className="font-display text-lg font-bold text-ink">Admin Girişi</h1>
        <form className="mt-4 flex flex-col gap-3">
          <div>
            <label htmlFor="email" className="text-sm text-muted">
              E-poçt
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink"
              placeholder="admin@bosyer.az"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-muted">
              Şifrə
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="mt-2 w-full">
            Daxil ol
          </Button>
        </form>
      </div>
    </div>
  );
}
