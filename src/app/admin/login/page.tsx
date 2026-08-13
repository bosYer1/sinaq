export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
        <h1 className="font-display text-lg font-bold text-ink">
          Admin Girişi
        </h1>

        <form className="mt-4 flex flex-col gap-3">
          <div>
            <label htmlFor="email" className="text-sm text-muted">
              E-poçt
            </label>

            <input
              id="email"
              type="email"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
          >
            Daxil ol
          </button>
        </form>
      </div>
    </div>
  );
}
