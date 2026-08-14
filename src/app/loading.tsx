import { Skeleton, ClubCardSkeleton } from '@/components/ui/Skeleton';

/**
 * Next.js App Router bu faylı avtomatik olaraq page.tsx data çəkərkən göstərir
 * (page.tsx `force-dynamic` olduğu üçün hər navigasiyada işə düşə bilər).
 */
export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <Skeleton className="h-10 w-full rounded-control" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-9 w-20 rounded-control" />
          <Skeleton className="h-9 w-28 rounded-control" />
          <Skeleton className="h-9 w-24 rounded-control" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <section className="hidden w-full overflow-y-auto px-4 py-4 sm:px-6 lg:block lg:w-[420px] lg:shrink-0 lg:border-r lg:border-border">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <ClubCardSkeleton key={i} />
            ))}
          </div>
        </section>

        <section className="hidden flex-1 lg:block">
          <Skeleton className="h-full w-full rounded-none" />
        </section>

        <section className="block w-full px-4 py-4 sm:px-6 lg:hidden">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <ClubCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
