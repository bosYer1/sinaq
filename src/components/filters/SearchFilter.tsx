'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/ui/Icon';

export function SearchFilter() {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const paramsString = searchParams.toString(); const currentQuery = searchParams.get('q') ?? ''; const [value, setValue] = useState(currentQuery);
  useEffect(() => { const timer = window.setTimeout(() => { const nextQuery = value.trim(); if (nextQuery === currentQuery) return; const params = new URLSearchParams(paramsString); if (nextQuery) params.set('q', nextQuery); else params.delete('q'); const query = params.toString(); router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }); }, 300); return () => window.clearTimeout(timer); }, [value, currentQuery, paramsString, pathname, router]);
  return <div className="relative w-full">
    <span className="pointer-events-none absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary"><SearchIcon width={17} height={17}/></span>
    <input type="search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Klub, rayon və ya ünvan axtar..." aria-label="Klub adı və ya ünvan üzrə axtar" enterKeyHint="search" autoComplete="off" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[.045] pl-13 pr-11 text-sm font-medium text-white shadow-[inset_0_1px_rgba(255,255,255,.025)] outline-none transition placeholder:font-normal placeholder:text-faint hover:border-primary/30 focus:border-primary/60 focus:bg-white/[.06] focus:ring-4 focus:ring-primary/10" />
    {value ? <button type="button" onClick={() => setValue('')} aria-label="Axtarışı təmizlə" className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-xl leading-none text-faint transition hover:bg-white/[.06] hover:text-white">×</button> : null}
  </div>;
}
