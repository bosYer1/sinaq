import { createClient } from '@/lib/supabase/server';
import type { District, ClubType } from '@/types/database';

/** Bütün rayonları əlifba sırası ilə qaytarır. */
export async function getDistricts(): Promise<District[]> {
  const supabase = await createClient();

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
}

/** Klub tiplərini qaytarır (PC, PlayStation). */
export async function getClubTypes(): Promise<ClubType[]> {
  const supabase = await createClient();

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
}
