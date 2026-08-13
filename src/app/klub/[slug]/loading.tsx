import { Skeleton } from '@/components/ui/Skeleton';

export default function ClubDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Skeleton className="mb-5 aspect-video w-full rounded-card" />
      <Skeleton className="mb-2 h-7 w-2/3" />
      <Skeleton className="mb-6 h-4 w-1/2" />
      <Skeleton className="mb-6 h-4 w-full" />
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}
