'use client';

import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

export function ViewToggle() {
  const { view, setView } = useFilters();

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5 lg:hidden">
      {(['list', 'map'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setView(mode)}
          className={cn(
            'h-10 rounded-md px-3 text-sm font-medium transition-colors md:h-8',
            view === mode ? 'bg-primary text-white' : 'text-muted',
          )}
          aria-pressed={view === mode}
        >
          {mode === 'list' ? 'Siyahı' : 'Xəritə'}
        </button>
      ))}
    </div>
  );
}
