import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/config';
import { MOCK_DISTRICTS, MOCK_CLUB_TYPES } from '@/lib/mock-data';
import type { District, ClubType } from '@/types/database';

/** Bütün rayonları əlifba sırası ilə qaytarır (filtr dropdown-u üçün). */
export async function getDistricts(): Promise<District[]> {
  if (!isSupabaseConfigured()) {
    return [...MOCK_DISTRICTS].sort((a, b) => a.name.localeCompare(b.name, 'az'));
  }

  const supabase = createClient();
  const { data, error } = await supabase.from('districts').select('*').order('name', { ascending: true });

  if (error) {
    console.error('getDistricts xətası:', error.message);
    return [];
  }
  return data ?? [];
}

/** Klub tiplərini qaytarır (PC, PlayStation). */
export async function getClubTypes(): Promise<ClubType[]> {
  if (!isSupabaseConfigured()) {
    return [...MOCK_CLUB_TYPES].sort((a, b) => a.name.localeCompare(b.name, 'az'));
  }

  const supabase = createClient();
  const { data, error } = await supabase.from('club_types').select('*').order('name', { ascending: true });

  if (error) {
    console.error('getClubTypes xətası:', error.message);
    return [];
  }
  return data ?? [];
}
