'use client';

import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

export function ViewToggle() {
  const { view, setView } = useFilters();
  return <div className="flex shrink-0 items-center gap-0.5 rounded-2xl border border-border bg-white p-1 shadow-sm lg:hidden">{(['list','map'] as const).map((mode) => <button key={mode} type="button" onClick={() => setView(mode)} className={cn('h-9 min-w-[58px] rounded-xl px-2.5 text-xs font-bold transition-all', view === mode ? 'bg-gradient-to-r from-primary to-[#7657f5] text-white shadow-[0_8px_20px_rgba(124,92,252,.2)]' : 'text-muted hover:bg-surface-alt hover:text-ink')} aria-pressed={view === mode}>{mode === 'list' ? 'Siyahı' : 'Xəritə'}</button>)}</div>;
}
