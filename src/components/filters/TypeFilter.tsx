'use client';

import type { ClubType } from '@/types/database';
import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

export function TypeFilter({ types }: { types: ClubType[] }) {
  const { filters, setType } = useFilters();

  return (
    <div className="flex items-center gap-1.5">
      {types.map((t) => {
        const active = filters.type === t.slug;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(active ? undefined : t.slug)}
            className={cn(
              'h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-ink hover:bg-surface-alt',
            )}
            aria-pressed={active}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
