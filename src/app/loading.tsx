import { Skeleton, ClubCardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#F8F9FC]">
      <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-7 w-full max-w-[390px] rounded-lg sm:h-9" />
            <Skeleton className="mt-2 h-4 w-52 rounded-md" />
          </div>
          <Skeleton className="h-9 w-24 shrink-0 rounded-full" />
        </div>

        <div className="mb-3 rounded-2xl border border-border bg-surface p-2.5 sm:mb-4 sm:p-4">
          <div className="grid gap-2.5 xl:grid-cols-[minmax(300px,1.35fr)_minmax(0,2fr)_auto] xl:items-center">
            <Skeleton className="h-11 w-full rounded-xl" />
            <div className="flex gap-2 overflow-hidden">
              <Skeleton className="h-10 w-20 shrink-0 rounded-xl" />
              <Skeleton className="h-10 w-28 shrink-0 rounded-xl" />
              <Skeleton className="h-10 w-24 shrink-0 rounded-xl" />
            </div>
            <Skeleton className="hidden h-11 w-32 rounded-xl xl:block" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface p-2.5 sm:p-4">
          <div className="hidden h-[clamp(590px,68vh,660px)] min-h-0 grid-cols-[360px_minmax(0,1fr)] gap-3 lg:grid xl:grid-cols-[420px_minmax(0,1fr)] xl:gap-4 2xl:grid-cols-[450px_minmax(0,1fr)]">
            <section className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-[#FBFCFE] p-3">
              <Skeleton className="mb-3 h-12 w-full rounded-xl" />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => <ClubCardSkeleton key={i} />)}
              </div>
            </section>
            <Skeleton className="h-full min-w-0 rounded-[18px]" />
          </div>

          <div className="lg:hidden">
            <Skeleton className="h-[340px] w-full rounded-[18px] sm:h-[410px]" />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => <ClubCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
