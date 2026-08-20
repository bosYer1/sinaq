import { createContext, useCallback, useContext, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchClubs, filterClubs } from '@/lib/clubs';
import type { Club, ClubFilters, ClubType, District } from '@/types/club';

const INITIAL_FILTERS: ClubFilters = {
  query: '',
  district: null,
  type: null,
  verifiedOnly: false,
};

type ClubDataValue = {
  clubs: Club[];
  filteredClubs: Club[];
  districts: District[];
  types: ClubType[];
  filters: ClubFilters;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  setFilters: (next: Partial<ClubFilters>) => void;
  clearFilters: () => void;
  reload: () => Promise<void>;
};

const ClubDataContext = createContext<ClubDataValue | null>(null);

export function ClubDataProvider({ children }: { children: ReactNode }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filters, setFilterState] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(filters.query);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      setClubs(await fetchClubs());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Klub məlumatları alınmadı.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchClubs()
      .then((nextClubs) => {
        if (active) setClubs(nextClubs);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Klub məlumatları alınmadı.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const districts = useMemo(() => {
    const unique = new Map<string, District>();
    clubs.forEach((club) => {
      if (club.district) unique.set(club.district.id, club.district);
    });
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, 'az'));
  }, [clubs]);

  const types = useMemo(() => {
    const unique = new Map<string, ClubType>();
    clubs.forEach((club) => {
      club.type_assignments.forEach(({ club_type: type }) => {
        if (type) unique.set(type.id, type);
      });
    });
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, 'az'));
  }, [clubs]);

  const value = useMemo<ClubDataValue>(() => ({
    clubs,
    filteredClubs: filterClubs(clubs, { ...filters, query: deferredQuery }),
    districts,
    types,
    filters,
    loading,
    refreshing,
    error,
    setFilters: (next) => setFilterState((current) => ({ ...current, ...next })),
    clearFilters: () => setFilterState(INITIAL_FILTERS),
    reload: () => load(true),
  }), [clubs, deferredQuery, districts, error, filters, load, loading, refreshing, types]);

  return <ClubDataContext.Provider value={value}>{children}</ClubDataContext.Provider>;
}

export function useClubData() {
  const value = useContext(ClubDataContext);
  if (!value) throw new Error('useClubData ClubDataProvider daxilində istifadə olunmalıdır.');
  return value;
}
