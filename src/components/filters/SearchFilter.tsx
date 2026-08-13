'use client';

import { useEffect, useState } from 'react';
import { useFilters } from '@/hooks/useFilters';

/**
 * Klub adı/ünvanına görə axtarış. Hər hərfdə URL-i yeniləmək əvəzinə
 * 350ms debounce edir ki, server component hər klik zamanı yenidən fetch
 * etməsin.
 */
export function SearchFilter() {
  const { filters, setQuery } = useFilters();
  const [value, setValue] = useState(filters.q ?? '');

  // URL xaricdən dəyişəndə (məs. "Təmizlə" düyməsi) input-u sinxronlaşdır
  useEffect(() => {
    setValue(filters.q ?? '');
  }, [filters.q]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== (filters.q ?? '')) {
        setQuery(value.trim() || undefined);
      }
    }, 350);
    return () => clearTimeout(timeout);
    // filters.q qəsdən asılılıqlardan çıxarılıb — əks halda hər yeniləmədə debounce sıfırlanardı
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, setQuery]);

  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">🔍</span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Klub adı və ya ünvana görə axtar..."
        aria-label="Klub axtarışı"
        className="h-10 w-full rounded-full border border-border bg-surface pl-9 pr-3.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
      />
    </div>
  );
}
