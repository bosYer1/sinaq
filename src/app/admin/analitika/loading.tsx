export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-[1380px]" aria-live="polite" aria-busy="true">
      <div className="animate-pulse">
        <div className="h-4 w-40 rounded bg-gray-200" />
        <div className="mt-3 h-10 w-80 max-w-full rounded bg-gray-200" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded bg-gray-100" />
        <div className="mt-6 h-20 rounded-2xl border border-gray-200 bg-white" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-32 rounded-2xl border border-gray-200 bg-white" />
          ))}
        </div>
        <div className="mt-8 h-64 rounded-2xl border border-gray-200 bg-white" />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-500">Analitika yüklənir. Gecikən provider bütün paneli bloklamayacaq.</p>
    </div>
  );
}
