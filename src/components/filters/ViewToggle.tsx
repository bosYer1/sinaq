'use client';

import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

export function ViewToggle() {
  const { view, setView } = useFilters();
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-2xl border border-white/8 bg-surface p-1 shadow-[0_10px_30px_-22px_rgba(0,0,0,.9)] lg:hidden">
      {(['list','map'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setView(mode)}
          className={cn(
            'h-9 min-w-[58px] rounded-xl px-2.5 text-xs font-bold transition-all',
            view === mode
              ? 'bg-gradient-to-r from-primary to-[#7E57F2] text-white shadow-[0_8px_22px_rgba(155,107,255,.24)]'
              : 'text-muted hover:bg-white/5 hover:text-white'
          )}
          aria-pressed={view === mode}
        >
          {mode === 'list' ? 'Siyahı' : 'Xəritə'}
        </button>
      ))}
    </div>
  );
}
