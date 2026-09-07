export default function FounderAnalyticsLoading() {
  return <div className="animate-pulse"><div className="h-10 w-72 rounded bg-gray-200" /><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-36 rounded-2xl bg-gray-200" />)}</div><div className="mt-8 h-80 rounded-2xl bg-gray-200" /></div>;
}
