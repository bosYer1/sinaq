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
      <SearchIcon
        width={18}
        height={18}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary"
      />

      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Harada oynamaq istəyirsən?"
        aria-label="Klub adı və ya ünvan üzrə axtar"
        enterKeyHint="search"
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-border-strong bg-surface pl-11 pr-11 text-sm font-medium text-ink shadow-sm outline-none transition placeholder:font-normal placeholder:text-faint hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10 md:h-10 md:rounded-control"
      />

      {value ? (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Axtarışı təmizlə"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-xl leading-none text-faint transition hover:bg-surface-alt hover:text-ink"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
