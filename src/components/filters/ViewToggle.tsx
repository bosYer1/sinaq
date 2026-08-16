'use client';

import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

export function ViewToggle() {
  const { view, setView } = useFilters();

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-border bg-surface-alt/70 p-1 shadow-sm lg:hidden">
      {(['list', 'map'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setView(mode)}
          className={cn(
            'h-9 min-w-[58px] rounded-lg px-2.5 text-xs font-semibold transition-all md:h-8',
            view === mode
              ? 'bg-primary text-white shadow-[0_4px_12px_rgba(124,92,252,0.22)]'
              : 'text-muted hover:bg-surface hover:text-ink',
          )}
          aria-pressed={view === mode}
        >
          {mode === 'list' ? 'Siyahı' : 'Xəritə'}
        </button>
      ))}
    </div>
  );
}
