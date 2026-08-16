'use client';

import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

export function ViewToggle() {
  const { view, setView } = useFilters();
  return <div className="flex shrink-0 items-center gap-0.5 rounded-2xl border border-white/10 bg-white/[.035] p-1 shadow-[inset_0_1px_rgba(255,255,255,.025)] lg:hidden">
    {(['list','map'] as const).map((mode) => <button key={mode} type="button" onClick={() => setView(mode)} className={cn('h-9 min-w-[58px] rounded-xl px-2.5 text-xs font-bold transition-all', view === mode ? 'bg-gradient-to-r from-primary to-[#7657f5] text-white shadow-[0_0_18px_rgba(139,108,255,.24)]' : 'text-muted hover:bg-white/[.04] hover:text-white')} aria-pressed={view === mode}>{mode === 'list' ? 'Siyahı' : 'Xəritə'}</button>)}
  </div>;
}
