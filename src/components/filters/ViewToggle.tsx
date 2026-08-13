'use client';

import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

/**
 * Mobil ekranlarda "Siyahı / Xəritə" arasında keçid.
 * Desktop-da (lg:) gizlədilir, çünki orada hər ikisi eyni anda yan-yana göstərilir.
 */
export function ViewToggle() {
  const { view, setView } = useFilters();

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-surface p-0.5 lg:hidden">
      {(['list', 'map'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setView(mode)}
          className={cn(
            'h-8 rounded-full px-3.5 text-sm font-medium transition-colors',
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
