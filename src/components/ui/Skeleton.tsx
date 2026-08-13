import { cn } from '@/lib/utils';

/** Yüklənmə zamanı göstərilən sadə "skeleton" placeholder bloku. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-alt', className)} />;
}

/** ClubCard formasına uyğun skeleton — siyahı yüklənərkən istifadə olunur. */
export function ClubCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-card border border-border bg-surface p-3">
      <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
