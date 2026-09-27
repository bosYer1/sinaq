import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public-server';
import type { District, ClubType } from '@/types/database';

const getCachedDistricts = cache(
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
);

/** Bütün rayonları əlifba sırası ilə qaytarır. */
export async function getDistricts(): Promise<District[]> {
  return getCachedDistricts();
}

const getCachedClubTypes = cache(
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
);

/** Klub tiplərini qaytarır (PC, PlayStation). */
export async function getClubTypes(): Promise<ClubType[]> {
  return getCachedClubTypes();
}
