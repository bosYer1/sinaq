import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ClubInsert = Database['public']['Tables']['clubs']['Insert'];

interface ClubsInsertBuilder {
  insert: (values: ClubInsert) => {
    select: (columns: string) => {
      single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
    };
  };
}

export interface AdminClubListItem {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_premium: boolean;
  district_id: string | null;
  district_name: string | null;
}

export interface AdminDistrictOption {
  id: string;
  name: string;
}

export interface NewClubInput {
  name: string;
  slug: string;
  description: string | null;
  district_id: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  instagram_url: string | null;
  is_premium: boolean;
  is_active: boolean;
}

export async function getAdminClubs(): Promise<AdminClubListItem[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, slug, is_active, is_premium, district_id, districts(name)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    is_active: row.is_active,
    is_premium: row.is_premium,
    district_id: row.district_id,
    district_name: row.districts?.name ?? null,
  }));
}

export async function getAdminDistricts(): Promise<AdminDistrictOption[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('districts')
    .select('id, name')
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data as AdminDistrictOption[];
}

export async function createClub(
  input: NewClubInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Supabase client yaradıla bilmədi.' };

  const payload: ClubInsert = {
    name: input.name,
    slug: input.slug,
    description: input.description ?? '',
    district_id: input.district_id,
    address: input.address ?? '',
    latitude: input.latitude,
    longitude: input.longitude,
    phone: input.phone ?? '',
    instagram_url: input.instagram_url ?? '',
    is_premium: input.is_premium,
    is_active: input.is_active,
  };

  const clubsTable = supabase.from('clubs') as unknown as ClubsInsertBuilder;
  const { data, error } = await clubsTable.insert(payload).select('id').single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Klub yaradıla bilmədi.' };
  }

  return { success: true, id: data.id };
}
