import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public-server';
import type { District, ClubType } from '@/types/database';

const getCachedDistricts = unstable_cache(
  async (): Promise<District[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('districts')
      .select('*')
      .order('name', { ascending: true })
      .returns<District[]>();

    if (error) {
      console.error('getDistricts xətası:', error.message);
      return [];
    }

    return data ?? [];
  },
  ['gameyer-public-districts-v1'],
  { revalidate: 3600, tags: ['public-reference-data'] },
);

/** Bütün rayonları əlifba sırası ilə qaytarır. */
export async function getDistricts(): Promise<District[]> {
  return getCachedDistricts();
}

const getCachedClubTypes = unstable_cache(
  async (): Promise<ClubType[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('club_types')
      .select('*')
      .order('name', { ascending: true })
      .returns<ClubType[]>();

    if (error) {
      console.error('getClubTypes xətası:', error.message);
      return [];
    }

    return data ?? [];
  },
  ['gameyer-public-club-types-v1'],
  { revalidate: 3600, tags: ['public-reference-data'] },
);

/** Klub tiplərini qaytarır (PC, PlayStation). */
export async function getClubTypes(): Promise<ClubType[]> {
  return getCachedClubTypes();
}
