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
    setValue(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = value.trim();

      if (nextQuery === currentQuery) {
        return;
      }

      const params = new URLSearchParams(paramsString);

      if (nextQuery) {
        params.set('q', nextQuery);
      } else {
        params.delete('q');
      }

      const query = params.toString();

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value, currentQuery, paramsString, pathname, router]);

  return (
    <div className="relative w-full">
      <SearchIcon
        width={17}
        height={17}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
      />

      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Klub adı və ya ünvan axtar"
        aria-label="Klub axtar"
        className="h-10 w-full rounded-control border border-border-strong bg-surface pl-10 pr-9 text-sm text-ink outline-none transition placeholder:text-faint hover:border-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
      />

      {value ? (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Axtarışı təmizlə"
          className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-lg leading-none text-faint transition hover:bg-surface-alt hover:text-ink"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
