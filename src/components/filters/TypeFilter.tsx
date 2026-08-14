'use client';

import type { ClubType } from '@/types/database';
import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

export function TypeFilter({ types }: { types: ClubType[] }) {
  const { filters, setType } = useFilters();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
      {types.map((t) => {
        const active = filters.type === t.slug;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(active ? undefined : t.slug)}
            className={cn(
              'h-8 rounded-md px-3 text-sm font-medium transition-colors',
              active
                ? t.slug === 'pc'
                  ? 'bg-primary text-white'
                  : 'bg-ps text-white'
                : 'text-muted hover:text-ink',
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
