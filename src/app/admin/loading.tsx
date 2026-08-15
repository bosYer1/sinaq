export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-label="Admin məlumatları yüklənir">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="h-8 w-40 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 max-w-[70vw] rounded bg-gray-200" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-gray-200" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-28 rounded-xl border border-gray-200 bg-white p-5">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-14 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="mt-8 h-56 rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-5 w-36 rounded bg-gray-200" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
