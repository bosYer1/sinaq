import { createContext, useCallback, useContext, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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

export function reconcileFilters(filters: ClubFilters, clubs: Club[]) {
  const districtExists = !filters.district || clubs.some((club) => club.district?.slug === filters.district);
  const typeExists = !filters.type || clubs.some((club) => club.type_assignments.some((assignment) => assignment.club_type?.slug === filters.type));
  if (districtExists && typeExists) return filters;
  return {
    ...filters,
    district: districtExists ? filters.district : null,
    type: typeExists ? filters.type : null,
  };
}

export function ClubDataProvider({ children }: { children: ReactNode }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filters, setFilterState] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const deferredQuery = useDeferredValue(filters.query);
  const acceptClubs = useCallback((nextClubs: Club[]) => {
    setClubs(nextClubs);
    setFilterState((current) => reconcileFilters(current, nextClubs));
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const nextClubs = await fetchClubs();
      if (mounted.current) acceptClubs(nextClubs);
    } catch (reason) {
      if (mounted.current) setError(reason instanceof Error ? reason.message : 'Klub məlumatları alınmadı.');
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [acceptClubs]);

  useEffect(() => {
    let active = true;
    mounted.current = true;

    fetchClubs()
      .then((nextClubs) => {
        if (active) acceptClubs(nextClubs);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Klub məlumatları alınmadı.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      mounted.current = false;
    };
  }, [acceptClubs]);

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

  const filteredClubs = useMemo(
    () => filterClubs(clubs, { ...filters, query: deferredQuery }),
    [clubs, deferredQuery, filters],
  );
  const setFilters = useCallback((next: Partial<ClubFilters>) => {
    setFilterState((current) => ({ ...current, ...next }));
  }, []);
  const clearFilters = useCallback(() => setFilterState(INITIAL_FILTERS), []);
  const reload = useCallback(() => load(true), [load]);

  const value = useMemo<ClubDataValue>(() => ({
    clubs,
    filteredClubs,
    districts,
    types,
    filters,
    loading,
    refreshing,
    error,
    setFilters,
    clearFilters,
    reload,
  }), [clearFilters, clubs, districts, error, filteredClubs, filters, loading, refreshing, reload, setFilters, types]);

  return <ClubDataContext.Provider value={value}>{children}</ClubDataContext.Provider>;
}

export function useClubData() {
  const value = useContext(ClubDataContext);
  if (!value) throw new Error('useClubData ClubDataProvider daxilində istifadə olunmalıdır.');
  return value;
}
