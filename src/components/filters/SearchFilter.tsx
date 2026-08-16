'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/ui/Icon';

export function SearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const currentQuery = searchParams.get('q') ?? '';
  const [value, setValue] = useState(currentQuery);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = value.trim();
      if (nextQuery === currentQuery) return;
      const params = new URLSearchParams(paramsString);
      if (nextQuery) params.set('q', nextQuery);
      else params.delete('q');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [value, currentQuery, paramsString, pathname, router]);

  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-primary/12 text-primary">
        <SearchIcon width={19} height={19}/>
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Klub, rayon və ya ünvan axtar..."
        aria-label="Klub adı, rayon və ya ünvan üzrə axtar"
        enterKeyHint="search"
        autoComplete="off"
        className="h-14 w-full rounded-2xl border border-white/10 bg-surface/95 pl-14 pr-12 text-sm font-medium text-white shadow-[0_16px_40px_-24px_rgba(0,0,0,.8)] outline-none transition placeholder:font-normal placeholder:text-faint hover:border-primary/30 focus:border-primary/60 focus:ring-4 focus:ring-primary/12 sm:h-16 sm:text-[15px]"
      />
      {value ? (
        <button type="button" onClick={() => setValue('')} aria-label="Axtarışı təmizlə" className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-xl leading-none text-faint transition hover:bg-white/5 hover:text-white">×</button>
      ) : null}
    </div>
  );
}
