'use client';

import type { ClubType } from '@/types/database';
import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

export function TypeFilter({ types }: { types: ClubType[] }) {
  const { filters, setType } = useFilters();

  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-surface p-0.5">
      {types.map((t) => {
        const active = filters.type === t.slug;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(active ? undefined : t.slug)}
            className={cn(
              'h-10 rounded-[10px] px-3 text-sm font-semibold transition-colors md:h-8',
              active
                ? t.slug === 'pc'
                  ? 'bg-primary text-white'
                  : 'bg-ps text-[#071218]'
                : 'text-muted hover:bg-white/5 hover:text-white',
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
